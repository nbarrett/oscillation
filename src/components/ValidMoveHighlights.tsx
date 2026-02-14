"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  useGameStore,
  useCurrentPlayer,
  GameTurnState,
  getAdjacentGridKeys,
  occupiedGridKeys,
} from "@/stores/game-store";
import { latLngToGridKey, loadRoadData, isRoadDataLoaded, reachableRoadGrids, gridHasRoad, nearestRoadPosition } from "@/lib/road-data";
import { colours, log } from "@/lib/utils";

function createGridPolygon(
  map: L.Map,
  gridKey: string,
  color: string,
  fillOpacity: number,
  className?: string
): L.Polygon | null {
  try {
    const [easting, northing] = gridKey.split("-").map(Number);

    const corners = [
      new L.Point(easting, northing + 100),
      new L.Point(easting + 100, northing + 100),
      new L.Point(easting + 100, northing),
      new L.Point(easting, northing),
    ];

    const latLngs = corners.map((point) => map.options.crs!.unproject(point));

    return new L.Polygon(latLngs, {
      color,
      weight: 2,
      fillOpacity,
      className,
      interactive: false,
    });
  } catch (e) {
    log.error("Failed to create grid polygon:", e);
    return null;
  }
}

export default function ValidMoveHighlights() {
  const map = useMap();
  const currentPlayer = useCurrentPlayer();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [roadDataLoading, setRoadDataLoading] = useState(false);
  const [roadDataReady, setRoadDataReady] = useState(false);

  const {
    gameTurnState,
    diceResult,
    movementPath,
    playerStartGridKey,
    selectedGridSquares,
    setPlayerStartGridKey,
    updatePlayerPosition,
    players,
    currentPlayerName,
  } = useGameStore();

  useEffect(() => {
    if (!currentPlayer || roadDataReady) return;

    const loadRoads = async () => {
      setRoadDataLoading(true);
      try {
        await loadRoadData(currentPlayer.position[0], currentPlayer.position[1], 10);
        setRoadDataReady(true);
      } catch (error) {
        log.error("Failed to load road data:", error);
      } finally {
        setRoadDataLoading(false);
      }
    };

    loadRoads();
  }, [currentPlayer, roadDataReady]);

  useEffect(() => {
    if (!map || !currentPlayer || !currentPlayerName) return;
    if (gameTurnState !== GameTurnState.DICE_ROLLED) return;

    if (!playerStartGridKey) {
      const gridKey = latLngToGridKey(currentPlayer.position[0], currentPlayer.position[1]);
      setPlayerStartGridKey(gridKey);
      return;
    }

    if (roadDataReady && !gridHasRoad(playerStartGridKey)) {
      const snapped = nearestRoadPosition(currentPlayer.position[0], currentPlayer.position[1]);
      if (snapped) {
        const newGridKey = latLngToGridKey(snapped[0], snapped[1]);
        updatePlayerPosition(currentPlayerName, snapped);
        setPlayerStartGridKey(newGridKey);
      }
    }
  }, [map, currentPlayer, currentPlayerName, gameTurnState, playerStartGridKey, setPlayerStartGridKey, roadDataReady, updatePlayerPosition]);

  useEffect(() => {
    if (!map) return;

    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    } else {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    if (gameTurnState !== GameTurnState.DICE_ROLLED || !diceResult) {
      return;
    }

    const referenceGridKey = movementPath.length > 0
      ? movementPath[movementPath.length - 1]
      : playerStartGridKey;

    if (!referenceGridKey) return;

    if (playerStartGridKey) {
      const startPolygon = createGridPolygon(map, playerStartGridKey, colours.playerStart, 0.1);
      if (startPolygon) {
        layerGroupRef.current.addLayer(startPolygon);
      }
    }

    const movesRemaining = diceResult - movementPath.length;
    if (movesRemaining <= 0) return;

    const selectedKeys = new Set(selectedGridSquares.map((g) => g.gridKey));
    const occupied = occupiedGridKeys(players, currentPlayerName ?? "");
    const excludeKeys = new Set([...selectedKeys, ...occupied]);
    if (playerStartGridKey) excludeKeys.add(playerStartGridKey);

    if (isRoadDataLoaded()) {
      const reachable = reachableRoadGrids(referenceGridKey, movesRemaining, excludeKeys);

      reachable.forEach((distance, gridKey) => {
        const isExactEndpoint = distance === movesRemaining;
        const isImmediate = distance === 1;

        if (!isExactEndpoint && !isImmediate) return;

        let color: string;
        let fillOpacity: number;
        let weight: number;
        let dashArray: string;

        if (isExactEndpoint) {
          color = colours.exactEndpoint;
          fillOpacity = 0.25;
          weight = 3;
          dashArray = "";
        } else {
          color = colours.immediateMove;
          fillOpacity = 0.1;
          weight = 1;
          dashArray = "3, 7";
        }

        const polygon = createGridPolygon(map, gridKey, color, fillOpacity, "valid-move-highlight");
        if (polygon) {
          polygon.setStyle({ dashArray, weight });
          layerGroupRef.current?.addLayer(polygon);
        }
      });
    } else {
      const adjacentKeys = getAdjacentGridKeys(referenceGridKey);
      const validMoveKeys = adjacentKeys.filter((key) => !selectedKeys.has(key) && !occupied.has(key) && key !== playerStartGridKey && gridHasRoad(key));

      validMoveKeys.forEach((gridKey) => {
        const polygon = createGridPolygon(map, gridKey, colours.immediateMove, 0.15, "valid-move-highlight");
        if (polygon) {
          polygon.setStyle({ dashArray: "5, 5" });
          layerGroupRef.current?.addLayer(polygon);
        }
      });
    }
  }, [map, gameTurnState, diceResult, movementPath, playerStartGridKey, selectedGridSquares, roadDataReady, roadDataLoading, players, currentPlayerName]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
      }
    };
  }, []);

  return null;
}
