"use client"

import { usePoiSettingsStore } from "@/stores/poi-settings-store"
import { OBSTRUCTION_ICON_OPTIONS } from "@/stores/poi-icons"
import PoiIconSelector from "./PoiIconSelector"

export default function ObstructionIconSelector() {
  const { obstructionIconStyle, setObstructionIconStyle } = usePoiSettingsStore()

  return (
    <PoiIconSelector
      label="Obstruction Icon"
      colour="#ef4444"
      options={OBSTRUCTION_ICON_OPTIONS}
      selected={obstructionIconStyle}
      onSelect={setObstructionIconStyle}
    />
  )
}
