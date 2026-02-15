"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  useGameStore,
  useCurrentPlayer,
  GameTurnState,
} from "@/stores/game-store";
import { latLngToGridKey } from "@/lib/road-data";
import { createGridPolygon } from "@/lib/grid-polygon";
import { colours } from "@/lib/utils";

function colorForDistance(steps: number, maxSteps: number): string {
  if (steps === 1) return colours.immediateMove;
  if (steps === maxSteps) return colours.exactEndpoint;
  return colours.reachableMove;
}

function opacityForDistance(steps: number, maxSteps: number): number {
  if (steps === maxSteps) return 0.35;
  if (steps === 1) return 0.25;
  return 0.15;
}

export default function ValidMoveHighlights() {
  const map = useMap();
  const currentPlayer = useCurrentPlayer();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const {
    gameTurnState,
    diceResult,
    movementPath,
    playerStartGridKey,
    setPlayerStartGridKey,
    currentPlayerName,
    reachableGrids,
  } = useGameStore();

  useEffect(() => {
    if (!map || !currentPlayer || !currentPlayerName) return;
    if (gameTurnState !== GameTurnState.DICE_ROLLED) return;

    if (!playerStartGridKey) {
      const gridKey = latLngToGridKey(currentPlayer.position[0], currentPlayer.position[1]);
      setPlayerStartGridKey(gridKey);
    }
  }, [map, currentPlayer, currentPlayerName, gameTurnState, playerStartGridKey, setPlayerStartGridKey]);

  useEffect(() => {
    if (!map) return;

    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    } else {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    if (gameTurnState !== GameTurnState.DICE_ROLLED || !diceResult) return;

    if (playerStartGridKey) {
      const startPolygon = createGridPolygon(map, playerStartGridKey, colours.playerStart, 0.1);
      if (startPolygon) {
        layerGroupRef.current.addLayer(startPolygon);
      }
    }

    if (reachableGrids) {
      reachableGrids.forEach((steps, gridKey) => {
        const color = colorForDistance(steps, diceResult);
        const opacity = opacityForDistance(steps, diceResult);
        const polygon = createGridPolygon(map, gridKey, color, opacity);
        if (polygon) {
          layerGroupRef.current!.addLayer(polygon);
        }
      });
    }
  }, [map, gameTurnState, diceResult, movementPath, playerStartGridKey, reachableGrids]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
      }
    };
  }, []);

  return null;
}
