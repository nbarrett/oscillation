import { create } from "zustand";
import { persist } from "zustand/middleware";

export type IconDetailMode = "detailed" | "simple";

interface PoiSettingsState {
  iconDetailMode: IconDetailMode;
  setIconDetailMode: (mode: IconDetailMode) => void;
}

export const usePoiSettingsStore = create<PoiSettingsState>()(
  persist(
    (set) => ({
      iconDetailMode: "detailed",
      setIconDetailMode: (iconDetailMode) => set({ iconDetailMode }),
    }),
    {
      name: "oscillation-poi-settings",
    }
  )
);
