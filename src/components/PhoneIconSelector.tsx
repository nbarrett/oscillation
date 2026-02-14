"use client"

import { usePhoneStore } from "@/stores/phone-store"
import { PHONE_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons"
import PoiIconSelector from "./PoiIconSelector"

export default function PhoneIconSelector() {
  const { phoneIconStyle, setPhoneIconStyle } = usePhoneStore()

  return (
    <PoiIconSelector
      label="Phone Icon"
      colour={POI_COLOURS.phone}
      options={PHONE_ICON_OPTIONS}
      selected={phoneIconStyle}
      onSelect={setPhoneIconStyle}
    />
  )
}
