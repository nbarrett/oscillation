"use client"

import { useSchoolStore } from "@/stores/school-store"
import { SCHOOL_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons"
import PoiIconSelector from "./PoiIconSelector"

export default function SchoolIconSelector() {
  const { schoolIconStyle, setSchoolIconStyle } = useSchoolStore()

  return (
    <PoiIconSelector
      label="School Icon"
      colour={POI_COLOURS.school}
      options={SCHOOL_ICON_OPTIONS}
      selected={schoolIconStyle}
      onSelect={setSchoolIconStyle}
    />
  )
}
