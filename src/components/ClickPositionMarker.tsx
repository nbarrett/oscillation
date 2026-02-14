"use client"

import { useState, useEffect } from "react"
import { Marker, Popup } from "react-leaflet"
import L from "leaflet"
import { MapPin, Loader2 } from "lucide-react"
import { useGameStore } from "@/stores/game-store"
import { trpc } from "@/lib/trpc/client"
import { formatLatLong, colours, log } from "@/lib/utils"
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

const clickIcon = new L.DivIcon({
  className: "click-marker",
  html: `<div style="
    width: 20px;
    height: 20px;
    background: ${colours.osMapsPurple};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

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

export default function ClickPositionMarker() {
  const { mapClickPosition, players } = useGameStore()
  const [locationName, setLocationName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editableName, setEditableName] = useState("")

  const utils = trpc.useUtils()
  const createLocation = trpc.locations.create.useMutation({
    onSuccess: () => {
      log.info("Starting point added successfully")
      setDialogOpen(false)
      setEditableName("")
      utils.locations.getAll.invalidate()
    },
    onError: (error) => {
      log.error("Failed to add starting point:", error)
    },
  })

  useEffect(() => {
    if (mapClickPosition?.latLng) {
      setIsLoading(true)
      setLocationName(null)
      reverseGeocode(mapClickPosition.latLng.lat, mapClickPosition.latLng.lng)
        .then((name) => {
          setLocationName(name)
          setIsLoading(false)
        })
        .catch((error) => {
          log.error("Failed to reverse geocode:", error)
          setLocationName("Unknown Location")
          setIsLoading(false)
        })
    }
  }, [mapClickPosition?.latLng?.lat, mapClickPosition?.latLng?.lng])

  function handleAddStartingPoint(e: React.MouseEvent) {
    e.stopPropagation()
    setEditableName(locationName || "")
    setDialogOpen(true)
  }

  function handleSave() {
    if (!mapClickPosition?.latLng || !editableName.trim()) return
    createLocation.mutate({
      name: editableName.trim(),
      lat: mapClickPosition.latLng.lat,
      lng: mapClickPosition.latLng.lng,
    })
  }

  if (!mapClickPosition?.latLng || players.length > 0) {
    return null
  }

  return (
    <>
      <Marker position={[mapClickPosition.latLng.lat, mapClickPosition.latLng.lng]} icon={clickIcon}>
        <Popup>
          <div className="text-center min-w-[180px] space-y-2">
            <p className="font-semibold text-base">
              {isLoading ? "Loading..." : locationName}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatLatLong(mapClickPosition.latLng)}
            </p>
            <Button
              size="sm"
              className="w-full mt-2"
              onClick={handleAddStartingPoint}
              disabled={isLoading}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Add as Starting Point
            </Button>
          </div>
        </Popup>
      </Marker>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Starting Point</DialogTitle>
            <DialogDescription>
              Add a new game starting location to the database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground">
              Location: {formatLatLong(mapClickPosition.latLng)}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-name">Location Name</Label>
              <Input
                id="location-name"
                autoFocus
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                placeholder="Enter location name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editableName.trim() || createLocation.isPending}>
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
