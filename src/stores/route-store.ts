import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LatLngTuple } from 'leaflet';

export enum Profile {
  DRIVING_CAR = 'driving-car',
  DRIVING_HGV = 'driving-hgv',
  CYCLING_REGULAR = 'cycling-regular',
  CYCLING_ROAD = 'cycling-road',
  CYCLING_MOUNTAIN = 'cycling-mountain',
  CYCLING_ELECTRIC = 'cycling-electric',
  FOOT_WALKING = 'foot-walking',
  FOOT_HIKING = 'foot-hiking',
  WHEELCHAIR = 'wheelchair',
}

export interface NamedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface Step {
  duration: number;
  distance: number;
  instruction: string;
  name: string;
  type: number;
  way_points: number[];
}

export interface DirectionsResponse {
  type: string;
  metadata: {
    engine: { build_date: string; graph_date: string; version: string };
    service: string;
    query: { profile: string; coordinates: number[][]; format: string };
    attribution: string;
    timestamp: number;
  };
  bbox: number[];
  features: {
    bbox: number[];
    geometry: {
      coordinates: number[][];
      type: string;
    };
    type: string;
    properties: {
      summary: { duration: number; distance: number };
      fare: number;
      transfers: number;
      segments: {
        duration: number;
        distance: number;
        steps: Step[];
      }[];
      way_points: number[];
    };
  }[];
}

interface RouteState {
  profile: Profile;
  startingPosition: NamedLocation | null;
  namedLocations: NamedLocation[];

  directionsCache: Record<string, DirectionsResponse>;

  setProfile: (profile: Profile) => void;
  setStartingPosition: (position: NamedLocation | null) => void;
  setNamedLocations: (locations: NamedLocation[]) => void;
  cacheDirections: (key: string, response: DirectionsResponse) => void;
  getDirections: (key: string) => DirectionsResponse | null;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      profile: Profile.DRIVING_CAR,
      startingPosition: null,
      namedLocations: [],
      directionsCache: {},

      setProfile: (profile) => set({ profile }),
      setStartingPosition: (startingPosition) => set({ startingPosition }),
      setNamedLocations: (namedLocations) => set({ namedLocations }),

      cacheDirections: (key, response) => set((state) => ({
        directionsCache: { ...state.directionsCache, [key]: response },
      })),

      getDirections: (key) => get().directionsCache[key] ?? null,
    }),
    {
      name: 'oscillation-route',
      partialize: (state) => ({
        profile: state.profile,
        startingPosition: state.startingPosition,
      }),
    }
  )
);

export const createDirectionsKey = (
  profile: Profile,
  start: LatLngTuple,
  end: LatLngTuple
): string => {
  return `${profile}:${start[0]},${start[1]}:${end[0]},${end[1]}`;
};
