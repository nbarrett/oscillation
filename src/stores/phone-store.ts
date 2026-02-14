import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type PoiItem, type FetchedBounds, boundsContained } from "./poi-types";
import { PhoneIconStyle } from "./poi-icons";

export { PhoneIconStyle };
export type PhoneBox = PoiItem;

interface PhoneState {
  phones: PhoneBox[];
  fetchedBounds: FetchedBounds | null;
  showPhones: boolean;
  phoneIconStyle: PhoneIconStyle;

  setPhones: (phones: PhoneBox[]) => void;
  setFetchedBounds: (bounds: FetchedBounds) => void;
  setShowPhones: (show: boolean) => void;
  setPhoneIconStyle: (style: PhoneIconStyle) => void;
  boundsContainedByFetched: (bounds: FetchedBounds) => boolean;
}

export const usePhoneStore = create<PhoneState>()(
  persist(
    (set, get) => ({
      phones: [],
      fetchedBounds: null,
      showPhones: true,
      phoneIconStyle: PhoneIconStyle.RED_BOX,

      setPhones: (phones) => set({ phones }),
      setFetchedBounds: (fetchedBounds) => set({ fetchedBounds }),
      setShowPhones: (showPhones) => set({ showPhones }),
      setPhoneIconStyle: (phoneIconStyle) => set({ phoneIconStyle }),

      boundsContainedByFetched: (bounds) => boundsContained(bounds, get().fetchedBounds),
    }),
    {
      name: "oscillation-phones",
      partialize: (state) => ({
        phoneIconStyle: state.phoneIconStyle,
        showPhones: state.showPhones,
      }),
    }
  )
);
