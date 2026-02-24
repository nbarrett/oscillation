"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGameStore } from "@/stores/game-store";

export default function GameBoundary() {
  const map = useMap();
  const polyRef = useRef<L.Polygon | null>(null);
  const gameBounds = useGameStore((s) => s.gameBounds);

  useEffect(() => {
    if (polyRef.current) {
      map.removeLayer(polyRef.current);
      polyRef.current = null;
    }

    if (!gameBounds) return;

    const latLngs: L.LatLngExpression[] = gameBounds.corners.map(
      (c) => [c.lat, c.lng] as L.LatLngTuple
    );

    polyRef.current = L.polygon(latLngs, {
      color: "#d40058",
      weight: 4,
      opacity: 1,
      fillOpacity: 0.06,
      interactive: false,
    }).addTo(map);

    return () => {
      if (polyRef.current) {
        map.removeLayer(polyRef.current);
        polyRef.current = null;
      }
    };
  }, [map, gameBounds]);

  return null;
}
