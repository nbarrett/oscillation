"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGameStore } from "@/stores/game-store";

export default function GameBoundary() {
  const map = useMap();
  const rectRef = useRef<L.Rectangle | null>(null);
  const gameBounds = useGameStore((s) => s.gameBounds);

  useEffect(() => {
    if (rectRef.current) {
      map.removeLayer(rectRef.current);
      rectRef.current = null;
    }

    if (!gameBounds) return;

    const bounds: L.LatLngBoundsExpression = [
      [gameBounds.south, gameBounds.west],
      [gameBounds.north, gameBounds.east],
    ];

    rectRef.current = L.rectangle(bounds, {
      color: "#d40058",
      weight: 2,
      dashArray: "10, 8",
      fillOpacity: 0.03,
      interactive: false,
    }).addTo(map);

    return () => {
      if (rectRef.current) {
        map.removeLayer(rectRef.current);
        rectRef.current = null;
      }
    };
  }, [map, gameBounds]);

  return null;
}
