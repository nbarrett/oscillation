"use client";

import { useCallback } from "react";
import { useSchoolStore } from "@/stores/school-store";
import { SCHOOL_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons";
import { api } from "@/lib/trpc/client";
import { type FetchedBounds } from "@/stores/poi-types";
import PoiMarkers from "./PoiMarkers";

export default function SchoolMarkers() {
  const trpcUtils = api.useUtils();
  const { schools, showSchools, schoolIconStyle, fetchedBounds, setSchools, setFetchedBounds, boundsContainedByFetched } = useSchoolStore();

  const fetchSchools = useCallback(
    (bounds: FetchedBounds) => trpcUtils.schools.inBounds.fetch(bounds),
    [trpcUtils]
  );

  return (
    <PoiMarkers
      label="Schools"
      colour={POI_COLOURS.school}
      items={schools}
      show={showSchools}
      iconStyle={schoolIconStyle}
      iconOptions={SCHOOL_ICON_OPTIONS}
      fetchedBounds={fetchedBounds}
      boundsContainedByFetched={boundsContainedByFetched}
      setItems={setSchools}
      setFetchedBounds={setFetchedBounds}
      fetchItems={fetchSchools}
    />
  );
}
