"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGameStore } from "@/stores/game-store";

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

    const { south, north, west, east } = gameBounds;
    const latPad = (north - south) * 10;
    const lngPad = (east - west) * 10;

    const outer: L.LatLngTuple[] = [
      [south - latPad, west - lngPad],
      [south - latPad, east + lngPad],
      [north + latPad, east + lngPad],
      [north + latPad, west - lngPad],
    ];

    const boundary: L.LatLngTuple[] = gameBounds.corners.map(
      (c) => [c.lat, c.lng] as L.LatLngTuple
    );

    borderRef.current = L.polygon(boundary, {
      color: "#d40058",
      weight: 4,
      opacity: 1,
      fill: false,
      interactive: false,
    }).addTo(map);

    maskRef.current = L.polygon([outer, boundary], {
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
