"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGameStore } from "@/stores/game-store";

const WORLD_OUTER: L.LatLngTuple[] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

export default function GameBoundary() {
  const map = useMap();
  const borderRef = useRef<L.Polygon | null>(null);
  const maskRef = useRef<L.Polygon | null>(null);
  const gameBounds = useGameStore((s) => s.gameBounds);

  useEffect(() => {
    if (borderRef.current) {
      map.removeLayer(borderRef.current);
      borderRef.current = null;
    }
    if (maskRef.current) {
      map.removeLayer(maskRef.current);
      maskRef.current = null;
    }

    if (!gameBounds) return;

    const hole: L.LatLngTuple[] = gameBounds.corners.map(
      (c) => [c.lat, c.lng] as L.LatLngTuple
    );

    borderRef.current = L.polygon(hole, {
      color: "#d40058",
      weight: 4,
      opacity: 1,
      fill: false,
      interactive: false,
    }).addTo(map);

    maskRef.current = L.polygon([WORLD_OUTER, hole], {
      color: "transparent",
      weight: 0,
      fillColor: "#1a1a2e",
      fillOpacity: 0.55,
      interactive: false,
    }).addTo(map);

    return () => {
      if (borderRef.current) {
        map.removeLayer(borderRef.current);
        borderRef.current = null;
      }
      if (maskRef.current) {
        map.removeLayer(maskRef.current);
        maskRef.current = null;
      }
    };
  }, [map, gameBounds]);

  return null;
}
