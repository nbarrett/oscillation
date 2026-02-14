"use client";

import { useCallback } from "react";
import { usePhoneStore } from "@/stores/phone-store";
import { PHONE_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons";
import { api } from "@/lib/trpc/client";
import { type FetchedBounds } from "@/stores/poi-types";
import PoiMarkers from "./PoiMarkers";

export default function PhoneMarkers() {
  const trpcUtils = api.useUtils();
  const { phones, showPhones, phoneIconStyle, fetchedBounds, setPhones, setFetchedBounds, boundsContainedByFetched } = usePhoneStore();

  const fetchPhones = useCallback(
    (bounds: FetchedBounds) => trpcUtils.phones.inBounds.fetch(bounds),
    [trpcUtils]
  );

  return (
    <PoiMarkers
      label="Phones"
      colour={POI_COLOURS.phone}
      items={phones}
      show={showPhones}
      iconStyle={phoneIconStyle}
      iconOptions={PHONE_ICON_OPTIONS}
      fetchedBounds={fetchedBounds}
      boundsContainedByFetched={boundsContainedByFetched}
      setItems={setPhones}
      setFetchedBounds={setFetchedBounds}
      fetchItems={fetchPhones}
    />
  );
}
