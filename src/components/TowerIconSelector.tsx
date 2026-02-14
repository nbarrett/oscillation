"use client"

import { useTowerStore } from "@/stores/church-store"
import { TOWER_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons"
import PoiIconSelector from "./PoiIconSelector"

export default function TowerIconSelector() {
  const { towerIconStyle, setTowerIconStyle } = useTowerStore()

  return (
    <PoiIconSelector
      label="Tower Icon"
      colour={POI_COLOURS.tower}
      options={TOWER_ICON_OPTIONS}
      selected={towerIconStyle}
      onSelect={setTowerIconStyle}
    />
  )
}
