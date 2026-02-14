import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PoiItem, type FetchedBounds, boundsContained } from "./poi-types";
import { SpireIconStyle, TowerIconStyle } from "./poi-icons";

export { SpireIconStyle, TowerIconStyle };
export type Church = PoiItem;

interface SpireState {
  spires: Church[];
  fetchedBounds: FetchedBounds | null;
  showSpires: boolean;
  spireIconStyle: SpireIconStyle;

  setSpires: (spires: Church[]) => void;
  setFetchedBounds: (bounds: FetchedBounds) => void;
  setShowSpires: (show: boolean) => void;
  setSpireIconStyle: (style: SpireIconStyle) => void;
  boundsContainedByFetched: (bounds: FetchedBounds) => boolean;
}

export const useSpireStore = create<SpireState>()(
  persist(
    (set, get) => ({
      spires: [],
      fetchedBounds: null,
      showSpires: true,
      spireIconStyle: SpireIconStyle.GOTHIC,

      setSpires: (spires) => set({ spires }),
      setFetchedBounds: (fetchedBounds) => set({ fetchedBounds }),
      setShowSpires: (showSpires) => set({ showSpires }),
      setSpireIconStyle: (spireIconStyle) => set({ spireIconStyle }),

      boundsContainedByFetched: (bounds) => boundsContained(bounds, get().fetchedBounds),
    }),
    {
      name: "oscillation-spires",
      partialize: (state) => ({
        spireIconStyle: state.spireIconStyle,
        showSpires: state.showSpires,
      }),
    }
  )
);

interface TowerState {
  towers: Church[];
  fetchedBounds: FetchedBounds | null;
  showTowers: boolean;
  towerIconStyle: TowerIconStyle;

  setTowers: (towers: Church[]) => void;
  setFetchedBounds: (bounds: FetchedBounds) => void;
  setShowTowers: (show: boolean) => void;
  setTowerIconStyle: (style: TowerIconStyle) => void;
  boundsContainedByFetched: (bounds: FetchedBounds) => boolean;
}

export const useTowerStore = create<TowerState>()(
  persist(
    (set, get) => ({
      towers: [],
      fetchedBounds: null,
      showTowers: true,
      towerIconStyle: TowerIconStyle.CASTLE,

      setTowers: (towers) => set({ towers }),
      setFetchedBounds: (fetchedBounds) => set({ fetchedBounds }),
      setShowTowers: (showTowers) => set({ showTowers }),
      setTowerIconStyle: (towerIconStyle) => set({ towerIconStyle }),

      boundsContainedByFetched: (bounds) => boundsContained(bounds, get().fetchedBounds),
    }),
    {
      name: "oscillation-towers",
      partialize: (state) => ({
        towerIconStyle: state.towerIconStyle,
        showTowers: state.showTowers,
      }),
    }
  )
);
