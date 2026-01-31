"use client"

import { useState, useEffect } from "react"
import { useMapEvents } from "react-leaflet"
import { MapPin, Loader2, Copy, Check } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
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
} from "@/components/ui/dialog"

interface ContextMenuState {
  mouseX: number
  mouseY: number
  lat: number
  lng: number
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

export default function MapContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState("")
  const [isLoadingName, setIsLoadingName] = useState(false)
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [copied, setCopied] = useState(false)

  const utils = trpc.useUtils()
  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => {
      setDialogOpen(false)
      setName("")
      setPendingLocation(null)
      utils.locations.getAll.invalidate()
    },
  })

  useMapEvents({
    contextmenu(e) {
      e.originalEvent.preventDefault()
      setContextMenu({
        mouseX: e.originalEvent.clientX,
        mouseY: e.originalEvent.clientY,
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      })
    },
  })

  useEffect(() => {
    function handleClickOutside() {
      setContextMenu(null)
    }
    if (contextMenu) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [contextMenu])

  function handleAddStartingPoint() {
    if (!contextMenu) return

    setPendingLocation({ lat: contextMenu.lat, lng: contextMenu.lng })
    setContextMenu(null)
    setDialogOpen(true)
    setIsLoadingName(true)

    reverseGeocode(contextMenu.lat, contextMenu.lng)
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

  function handleDialogClose() {
    setDialogOpen(false)
    setName("")
    setPendingLocation(null)
  }

  function handleSave() {
    if (!pendingLocation || !name.trim()) return
    createLocation.mutate({
      name: name.trim(),
      lat: pendingLocation.lat,
      lng: pendingLocation.lng,
    })
  }

  function handleCopyLocation() {
    if (!pendingLocation) return
    const text = formatLatLong(pendingLocation)
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <>
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          style={{
            top: contextMenu.mouseY,
            left: contextMenu.mouseX,
          }}
        >
          <button
            onClick={handleAddStartingPoint}
            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            Add as Starting Point
          </button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Starting Point</DialogTitle>
            <DialogDescription>
              Add a new game starting location to the database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {pendingLocation && (
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Location: {formatLatLong(pendingLocation)}
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
              <Label htmlFor="location-name">Location Name</Label>
              <div className="relative">
                <Input
                  id="location-name"
                  autoFocus
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
            <Button variant="outline" onClick={handleDialogClose}>
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
    </>
  )
}
