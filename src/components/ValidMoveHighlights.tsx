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

export default function ValidMoveHighlights() {
  const map = useMap();
  const currentPlayer = useCurrentPlayer();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  const {
    gameTurnState,
    playerStartGridKey,
    setPlayerStartGridKey,
    currentPlayerName,
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

    if (gameTurnState !== GameTurnState.DICE_ROLLED) return;

    if (playerStartGridKey) {
      const startPolygon = createGridPolygon(map, playerStartGridKey, colours.playerStart, 0.1);
      if (startPolygon) {
        layerGroupRef.current.addLayer(startPolygon);
      }
    }
  }, [map, gameTurnState, playerStartGridKey]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
      }
    };
  }, []);

  return null;
}
