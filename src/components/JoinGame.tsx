"use client"

import { useState, useEffect, useRef } from "react"
import { useSession, signIn } from "next-auth/react"
import { Users, Plus, LogIn, Check, Loader2, UserPlus, ChevronLeft, ChevronRight, X, Shuffle, Search } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore } from "@/stores/game-store"
import { useCarStore, carLabelForStyle, CAR_ICON_OPTIONS, type CarStyle } from "@/stores/car-store"
import CarIconSelector from "./CarIconSelector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPreviewHeader } from "@/components/ui/map-preview"

export enum AuthTab {
  PLAY = "play",
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

import { cn } from "@/lib/cn"
import IconDetailToggle from "./IconDetailToggle"
import AddStartingPointDialog from "./AddStartingPointDialog"
import { asTitle, timeAgo } from "@/lib/utils"
import { type AreaSize, AREA_SIZES, AREA_SIZE_PRESETS, DEFAULT_AREA_SIZE } from "@/lib/area-size"
import { POI_CATEGORIES, POI_CATEGORY_LABELS, MIN_POIS_PER_CATEGORY, type PoiValidationResult } from "@/lib/poi-categories"

const STEP_LABELS = ["Player", "Location", "Settings", "Review"] as const

const VALIDATION_CACHE_KEY = "oscillation-area-validation"
const VALIDATION_CACHE_MAX_AGE = 24 * 60 * 60 * 1000

function validationCacheKey(lat: number, lng: number, areaSize: string) {
  return `${lat.toFixed(5)}_${lng.toFixed(5)}_${areaSize}`
}

function loadValidationCache(lat: number, lng: number, areaSize: string) {
  try {
    const raw = localStorage.getItem(VALIDATION_CACHE_KEY)
    if (!raw) return undefined
    const cache = JSON.parse(raw) as Record<string, { data: unknown; ts: number }>
    const entry = cache[validationCacheKey(lat, lng, areaSize)]
    if (entry && Date.now() - entry.ts < VALIDATION_CACHE_MAX_AGE) {
      return entry.data
    }
  } catch { /* ignore */ }
  return undefined
}

function saveValidationCache(lat: number, lng: number, areaSize: string, data: unknown) {
  try {
    const raw = localStorage.getItem(VALIDATION_CACHE_KEY)
    const cache = raw ? JSON.parse(raw) as Record<string, { data: unknown; ts: number }> : {}
    cache[validationCacheKey(lat, lng, areaSize)] = { data, ts: Date.now() }
    localStorage.setItem(VALIDATION_CACHE_KEY, JSON.stringify(cache))
  } catch { /* ignore */ }
}

interface JoinGameProps {
  startingPosition: [number, number] | null
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  )
}

function PinInput({ id, name, value, onChange, placeholder, disabled, error }: {
  id: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  disabled: boolean
  error?: boolean
}) {
  return (
    <Input
      id={id}
      name={name}
      type="password"
      inputMode="numeric"
      maxLength={4}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
      disabled={disabled}
      autoComplete="new-password"
      data-form-type="other"
      className={error ? "border-destructive focus-visible:ring-destructive" : ""}
    />
  )
}

function StepIndicator({ currentStep, onStepClick }: { currentStep: number; onStepClick: (step: number) => void }) {
  return (
    <div className="flex items-center w-full">
      {STEP_LABELS.map((label, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isClickable = index <= currentStep
        const isLast = index === STEP_LABELS.length - 1
        return (
          <div key={label} className={cn("flex items-center", isLast ? "" : "flex-1")}>
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => onStepClick(index)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                isCompleted && "bg-primary/15 text-primary cursor-pointer hover:bg-primary/25",
                isActive && "bg-primary text-primary-foreground",
                !isCompleted && !isActive && "bg-muted text-muted-foreground cursor-default",
              )}
            >
              {isCompleted && <Check className="h-3 w-3" />}
              {label}
            </button>
            {!isLast && (
              <div className={cn(
                "flex-1 h-0.5 mx-1",
                isCompleted ? "bg-primary/30" : "bg-muted",
              )} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  )
}

export default function JoinGame({ startingPosition }: JoinGameProps) {
  const { data: session } = useSession()

  const [mode, setMode] = useState<"welcome" | "create" | "join">("welcome")
  const [createStep, setCreateStep] = useState(0)
  const [playerName, setPlayerName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [createdCode, setCreatedCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)
  const [loginNickname, setLoginNickname] = useState("")
  const [loginPin, setLoginPin] = useState("")
  const [registerNickname, setRegisterNickname] = useState("")
  const [registerPin, setRegisterPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [selectedLocationId, setSelectedLocationId] = useState<string>("")
  const [locationSearch, setLocationSearch] = useState("")
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const locationRef = useRef<HTMLDivElement>(null)
  const [areaSize, setAreaSize] = useState<AreaSize>(DEFAULT_AREA_SIZE)
  const [botsEnabled, setBotsEnabled] = useState(false)

  const { setSessionId, setPlayerId, setSessionCode, setCreatorPlayerId, showPreviewPaths, setShowPreviewPaths: showPreviewPathsSetter } = useGameStore()
  const { preferredCar, setPreferredCar } = useCarStore()
  const { data: locations, refetch: refetchLocations } = trpc.locations.getAll.useQuery()
  const { data: availableGames } = trpc.game.list.useQuery(undefined, {
    refetchInterval: 5000,
    refetchOnWindowFocus: false,
  })

  const [authTab, setAuthTabState] = useState<AuthTab>(AuthTab.PLAY)

  const pinMismatch = confirmPin.length > 0 && registerPin !== confirmPin
  const sortedLocations = (locations ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))

  const filteredLocations = sortedLocations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  )
  const selectedLocation = locations?.find(l => l.id === selectedLocationId)

  const cachedValidation = selectedLocation
    ? loadValidationCache(selectedLocation.lat, selectedLocation.lng, areaSize)
    : undefined

  const validation = trpc.game.validateArea.useQuery(
    { lat: selectedLocation?.lat ?? 0, lng: selectedLocation?.lng ?? 0, areaSize },
    {
      enabled: mode === "create" && !!selectedLocation,
      staleTime: 5 * 60 * 1000,
      initialData: cachedValidation as PoiValidationResult | undefined,
    },
  )

  useEffect(() => {
    if (validation.data && selectedLocation) {
      saveValidationCache(selectedLocation.lat, selectedLocation.lng, areaSize, validation.data)
    }
  }, [validation.data, selectedLocation, areaSize])

  function setAuthTab(tab: AuthTab) {
    setAuthTabState(tab)
    setError(null)
  }

  useEffect(() => {
    const savedNickname = localStorage.getItem("oscillation-last-nickname")
    if (savedNickname && !loginNickname) {
      setLoginNickname(savedNickname)
    }
  }, [])

  useEffect(() => {
    if (locations?.length && !selectedLocationId) {
      setSelectedLocationId(locations[0].id)
    }
  }, [locations, selectedLocationId])

  useEffect(() => {
    if (session?.user?.nickname && !playerName) {
      setPlayerName(session.user.nickname)
    }
  }, [session?.user?.nickname, playerName])

  const joinGameTakenCars = availableGames?.find(g => g.code === joinCode)?.takenCars ?? []
  useEffect(() => {
    if (mode === "join" && joinGameTakenCars.includes(preferredCar)) {
      const free = CAR_ICON_OPTIONS.find(o => !joinGameTakenCars.includes(o.style))
      if (free) {
        setPreferredCar(free.style as CarStyle)
      }
    }
  }, [joinCode, joinGameTakenCars, preferredCar, mode, setPreferredCar])

  const register = trpc.auth.register.useMutation({
    onSuccess: async (_, variables) => {
      const result = await signIn("credentials", {
        nickname: variables.nickname,
        pin: variables.pin,
        redirect: false,
      })
      if (result?.ok) {
        setPlayerName(variables.nickname)
        setAuthTab(AuthTab.PLAY)
        setError(null)
      } else {
        setError("Registration successful but login failed")
      }
      setIsAuthLoading(false)
    },
    onError: (err) => {
      setError(err.message)
      setIsAuthLoading(false)
    },
  })

  const createGame = trpc.game.create.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setPlayerId(data.playerId)
      setSessionCode(data.code)
      setCreatorPlayerId(data.creatorPlayerId)
      setCreatedCode(data.code)
    },
    onError: (err) => setError(err.message),
  })

  const joinGame = trpc.game.join.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId)
      setPlayerId(data.playerId)
      setSessionCode(data.code)
    },
    onError: (err) => setError(err.message),
  })

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsAuthLoading(true)
    setError(null)

    if (!loginNickname.trim()) {
      setError("Please enter your nickname")
      setIsAuthLoading(false)
      return
    }

    if (!loginPin || !/^\d{4}$/.test(loginPin)) {
      setError("Please enter a valid 4-digit PIN")
      setIsAuthLoading(false)
      return
    }

    const result = await signIn("credentials", {
      nickname: loginNickname,
      pin: loginPin,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid nickname or PIN")
      setIsAuthLoading(false)
      return
    }

    if (result?.ok) {
      localStorage.setItem("oscillation-last-nickname", loginNickname)
      setPlayerName(loginNickname)
      setAuthTab(AuthTab.PLAY)
      setLoginPin("")
    }
    setIsAuthLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setIsAuthLoading(true)
    setError(null)

    if (!registerNickname.trim()) {
      setError("Please enter a nickname")
      setIsAuthLoading(false)
      return
    }

    if (!registerPin || !/^\d{4}$/.test(registerPin)) {
      setError("Please enter a valid 4-digit PIN")
      setIsAuthLoading(false)
      return
    }

    if (registerPin !== confirmPin) {
      setError("PINs do not match")
      setIsAuthLoading(false)
      return
    }

    register.mutate({ nickname: registerNickname, pin: registerPin })
  }

  function pickRandomLocation() {
    if (sortedLocations.length === 0) return
    const randomIndex = Math.floor(Math.random() * sortedLocations.length)
    const picked = sortedLocations[randomIndex]
    setSelectedLocationId(picked.id)
    setLocationSearch(asTitle(picked.name))
    setLocationDropdownOpen(false)
  }

  function selectLocation(location: { id: string; name: string }) {
    setSelectedLocationId(location.id)
    setLocationSearch(asTitle(location.name))
    setLocationDropdownOpen(false)
  }

  function validateStep(step: number): boolean {
    setError(null)
    if (step === 0 && !playerName.trim()) {
      setError("Please enter your name")
      return false
    }
    if (step === 1 && !selectedLocation) {
      setError("Please select a starting point")
      return false
    }
    return true
  }

  const lastStep = STEP_LABELS.length - 1

  function nextStep() {
    if (!validateStep(createStep)) return
    setCreateStep(createStep + 1)
  }

  function prevStep() {
    setError(null)
    setCreateStep(createStep - 1)
  }

  function handleCreate() {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }
    if (!selectedLocation) {
      setError("Please select a starting point")
      return
    }
    setError(null)
    createGame.mutate({
      playerName: playerName.trim(),
      startLat: selectedLocation.lat,
      startLng: selectedLocation.lng,
      iconType: preferredCar,
      areaSize,
      botsEnabled,
    })
  }

  function handleJoin() {
    if (!playerName.trim()) {
      setError("Please enter your name")
      return
    }
    if (joinCode.length !== 6) {
      setError("Please enter a 6-character game code")
      return
    }
    setError(null)
    joinGame.mutate({
      code: joinCode.toUpperCase(),
      playerName: playerName.trim(),
      iconType: preferredCar,
    })
  }

  function copyCode() {
    if (createdCode) {
      navigator.clipboard.writeText(createdCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function goBack() {
    if (mode === "create" && createStep > 0) {
      prevStep()
      return
    }
    setMode("welcome")
    setCreateStep(0)
    setError(null)
  }

  if (createdCode) {
    return null
  }

  if (mode === "create") {
    const preset = AREA_SIZE_PRESETS[areaSize]
    return (
      <div className="w-full max-w-2xl lg:max-w-4xl mx-auto rounded-lg border bg-card">
        <div className="overflow-hidden rounded-t-lg">
          <MapPreviewHeader height="h-80" />
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Game
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {STEP_LABELS[createStep]}
              </p>
            </div>
          </div>

          <StepIndicator currentStep={createStep} onStepClick={setCreateStep} />

          {createStep === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="player-name">Your Name</Label>
                <Input
                  id="player-name"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  autoFocus
                />
              </div>
              <CarIconSelector />
            </div>
          )}

          {createStep === 1 && (
            <div className="space-y-2">
              <Label>Starting Point</Label>
              <p className="text-xs text-muted-foreground">Must be on an A road (pink) or B road (brown/yellow)</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1" ref={locationRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Type to search locations..."
                    value={locationSearch}
                    onChange={(e) => {
                      setLocationSearch(e.target.value)
                      setLocationDropdownOpen(true)
                      if (!e.target.value.trim()) {
                        setSelectedLocationId("")
                      }
                    }}
                    onFocus={() => setLocationDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 150)}
                    className="pl-9"
                  />
                  {locationSearch && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setLocationSearch("")
                        setSelectedLocationId("")
                        setLocationDropdownOpen(true)
                      }}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                  {locationDropdownOpen && filteredLocations.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto rounded-md border bg-popover shadow-md">
                      {filteredLocations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectLocation(location)}
                          className={cn(
                            "w-full px-3 py-2 text-sm text-left transition-colors",
                            "hover:bg-muted border-b last:border-b-0",
                            selectedLocationId === location.id && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          {asTitle(location.name)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={pickRandomLocation}
                  disabled={sortedLocations.length === 0}
                  title="Random starting point"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
                <AddStartingPointDialog onSuccess={refetchLocations} />
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Game Area Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AREA_SIZES.map((size) => {
                    const sizePreset = AREA_SIZE_PRESETS[size];
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setAreaSize(size)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-colors",
                          areaSize === size
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-muted"
                        )}
                      >
                        <div className="font-semibold text-sm">{sizePreset.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {sizePreset.widthKm}x{sizePreset.heightKm} km
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sizePreset.recommendedPlayers}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Bots</Label>
                <p className="text-xs text-muted-foreground">Fill empty slots with bots when starting a game</p>
                <div className="flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setBotsEnabled(true)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-xs font-medium transition-colors",
                      botsEnabled
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    On
                  </button>
                  <button
                    type="button"
                    onClick={() => setBotsEnabled(false)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-xs font-medium transition-colors",
                      !botsEnabled
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Off
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Preview Paths</Label>
                <div className="flex rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => showPreviewPathsSetter(true)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-xs font-medium transition-colors",
                      showPreviewPaths
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    On
                  </button>
                  <button
                    type="button"
                    onClick={() => showPreviewPathsSetter(false)}
                    className={cn(
                      "flex-1 px-3 py-1.5 text-xs font-medium transition-colors",
                      !showPreviewPaths
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    Off
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Show reachable paths and endpoints after rolling dice
                </p>
              </div>

              <IconDetailToggle />
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <SummaryItem label="Name" value={playerName} />
                <SummaryItem label="Car" value={carLabelForStyle(preferredCar)} />
                <SummaryItem label="Location" value={selectedLocation ? asTitle(selectedLocation.name) : "—"} />
                <SummaryItem label="Area Size" value={`${preset.label} (${preset.widthKm}x${preset.heightKm} km)`} />
                <SummaryItem label="Bots" value={botsEnabled ? "On" : "Off"} />
                <SummaryItem label="Preview Paths" value={showPreviewPaths ? "On" : "Off"} />
              </div>

              {selectedLocation && (
                <div className="space-y-2">
                  <Label>POI Coverage</Label>
                  {validation.isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking area...
                    </div>
                  ) : validation.data ? (
                    <div className="space-y-1">
                      <div className="grid grid-cols-2 gap-1">
                        {POI_CATEGORIES.map((cat) => {
                          const count = validation.data!.counts[cat];
                          const present = count >= MIN_POIS_PER_CATEGORY;
                          return (
                            <div key={cat} className="flex items-center gap-1.5 text-sm">
                              {present ? (
                                <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              ) : (
                                <X className="h-3.5 w-3.5 text-destructive shrink-0" />
                              )}
                              <span className={present ? "text-foreground" : "text-destructive"}>
                                {POI_CATEGORY_LABELS[cat]} ({count})
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex items-center gap-1.5 text-sm">
                          {validation.data.hasMotorway ? (
                            <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                          <span className={validation.data.hasMotorway ? "text-foreground" : "text-destructive"}>
                            Motorway
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm">
                          {validation.data.hasRailway ? (
                            <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                          ) : (
                            <X className="h-3.5 w-3.5 text-destructive shrink-0" />
                          )}
                          <span className={validation.data.hasRailway ? "text-foreground" : "text-destructive"}>
                            Railway
                          </span>
                        </div>
                      </div>
                      {!validation.data.valid && (
                        <div className="space-y-3 mt-2">
                          <p className="text-xs text-destructive">
                            Missing requirements — choose a different location or larger area
                          </p>
                          <div className="space-y-2">
                            <Label className="text-xs">Change Location</Label>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1" ref={locationRef}>
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Type to search locations..."
                                  value={locationSearch}
                                  onChange={(e) => {
                                    setLocationSearch(e.target.value)
                                    setLocationDropdownOpen(true)
                                    if (!e.target.value.trim()) {
                                      setSelectedLocationId("")
                                    }
                                  }}
                                  onFocus={() => setLocationDropdownOpen(true)}
                                  onBlur={() => setTimeout(() => setLocationDropdownOpen(false), 150)}
                                  className="pl-9 h-8 text-sm"
                                />
                                {locationDropdownOpen && filteredLocations.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-md border bg-popover shadow-md">
                                    {filteredLocations.map((location) => (
                                      <button
                                        key={location.id}
                                        type="button"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => selectLocation(location)}
                                        className={cn(
                                          "w-full px-3 py-1.5 text-xs text-left transition-colors",
                                          "hover:bg-muted border-b last:border-b-0",
                                          selectedLocationId === location.id && "bg-primary/10 text-primary font-medium"
                                        )}
                                      >
                                        {asTitle(location.name)}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={pickRandomLocation}
                                disabled={sortedLocations.length === 0}
                                title="Random starting point"
                              >
                                <Shuffle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Change Area Size</Label>
                            <div className="grid grid-cols-4 gap-1">
                              {AREA_SIZES.map((size) => {
                                const sizePreset = AREA_SIZE_PRESETS[size];
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => setAreaSize(size)}
                                    className={cn(
                                      "px-2 py-1.5 rounded border text-center transition-colors",
                                      areaSize === size
                                        ? "border-primary bg-primary/5 font-medium"
                                        : "border-input hover:bg-muted"
                                    )}
                                  >
                                    <div className="text-xs font-medium">{sizePreset.label}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {sizePreset.widthKm}x{sizePreset.heightKm}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-1" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" />
              {createStep === 0 ? "Back" : "Previous"}
            </Button>
            {createStep < lastStep ? (
              <Button className="gap-1" onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="gap-2"
                onClick={handleCreate}
                disabled={createGame.isPending || !validation.data?.valid}
              >
                {(createGame.isPending || validation.isLoading) && <Loader2 className="h-4 w-4 animate-spin" />}
                {validation.isLoading ? "Checking area..." : !validation.data?.valid ? "Area invalid" : "Create Game"}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (mode === "join") {
    return (
      <div className="w-full max-w-2xl lg:max-w-4xl mx-auto overflow-hidden rounded-lg border bg-card">
        <MapPreviewHeader height="h-80" />
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Join Game
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the code shared by the game host
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="player-name">Your Name</Label>
            <Input
              id="player-name"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-4">
            {availableGames && availableGames.filter(g => g.phase !== "ended").length > 0 && (
              <div className="space-y-2">
                <Label>Available Games</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableGames.filter(g => g.phase !== "ended").map((game) => (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => setJoinCode(game.code)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-colors",
                        joinCode === game.code
                          ? "border-primary bg-primary/5"
                          : "border-input hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold tracking-wider">{game.code}</span>
                        <span className="text-sm text-muted-foreground">
                          {game.playerCount} {game.playerCount === 1 ? "player" : "players"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                        <span>{game.playerNames.join(", ")}</span>
                        <div className="flex flex-col items-end text-xs">
                          <span>Created {timeAgo(game.createdAt)}</span>
                          <span>Last played {timeAgo(game.updatedAt)}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="game-code">
                {availableGames && availableGames.filter(g => g.phase !== "ended").length > 0 ? "Or enter code manually" : "Game Code"}
              </Label>
              <Input
                id="game-code"
                placeholder="e.g. ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                className="font-mono text-lg tracking-widest uppercase"
              />
            </div>
          </div>

          <CarIconSelector takenCars={availableGames?.find(g => g.code === joinCode)?.takenCars ?? []} />

          {error && <ErrorMessage message={error} />}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-1" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              className="gap-2"
              onClick={handleJoin}
              disabled={joinGame.isPending}
            >
              {joinGame.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Join Game
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="w-full max-w-2xl lg:max-w-4xl mx-auto overflow-hidden rounded-lg border bg-card">
        <MapPreviewHeader height="h-80" />
        <div className="p-6">
          <Tabs value={authTab === AuthTab.PLAY ? AuthTab.SIGN_IN : authTab} onValueChange={(v) => setAuthTab(v as AuthTab)}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value={AuthTab.SIGN_IN} className="gap-1.5">
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value={AuthTab.REGISTER} className="gap-1.5">
                <UserPlus className="h-3.5 w-3.5" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value={AuthTab.SIGN_IN} className="mt-0">
              <form onSubmit={handleLogin} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-nickname">Nickname</Label>
                  <Input
                    id="login-nickname"
                    placeholder="Enter your nickname"
                    value={loginNickname}
                    onChange={(e) => setLoginNickname(e.target.value)}
                    disabled={isAuthLoading}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-pin">PIN</Label>
                  <PinInput
                    id="login-pin"
                    name="login-pin"
                    placeholder="4-digit PIN"
                    value={loginPin}
                    onChange={setLoginPin}
                    disabled={isAuthLoading}
                  />
                </div>
                {error && <ErrorMessage message={error} />}
                <Button type="submit" className="w-full" disabled={isAuthLoading}>
                  {isAuthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isAuthLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value={AuthTab.REGISTER} className="mt-0">
              <form onSubmit={handleRegister} noValidate className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nickname">Nickname</Label>
                  <Input
                    id="register-nickname"
                    placeholder="Choose a nickname"
                    value={registerNickname}
                    onChange={(e) => setRegisterNickname(e.target.value)}
                    disabled={isAuthLoading}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-pin">PIN</Label>
                  <PinInput
                    id="register-pin"
                    name="register-pin"
                    placeholder="4-digit PIN"
                    value={registerPin}
                    onChange={setRegisterPin}
                    disabled={isAuthLoading}
                    error={pinMismatch}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pin">Confirm PIN</Label>
                  <PinInput
                    id="confirm-pin"
                    name="confirm-pin"
                    placeholder="Confirm PIN"
                    value={confirmPin}
                    onChange={setConfirmPin}
                    disabled={isAuthLoading}
                    error={pinMismatch}
                  />
                </div>
                {pinMismatch && <ErrorMessage message="PINs do not match" />}
                {error && !pinMismatch && <ErrorMessage message={error} />}
                <Button type="submit" className="w-full" disabled={isAuthLoading || pinMismatch}>
                  {isAuthLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {isAuthLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl lg:max-w-4xl mx-auto overflow-hidden rounded-lg border bg-card">
      <MapPreviewHeader height="h-80" />
      <div className="p-6">
        <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as AuthTab)}>
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value={AuthTab.PLAY} className="gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Play
            </TabsTrigger>
          </TabsList>

          <TabsContent value={AuthTab.PLAY} className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="play-name">Your Name</Label>
              <Input
                id="play-name"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              {session?.user && (
                <p className="text-xs text-muted-foreground">Signed in as {session.user.nickname}</p>
              )}
            </div>

            {error && <ErrorMessage message={error} />}

            <div className="grid grid-cols-2 gap-3">
              <Button size="lg" className="gap-2" onClick={() => setMode("create")}>
                <Plus className="h-4 w-4" />
                Create Game
              </Button>
              <Button size="lg" variant="outline" className="gap-2" onClick={() => setMode("join")}>
                <LogIn className="h-4 w-4" />
                Join Game
              </Button>
            </div>

          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
