import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ObstructionIconStyle } from "./poi-icons";

export type IconDetailMode = "detailed" | "simple";

interface PoiSettingsState {
  iconDetailMode: IconDetailMode;
  setIconDetailMode: (mode: IconDetailMode) => void;
  obstructionIconStyle: ObstructionIconStyle;
  setObstructionIconStyle: (style: ObstructionIconStyle) => void;
}

export const usePoiSettingsStore = create<PoiSettingsState>()(
  persist(
    (set) => ({
      iconDetailMode: "detailed",
      setIconDetailMode: (iconDetailMode) => set({ iconDetailMode }),
      obstructionIconStyle: ObstructionIconStyle.BARRIER,
      setObstructionIconStyle: (obstructionIconStyle) => set({ obstructionIconStyle }),
    }),
    {
      name: "oscillation-poi-settings",
    }
  )
);
