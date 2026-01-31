"use client"

import { useEffect } from "react"
import { trpc } from "@/lib/trpc/client"
import { useRouteStore } from "@/stores/route-store"
import { useGameStore } from "@/stores/game-store"
import { asTitle, log } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import AddStartingPointDialog from "./AddStartingPointDialog"

export default function StartingPositionSelector() {
  const { startingPosition, setStartingPosition, setNamedLocations, namedLocations } = useRouteStore()
  const { initialisePlayers } = useGameStore()

  const { data: locations, refetch } = trpc.locations.getAll.useQuery()

  useEffect(() => {
    if (locations) {
      setNamedLocations(locations)
      log.debug("StartingPositionSelector:locations:", locations)
    }
  }, [locations, setNamedLocations])

  useEffect(() => {
    if (namedLocations.length > 0 && !startingPosition) {
      const firstLocation = namedLocations[0]
      log.debug("StartingPositionSelector:initialised to:", firstLocation)
      setStartingPosition(firstLocation)
    }
  }, [namedLocations, startingPosition, setStartingPosition])

  useEffect(() => {
    if (startingPosition) {
      initialisePlayers([startingPosition.lat, startingPosition.lng])
    }
  }, [startingPosition, initialisePlayers])

  function handleChange(value: string) {
    const selected = namedLocations.find((loc) => loc.name === value)
    if (selected) {
      setStartingPosition(selected)
    }
  }

  if (!locations || locations.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-muted-foreground">Starting Point</Label>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            No starting points yet - right-click on map or
          </p>
          <AddStartingPointDialog onSuccess={refetch} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label>Starting Point</Label>
      <div className="flex items-center gap-2">
        <Select value={startingPosition?.name || ""} onValueChange={handleChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select starting point" />
          </SelectTrigger>
          <SelectContent>
            {namedLocations.map((location) => (
              <SelectItem key={location.name} value={location.name}>
                {asTitle(location.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <AddStartingPointDialog onSuccess={refetch} />
      </div>
    </div>
  )
}
