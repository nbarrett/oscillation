"use client"

import { useSpireStore } from "@/stores/church-store"
import { SPIRE_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons"
import PoiIconSelector from "./PoiIconSelector"

export default function SpireIconSelector() {
  const { spireIconStyle, setSpireIconStyle } = useSpireStore()

  return (
    <PoiIconSelector
      label="Spire Icon"
      colour={POI_COLOURS.spire}
      options={SPIRE_ICON_OPTIONS}
      selected={spireIconStyle}
      onSelect={setSpireIconStyle}
    />
  )
}
