"use client";

import { useCallback } from "react";
import { useSpireStore } from "@/stores/church-store";
import { SPIRE_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons";
import { api } from "@/lib/trpc/client";
import { type FetchedBounds } from "@/stores/poi-types";
import PoiMarkers from "./PoiMarkers";

export default function SpireMarkers() {
  const trpcUtils = api.useUtils();
  const { spires, showSpires, spireIconStyle, fetchedBounds, setSpires, setFetchedBounds, boundsContainedByFetched } = useSpireStore();

  const fetchSpires = useCallback(
    (bounds: FetchedBounds) => trpcUtils.churches.spiresInBounds.fetch(bounds),
    [trpcUtils]
  );

  return (
    <PoiMarkers
      label="Spires"
      colour={POI_COLOURS.spire}
      items={spires}
      show={showSpires}
      iconStyle={spireIconStyle}
      iconOptions={SPIRE_ICON_OPTIONS}
      fetchedBounds={fetchedBounds}
      boundsContainedByFetched={boundsContainedByFetched}
      setItems={setSpires}
      setFetchedBounds={setFetchedBounds}
      fetchItems={fetchSpires}
    />
  );
}
