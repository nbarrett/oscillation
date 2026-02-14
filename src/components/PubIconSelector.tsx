"use client"

import { usePubStore } from "@/stores/pub-store"
import { PUB_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons"
import PoiIconSelector from "./PoiIconSelector"

export default function PubIconSelector() {
  const { pubIconStyle, setPubIconStyle } = usePubStore()

  return (
    <PoiIconSelector
      label="Pub Icon"
      colour={POI_COLOURS.pub}
      options={PUB_ICON_OPTIONS}
      selected={pubIconStyle}
      onSelect={setPubIconStyle}
    />
  )
}
