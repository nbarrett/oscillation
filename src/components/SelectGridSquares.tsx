"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGameStore } from "@/stores/game-store";
import { latLngToGridKey, shortestPath } from "@/lib/road-data";
import { gridKeyToLatLngs } from "@/lib/grid-polygon";
import { colours } from "@/lib/utils";

class IdentifiedPolygon extends L.Polygon {
  firstLatLong: L.LatLng;
  gridKey: string;

  constructor(gridSquareLatLongs: L.LatLng[], gridKey: string, options?: L.PolylineOptions) {
    super(gridSquareLatLongs, options);
    this.firstLatLong = gridSquareLatLongs[0];
    this.gridKey = gridKey;
  }
}

function isIdentifiedPolygon(layer: L.Layer): layer is IdentifiedPolygon {
  return (layer as IdentifiedPolygon).firstLatLong !== undefined;
}

export default function SelectGridSquares() {
  const map = useMap();
  const {
    mapClickPosition,
    selectedGridSquares,
    gridClearRequest,
    setSelectedGridSquares,
    canSelectGrid,
    setMovementPath,
    playerStartGridKey,
    diceResult,
    selectedEndpoint,
    setSelectedEndpoint,
  } = useGameStore();

  function clearPathPolygons() {
    map.eachLayer((layer) => {
      if (isIdentifiedPolygon(layer)) {
        layer.remove();
      }
    });
  }

  function drawPath(pathKeys: string[]) {
    for (const key of pathKeys) {
      const latLngs = gridKeyToLatLngs(map, key);
      const polygon = new IdentifiedPolygon(latLngs, key, {
        interactive: true,
        color: colours.osMapsPurple,
        weight: 2,
        fillOpacity: 0.3,
      });
      polygon.addTo(map);
    }
  }

  useEffect(() => {
    if (!mapClickPosition || !map) return;

    const gridKey = latLngToGridKey(
      mapClickPosition.latLng.lat,
      mapClickPosition.latLng.lng
    );

    if (selectedEndpoint === gridKey) {
      clearPathPolygons();
      setSelectedGridSquares([]);
      setMovementPath([]);
      setSelectedEndpoint(null);
      return;
    }

    if (!canSelectGrid(gridKey)) return;
    if (!playerStartGridKey || !diceResult) return;

    const path = shortestPath(playerStartGridKey, gridKey, diceResult);
    if (!path) return;

    clearPathPolygons();

    const grids = path.map((key) => {
      const latLngs = gridKeyToLatLngs(map, key);
      return {
        gridSquareLatLongs: latLngs.map((ll) => ({ lat: ll.lat, lng: ll.lng })),
        gridKey: key,
      };
    });

    drawPath(path);
    setSelectedGridSquares(grids);
    setMovementPath(path);
    setSelectedEndpoint(gridKey);
  }, [mapClickPosition]);

  useEffect(() => {
    if (gridClearRequest > 0) {
      map.eachLayer((layer) => {
        if (layer instanceof L.Polygon) {
          layer.remove();
        }
      });
      setSelectedGridSquares([]);
      setMovementPath([]);
    }
  }, [gridClearRequest, map, setSelectedGridSquares, setMovementPath]);

  return null;
}
