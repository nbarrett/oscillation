import { create } from "zustand"
import { persist } from "zustand/middleware"

export enum CarStyle {
  FERRARI_RED = "FERRARI_RED",
  LAMBORGHINI_BLACK = "LAMBORGHINI_BLACK",
  PORSCHE_YELLOW = "PORSCHE_YELLOW",
  ASTON_MARTIN_GREEN = "ASTON_MARTIN_GREEN",
  MCLAREN_ORANGE = "MCLAREN_ORANGE",
  BUGATTI_BLUE = "BUGATTI_BLUE",
  MERCEDES_SILVER = "MERCEDES_SILVER",
  BMW_WHITE = "BMW_WHITE",
  AUDI_GREY = "AUDI_GREY",
  JAGUAR_PURPLE = "JAGUAR_PURPLE",
  LOTUS_GREEN = "LOTUS_GREEN",
  CORVETTE_RED = "CORVETTE_RED",
  MUSTANG_BLUE = "MUSTANG_BLUE",
  ROLLS_ROYCE_BLACK = "ROLLS_ROYCE_BLACK",
  BENTLEY_CREAM = "BENTLEY_CREAM",
  TESLA_WHITE = "TESLA_WHITE",
  MINI_RED = "MINI_RED",
  VW_BEETLE_YELLOW = "VW_BEETLE_YELLOW",
  LAND_ROVER_GREEN = "LAND_ROVER_GREEN",
  ALFA_ROMEO_RED = "ALFA_ROMEO_RED",
}

export interface CarIconOption {
  style: CarStyle
  label: string
  image: string
  color: string
}

export const CAR_ICON_OPTIONS: CarIconOption[] = [
  { style: CarStyle.FERRARI_RED, label: "Ferrari", image: "/cars/ferrari-red.png", color: "#dc2626" },
  { style: CarStyle.LAMBORGHINI_BLACK, label: "Lamborghini", image: "/cars/lamborghini-black.png", color: "#1c1917" },
  { style: CarStyle.PORSCHE_YELLOW, label: "Porsche", image: "/cars/porsche-yellow.png", color: "#eab308" },
  { style: CarStyle.ASTON_MARTIN_GREEN, label: "Aston Martin", image: "/cars/aston-martin-green.png", color: "#065f46" },
  { style: CarStyle.MCLAREN_ORANGE, label: "McLaren", image: "/cars/mclaren-orange.png", color: "#ea580c" },
  { style: CarStyle.BUGATTI_BLUE, label: "Bugatti", image: "/cars/bugatti-blue.png", color: "#1d4ed8" },
  { style: CarStyle.MERCEDES_SILVER, label: "Mercedes", image: "/cars/mercedes-silver.png", color: "#a1a1aa" },
  { style: CarStyle.BMW_WHITE, label: "BMW", image: "/cars/bmw-white.png", color: "#f5f5f4" },
  { style: CarStyle.AUDI_GREY, label: "Audi", image: "/cars/audi-grey.png", color: "#71717a" },
  { style: CarStyle.JAGUAR_PURPLE, label: "Jaguar", image: "/cars/jaguar-purple.png", color: "#7c3aed" },
  { style: CarStyle.LOTUS_GREEN, label: "Lotus", image: "/cars/lotus-green.png", color: "#16a34a" },
  { style: CarStyle.CORVETTE_RED, label: "Corvette", image: "/cars/corvette-red.png", color: "#b91c1c" },
  { style: CarStyle.MUSTANG_BLUE, label: "Mustang", image: "/cars/mustang-blue.png", color: "#2563eb" },
  { style: CarStyle.ROLLS_ROYCE_BLACK, label: "Rolls Royce", image: "/cars/rolls-royce-black.png", color: "#0c0a09" },
  { style: CarStyle.BENTLEY_CREAM, label: "Bentley", image: "/cars/bentley-cream.png", color: "#d6d3d1" },
  { style: CarStyle.TESLA_WHITE, label: "Tesla", image: "/cars/tesla-white.png", color: "#e7e5e4" },
  { style: CarStyle.MINI_RED, label: "Mini Cooper", image: "/cars/mini-red.png", color: "#ef4444" },
  { style: CarStyle.VW_BEETLE_YELLOW, label: "VW Beetle", image: "/cars/vw-beetle-yellow.png", color: "#facc15" },
  { style: CarStyle.LAND_ROVER_GREEN, label: "Land Rover", image: "/cars/land-rover-green.png", color: "#15803d" },
  { style: CarStyle.ALFA_ROMEO_RED, label: "Alfa Romeo", image: "/cars/alfa-romeo-red.png", color: "#991b1b" },
]

export const CAR_STYLES = CAR_ICON_OPTIONS.map((option) => option.style)

const DEFAULT_CAR = CAR_ICON_OPTIONS[0]

export function carImageForStyle(style: string): string {
  return CAR_ICON_OPTIONS.find((option) => option.style === style)?.image ?? DEFAULT_CAR.image
}

export function carColorForStyle(style: string): string {
  return CAR_ICON_OPTIONS.find((option) => option.style === style)?.color ?? DEFAULT_CAR.color
}

export function carLabelForStyle(style: string): string {
  return CAR_ICON_OPTIONS.find((option) => option.style === style)?.label ?? DEFAULT_CAR.label
}

export const CAR_SIZE_MIN = 40
export const CAR_SIZE_MAX = 160
export const CAR_SIZE_DEFAULT = 80

interface CarState {
  preferredCar: CarStyle
  carSize: number
  setPreferredCar: (style: CarStyle) => void
  setCarSize: (size: number) => void
}

export const useCarStore = create<CarState>()(
  persist(
    (set) => ({
      preferredCar: CarStyle.FERRARI_RED,
      carSize: CAR_SIZE_DEFAULT,
      setPreferredCar: (preferredCar) => set({ preferredCar }),
      setCarSize: (carSize) => set({ carSize }),
    }),
    {
      name: "oscillation-car",
      partialize: (state) => ({
        preferredCar: state.preferredCar,
        carSize: state.carSize,
      }),
    }
  )
)
