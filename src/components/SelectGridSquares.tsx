"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGameStore, occupiedGridKeys, GameTurnState } from "@/stores/game-store";
import { latLngToGridKey, getAdjacentRoadGrids } from "@/lib/road-data";
import { gridKeyToLatLngs } from "@/lib/grid-polygon";
import { colours, log } from "@/lib/utils";

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
  return "firstLatLong" in layer;
}

export default function SelectGridSquares() {
  const map = useMap();
  const {
    mapClickPosition,
    gridClearRequest,
    setSelectedGridSquares,
    setMovementPath,
    setSelectedEndpoint,
  } = useGameStore();

  function clearPathPolygons() {
    map.eachLayer((layer) => {
      if (isIdentifiedPolygon(layer)) {
        layer.remove();
      }
    });
  }

  function drawPath(keys: string[]) {
    clearPathPolygons();
    for (const key of keys) {
      const latLngs = gridKeyToLatLngs(map, key);
      const polygon = new IdentifiedPolygon(latLngs, key, {
        interactive: true,
        color: colours.osMapsPurple,
        weight: 2,
        fillOpacity: 0.3,
      });
      polygon.addTo(map);
    }

    const grids = keys.map((key) => {
      const latLngs = gridKeyToLatLngs(map, key);
      return {
        gridSquareLatLongs: latLngs.map((ll) => ({ lat: ll.lat, lng: ll.lng })),
        gridKey: key,
      };
    });
    setSelectedGridSquares(grids);
  }

  useEffect(() => {
    if (!mapClickPosition || !map) return;

    const state = useGameStore.getState();
    const {
      playerStartGridKey,
      diceResult,
      movementPath,
      players,
      currentPlayerName,
      gameTurnState,
    } = state;

    if (gameTurnState !== GameTurnState.DICE_ROLLED || !playerStartGridKey || !diceResult) return;

    const gridKey = latLngToGridKey(
      mapClickPosition.latLng.lat,
      mapClickPosition.latLng.lng
    );

    if (gridKey === playerStartGridKey) return;

    if (movementPath.length > 0 && movementPath[movementPath.length - 1] === gridKey) {
      const newPath = movementPath.slice(0, -1);
      setMovementPath(newPath);
      setSelectedEndpoint(newPath.length > 0 ? newPath[newPath.length - 1] : null);
      drawPath(newPath);
      return;
    }

    if (movementPath.includes(gridKey)) return;

    if (movementPath.length >= diceResult) return;

    const lastKey = movementPath.length > 0
      ? movementPath[movementPath.length - 1]
      : playerStartGridKey;

    const validNeighbors = getAdjacentRoadGrids(lastKey);
    if (!validNeighbors.includes(gridKey)) return;

    const occupied = occupiedGridKeys(players, currentPlayerName ?? "");
    if (occupied.has(gridKey)) return;

    const newPath = [...movementPath, gridKey];
    setMovementPath(newPath);
    setSelectedEndpoint(gridKey);
    drawPath(newPath);
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
