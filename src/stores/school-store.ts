import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PoiItem, type FetchedBounds, boundsContained } from "./poi-types";
import { SchoolIconStyle } from "./poi-icons";

export { SchoolIconStyle };
export type School = PoiItem;

interface SchoolState {
  schools: School[];
  fetchedBounds: FetchedBounds | null;
  showSchools: boolean;
  schoolIconStyle: SchoolIconStyle;

  setSchools: (schools: School[]) => void;
  setFetchedBounds: (bounds: FetchedBounds) => void;
  setShowSchools: (show: boolean) => void;
  setSchoolIconStyle: (style: SchoolIconStyle) => void;
  boundsContainedByFetched: (bounds: FetchedBounds) => boolean;
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set, get) => ({
      schools: [],
      fetchedBounds: null,
      showSchools: true,
      schoolIconStyle: SchoolIconStyle.BUILDING,

      setSchools: (schools) => set({ schools }),
      setFetchedBounds: (fetchedBounds) => set({ fetchedBounds }),
      setShowSchools: (showSchools) => set({ showSchools }),
      setSchoolIconStyle: (schoolIconStyle) => set({ schoolIconStyle }),

      boundsContainedByFetched: (bounds) => boundsContained(bounds, get().fetchedBounds),
    }),
    {
      name: "oscillation-schools",
      partialize: (state) => ({
        schoolIconStyle: state.schoolIconStyle,
        showSchools: state.showSchools,
      }),
    }
  )
);
