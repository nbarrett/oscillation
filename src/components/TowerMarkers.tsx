"use client";

import { useCallback } from "react";
import { useTowerStore } from "@/stores/church-store";
import { TOWER_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons";
import { api } from "@/lib/trpc/client";
import { type FetchedBounds } from "@/stores/poi-types";
import PoiMarkers from "./PoiMarkers";

export default function TowerMarkers() {
  const trpcUtils = api.useUtils();
  const { towers, showTowers, towerIconStyle, fetchedBounds, setTowers, setFetchedBounds, boundsContainedByFetched } = useTowerStore();

  const fetchTowers = useCallback(
    (bounds: FetchedBounds) => trpcUtils.churches.towersInBounds.fetch(bounds),
    [trpcUtils]
  );

  return (
    <PoiMarkers
      label="Towers"
      colour={POI_COLOURS.tower}
      items={towers}
      show={showTowers}
      iconStyle={towerIconStyle}
      iconOptions={TOWER_ICON_OPTIONS}
      fetchedBounds={fetchedBounds}
      boundsContainedByFetched={boundsContainedByFetched}
      setItems={setTowers}
      setFetchedBounds={setFetchedBounds}
      fetchItems={fetchTowers}
    />
  );
}
