"use client"

import { useEffect } from "react"
import { useMapStore, MappingProvider, MAPPING_PROVIDER_LABELS } from "@/stores/map-store"
import { log } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const providerOptions = Object.values(MappingProvider)

export default function MappingProviderSelector() {
  const { mappingProvider, setMappingProvider } = useMapStore()

  useEffect(() => {
    log.debug("MappingProviderSelector:mappingProvider:", mappingProvider)
  }, [mappingProvider])

  return (
    <div className="space-y-2">
      <Label>Map Source</Label>
      <Select
        value={mappingProvider || ""}
        onValueChange={(value) => setMappingProvider(value as MappingProvider)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select source" />
        </SelectTrigger>
        <SelectContent>
          {providerOptions.map((value) => (
            <SelectItem key={value} value={value}>
              {MAPPING_PROVIDER_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
