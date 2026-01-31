"use client"

import { useEffect } from "react"
import { useMapStore, MapLayer, MapLayers, MappingProvider } from "@/stores/map-store"
import { log } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const mapLayerOptions = Object.values(MapLayer)

export default function MapLayerSelector() {
  const { mapLayer, mappingProvider, setMapLayer } = useMapStore()

  useEffect(() => {
    if (!mapLayer) {
      log.debug("MapLayerSelector:mapLayer:initialised to:", MapLayer.OUTDOOR_3857)
      setMapLayer(MapLayer.OUTDOOR_3857)
    }
  }, [mapLayer, setMapLayer])

  useEffect(() => {
    log.debug("MapLayerSelector:mapLayer:", mapLayer)
  }, [mapLayer])

  const isDisabled = mappingProvider === MappingProvider.OPEN_STREET_MAPS

  return (
    <div className="space-y-2">
      <Label className={isDisabled ? "text-muted-foreground" : ""}>Map Layer</Label>
      <Select
        value={mapLayer || ""}
        onValueChange={(value) => setMapLayer(value as MapLayer)}
        disabled={isDisabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select layer" />
        </SelectTrigger>
        <SelectContent>
          {mapLayerOptions.map((value) => {
            const attribute = MapLayers[value]
            return (
              <SelectItem key={attribute.name} value={attribute.name}>
                {attribute.displayName}
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    </div>
  )
}
