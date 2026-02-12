'use client';

import { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  useGameStore,
  useCurrentPlayer,
  GameTurnState,
  createGridKey,
  getAdjacentGridKeys,
} from '@/stores/game-store';
import { loadRoadData, isRoadDataLoaded, reachableRoadGrids } from "@/lib/road-data";
import { colours, log } from '@/lib/utils';

function createGridPolygon(
  map: L.Map,
  gridKey: string,
  color: string,
  fillOpacity: number,
  className?: string
): L.Polygon | null {
  try {
    const [easting, northing] = gridKey.split('-').map(Number);

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
    log.error('Failed to create grid polygon:', e);
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
  } = useGameStore();

  useEffect(() => {
    if (!currentPlayer || roadDataReady) return;

    const loadRoads = async () => {
      setRoadDataLoading(true);
      try {
        await loadRoadData(currentPlayer.position[0], currentPlayer.position[1], 10);
        setRoadDataReady(true);
        log.info('Road data loaded successfully');
      } catch (error) {
        log.error('Failed to load road data:', error);
      } finally {
        setRoadDataLoading(false);
      }
    };

    loadRoads();
  }, [currentPlayer, roadDataReady]);

  useEffect(() => {
    if (!map || !currentPlayer) return;

    if (gameTurnState === GameTurnState.DICE_ROLLED && !playerStartGridKey) {
      const playerLatLng = L.latLng(currentPlayer.position[0], currentPlayer.position[1]);
      const osCoords = map.options.crs!.project(playerLatLng);
      const gridKey = createGridKey(
        Math.round(osCoords.x).toString(),
        Math.round(osCoords.y).toString()
      );
      log.info('Setting player start grid key:', gridKey);
      setPlayerStartGridKey(gridKey);
    }
  }, [map, currentPlayer, gameTurnState, playerStartGridKey, setPlayerStartGridKey]);

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
    const excludeKeys = new Set(selectedKeys);
    if (playerStartGridKey) excludeKeys.add(playerStartGridKey);

    if (isRoadDataLoaded()) {
      const reachable = reachableRoadGrids(referenceGridKey, movesRemaining, excludeKeys);

      reachable.forEach((distance, gridKey) => {
        const isImmediate = distance === 1;
        const color = isImmediate ? colours.immediateMove : colours.reachableMove;
        const fillOpacity = isImmediate ? 0.15 : 0.08;
        const weight = isImmediate ? 2 : 1;
        const dashArray = isImmediate ? "5, 5" : "3, 7";

        const polygon = createGridPolygon(map, gridKey, color, fillOpacity, "valid-move-highlight");
        if (polygon) {
          polygon.setStyle({ dashArray, weight });
          layerGroupRef.current?.addLayer(polygon);
        }
      });
    } else {
      const adjacentKeys = getAdjacentGridKeys(referenceGridKey);
      const validMoveKeys = adjacentKeys.filter((key) => !selectedKeys.has(key) && key !== playerStartGridKey);

      validMoveKeys.forEach((gridKey) => {
        const polygon = createGridPolygon(map, gridKey, colours.immediateMove, 0.15, "valid-move-highlight");
        if (polygon) {
          polygon.setStyle({ dashArray: "5, 5" });
          layerGroupRef.current?.addLayer(polygon);
        }
      });
    }

    if (roadDataLoading) {
      log.debug("Road data still loading...");
    }
  }, [map, gameTurnState, diceResult, movementPath, playerStartGridKey, selectedGridSquares, roadDataReady, roadDataLoading]);

  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
      }
    };
  }, []);

  return null;
}
