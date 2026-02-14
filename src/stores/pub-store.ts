import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PubIconStyle } from "./poi-icons";

export { PubIconStyle };

export interface Pub {
  id: number;
  lat: number;
  lng: number;
  name: string | null;
}

interface FetchedBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

interface PubState {
  pubs: Pub[];
  fetchedBounds: FetchedBounds | null;
  showPubs: boolean;
  pubIconStyle: PubIconStyle;

  setPubs: (pubs: Pub[]) => void;
  setFetchedBounds: (bounds: FetchedBounds) => void;
  setShowPubs: (show: boolean) => void;
  setPubIconStyle: (style: PubIconStyle) => void;
  boundsContainedByFetched: (bounds: FetchedBounds) => boolean;
}

export const usePubStore = create<PubState>()(
  persist(
    (set, get) => ({
      pubs: [],
      fetchedBounds: null,
      showPubs: true,
      pubIconStyle: PubIconStyle.BEER_MUG,

      setPubs: (pubs) => set({ pubs }),
      setFetchedBounds: (fetchedBounds) => set({ fetchedBounds }),
      setShowPubs: (showPubs) => set({ showPubs }),
      setPubIconStyle: (pubIconStyle) => set({ pubIconStyle }),

      boundsContainedByFetched: (bounds) => {
        const fetched = get().fetchedBounds;
        if (!fetched) return false;
        return (
          bounds.south >= fetched.south &&
          bounds.west >= fetched.west &&
          bounds.north <= fetched.north &&
          bounds.east <= fetched.east
        );
      },
    }),
    {
      name: "oscillation-pubs",
      partialize: (state) => ({
        pubIconStyle: state.pubIconStyle,
        showPubs: state.showPubs,
      }),
    }
  )
);
