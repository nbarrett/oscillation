"use client"

import { useState, useEffect } from "react"
import { MapPin, Loader2, Copy, Check } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { useGameStore } from "@/stores/game-store"
import { formatLatLong, log } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AddStartingPointDialogProps {
  onSuccess: () => void
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  )
  const data = await response.json()

  if (data.address) {
    const { road, hamlet, village, town, city, suburb, county } = data.address
    const parts: string[] = []

    if (road) parts.push(road)
    if (hamlet) parts.push(hamlet)
    if (village) parts.push(village)
    if (suburb) parts.push(suburb)
    if (town) parts.push(town)
    if (city) parts.push(city)

    if (parts.length === 0 && county) {
      parts.push(county)
    }

    return parts.slice(0, 3).join(", ") || "Unknown Location"
  }
  return "Unknown Location"
}

export default function AddStartingPointDialog({ onSuccess }: AddStartingPointDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [isLoadingName, setIsLoadingName] = useState(false)
  const [copied, setCopied] = useState(false)

  const { mapClickPosition, mapCentre } = useGameStore()
  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => {
      setOpen(false)
      setName("")
      onSuccess()
    },
  })

  const currentPosition = mapClickPosition?.latLng || (mapCentre ? { lat: mapCentre[0], lng: mapCentre[1] } : null)

  useEffect(() => {
    if (open && currentPosition && !name) {
      setIsLoadingName(true)
      reverseGeocode(currentPosition.lat, currentPosition.lng)
        .then((placeName) => {
          setName(placeName)
          setIsLoadingName(false)
        })
        .catch((error) => {
          log.error("Failed to reverse geocode:", error)
          setName("")
          setIsLoadingName(false)
        })
    }
  }, [open, currentPosition])

  function handleOpen() {
    setName("")
    setOpen(true)
  }

  function handleSave() {
    if (!currentPosition || !name.trim()) return
    createLocation.mutate({
      name: name.trim(),
      lat: currentPosition.lat,
      lng: currentPosition.lng,
    })
  }

  function handleCopyLocation() {
    if (!currentPosition) return
    const text = formatLatLong(currentPosition)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const hasPosition = !!currentPosition

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasPosition}
              onClick={handleOpen}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {hasPosition ? "Add current location as starting point" : "Click on map first to set a location"}
        </TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Starting Point</DialogTitle>
          <DialogDescription>
            Add a new game starting location to the database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentPosition && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Location: {formatLatLong(currentPosition)}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleCopyLocation}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Location Name</Label>
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoadingName}
                placeholder="Enter location name"
              />
              {isLoadingName && (
                <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || createLocation.isPending}>
            {createLocation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
