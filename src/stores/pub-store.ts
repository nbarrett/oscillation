import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Pub {
  id: number;
  lat: number;
  lng: number;
  name: string | null;
}

export enum PubIconStyle {
  CLASSIC_MUG = "CLASSIC_MUG",
  GLASS_MUG = "GLASS_MUG",
  PINT_GLASS = "PINT_GLASS",
  FLAT_MUG = "FLAT_MUG",
  MAP_PIN = "MAP_PIN",
}

export interface PubIconOption {
  style: PubIconStyle;
  label: string;
  svg: string;
}

export const PUB_ICON_OPTIONS: PubIconOption[] = [
  {
    style: PubIconStyle.CLASSIC_MUG,
    label: "Classic Mug",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110.03 122.88" fill="currentColor"><path fill-rule="evenodd" d="M28.89,4.45A17.42,17.42,0,0,1,36.46.67a19.64,19.64,0,0,1,8.15-.1,17.41,17.41,0,0,1,6.17,2.52A17.38,17.38,0,0,1,56.28.6,18.75,18.75,0,0,1,63.84.22,20.52,20.52,0,0,1,71,2.77a21.48,21.48,0,0,1,7.87,8,14.91,14.91,0,0,1,9,2.92,16,16,0,0,1,4.34,4.76,14.94,14.94,0,0,1,2.06,6.45c.41,5-1.65,10.45-7.68,14.84V50.44l5-.44C101.71,49.11,110,58.29,110,68.41V90.05c0,9.93-8.16,18.91-18,18l-5.36-.46V113a9.93,9.93,0,0,1-2.92,7h0a9.92,9.92,0,0,1-7,2.92H18.24A10,10,0,0,1,8.31,113c0-7.69.1-62,.13-73.69C1.49,33.57-.68,27,.18,21.08A17.13,17.13,0,0,1,4.56,12a18.88,18.88,0,0,1,8.38-5.26,19.15,19.15,0,0,1,13.26.73,15.69,15.69,0,0,1,2.69-3ZM86.62,62.18V96.3h7a4.22,4.22,0,0,0,4.19-4.19V66.78a4.62,4.62,0,0,0-4.61-4.6ZM61.06,67.29a4.1,4.1,0,0,1,8.14,0V96.64a4.1,4.1,0,0,1-8.14,0V67.29Zm-35.32,0a3.85,3.85,0,0,1,4.06-3.58,3.85,3.85,0,0,1,4.07,3.58V96.64a3.85,3.85,0,0,1-4.07,3.58,3.85,3.85,0,0,1-4.06-3.58V67.29ZM43.4,64.53a4.1,4.1,0,0,1,8.13,0V99.39a4.1,4.1,0,0,1-8.13,0V64.53ZM79.49,41.92l-1.68.1c-1.38,0-2.79,0-4.23,0l0,.36A13.75,13.75,0,0,1,63.17,56a15.62,15.62,0,0,1-7.83,0A14.39,14.39,0,0,1,47,50.18a17.47,17.47,0,0,1-2.29-5.66C44.35,43.26,44,42,40.94,42H15.43v71a2.83,2.83,0,0,0,2.81,2.81H76.7a2.79,2.79,0,0,0,2-.82h0a2.79,2.79,0,0,0,.82-2v-71ZM14.06,35.87C-5.81,22,16.13,2.22,29.72,17.48,28.63,4.77,46.69,2.76,50.66,12,56.51,1.93,72,5.28,75.25,17.88c8.81-4.95,20.4,9,6.68,17.65a49.47,49.47,0,0,1-8.68.43c-4.54-.08-5.68,2.24-5.73,6.38C67.41,51.45,56,52.72,52,46.77c-2.67-4-.35-10.9-11.09-10.9Z"/></svg>`,
  },
  {
    style: PubIconStyle.GLASS_MUG,
    label: "Glass Mug",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110.96 122.88" fill="currentColor"><path fill-rule="evenodd" d="M29.75,4.58A18,18,0,0,1,37.55.69a20.11,20.11,0,0,1,8.39-.1A17.91,17.91,0,0,1,52.3,3.18,18.06,18.06,0,0,1,58,.62,19.12,19.12,0,0,1,65.74.23a21.08,21.08,0,0,1,7.38,2.62,22.06,22.06,0,0,1,8.1,8.2,15.38,15.38,0,0,1,9.3,3A16.41,16.41,0,0,1,95,19a15.47,15.47,0,0,1,2.13,6.64c.45,5.55-2,11.63-9.41,16.3a6.35,6.35,0,0,1-2.43.9v9.28L92,51.49c10.39-.91,19,8.54,19,19V92.73c0,10.23-8.41,19.48-18.6,18.6l-7.08-.62v5.61a6.6,6.6,0,0,1-6.56,6.56H18.52A6.59,6.59,0,0,1,12,116.32V42.7a6.5,6.5,0,0,1-1.32-.79C1.94,35.74-.77,28.27.18,21.71A17.67,17.67,0,0,1,4.7,12.34a19.34,19.34,0,0,1,8.63-5.42A19.66,19.66,0,0,1,27,7.68a15.68,15.68,0,0,1,2.76-3.1ZM85.6,64h8a4.77,4.77,0,0,1,4.75,4.75V94.86a4.33,4.33,0,0,1-4.32,4.31H85.6V64ZM44.69,60.09a3.93,3.93,0,1,1,7.86,0v40.74a3.93,3.93,0,1,1-7.86,0V60.09Zm18.19,3.22a3.93,3.93,0,0,1,7.85,0v34.3a3.93,3.93,0,1,1-7.85,0V63.31Zm-36.38,0a3.93,3.93,0,0,1,7.86,0v34.3a3.93,3.93,0,1,1-7.86,0V63.31Zm-12-26.37C-6,22.69,16.61,2.29,30.61,18,29.48,4.92,48.08,2.84,52.17,12.37c6-10.38,22-6.94,25.33,6,9.07-5.09,21,9.23,6.87,18.18a49.42,49.42,0,0,1-8.93.44c-4.68-.08-5.81,2.31-5.9,6.57-.19,8.84-11.92,10.34-16,4.57-2.82-4-.36-11.23-11.42-11.23Z"/></svg>`,
  },
  {
    style: PubIconStyle.PINT_GLASS,
    label: "Pint Glass",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10l-1.5 17a2 2 0 0 1-2 1.8h-3A2 2 0 0 1 8.5 19L7 2z"/><path d="M7 2h10v3H7z" opacity="0.4"/></svg>`,
  },
  {
    style: PubIconStyle.FLAT_MUG,
    label: "Flat Mug",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="4" width="14" height="18" rx="2" fill="currentColor"/><rect x="5" y="4" width="10" height="5" rx="1" fill="#fff" opacity="0.7"/><path d="M17 8h2.5A2.5 2.5 0 0 1 22 10.5v3a2.5 2.5 0 0 1-2.5 2.5H17" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  },
  {
    style: PubIconStyle.MAP_PIN,
    label: "Map Pin",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30"><path d="M12 0C6.5 0 2 4.5 2 10c0 7.4 10 18 10 18s10-10.6 10-18C22 4.5 17.5 0 12 0z" fill="currentColor"/><rect x="8.5" y="5" width="7" height="11" rx="1" fill="#fff"/><rect x="9.5" y="5" width="5" height="3" rx="0.5" fill="currentColor" opacity="0.3"/><path d="M15.5 7.5h1.2a1.3 1.3 0 0 1 1.3 1.3v1.4a1.3 1.3 0 0 1-1.3 1.3h-1.2" fill="none" stroke="#fff" stroke-width="1.2"/></svg>`,
  },
];

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
      pubIconStyle: PubIconStyle.CLASSIC_MUG,

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
