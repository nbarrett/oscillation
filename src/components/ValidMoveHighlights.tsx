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
import { loadRoadData, gridHasRoad, isRoadDataLoaded } from '@/lib/road-data';
import { colours, log } from '@/lib/utils';

// Create a polygon for a grid square from a grid key
function createGridPolygon(
  map: L.Map,
  gridKey: string,
  color: string,
  fillOpacity: number,
  className?: string
): L.Polygon | null {
  try {
    const [easting, northing] = gridKey.split('-').map(Number);

    // Create the four corners of the grid square (100m x 100m)
    const corners = [
      new L.Point(easting, northing + 100),         // NW
      new L.Point(easting + 100, northing + 100),   // NE
      new L.Point(easting + 100, northing),         // SE
      new L.Point(easting, northing),               // SW
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

  // Load road data when player position is available
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

  // Calculate player's grid key from their position
  useEffect(() => {
    if (!map || !currentPlayer) return;

    // Only set the starting grid key when dice is rolled
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

  // Draw valid move highlights
  useEffect(() => {
    if (!map) return;

    // Clean up previous highlights
    if (layerGroupRef.current) {
      layerGroupRef.current.clearLayers();
    } else {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }

    // Only show highlights when dice is rolled
    if (gameTurnState !== GameTurnState.DICE_ROLLED || !diceResult) {
      return;
    }

    // Get the reference point for valid moves
    const referenceGridKey = movementPath.length > 0
      ? movementPath[movementPath.length - 1]
      : playerStartGridKey;

    if (!referenceGridKey) return;

    // Show player's starting grid (blue outline)
    if (playerStartGridKey) {
      const startPolygon = createGridPolygon(map, playerStartGridKey, '#2196F3', 0.1);
      if (startPolygon) {
        layerGroupRef.current.addLayer(startPolygon);
      }
    }

    // Only show valid move highlights if we haven't used all moves
    const movesRemaining = diceResult - movementPath.length;
    if (movesRemaining <= 0) return;

    // Get adjacent grid keys
    const adjacentKeys = getAdjacentGridKeys(referenceGridKey);

    // Filter out already selected grids and grids without roads
    const selectedKeys = selectedGridSquares.map((g) => g.gridKey);
    const validMoveKeys = adjacentKeys.filter((key) => {
      // Skip if already selected
      if (selectedKeys.includes(key)) return false;
      // Skip if it's the player's starting position
      if (key === playerStartGridKey) return false;
      // Skip if no road data loaded yet, or if grid doesn't have a road
      if (isRoadDataLoaded() && !gridHasRoad(key)) return false;
      return true;
    });

    // Draw valid move highlights
    validMoveKeys.forEach((gridKey) => {
      // Green for road squares, red outline for non-road (if road data not loaded)
      const hasRoad = !isRoadDataLoaded() || gridHasRoad(gridKey);
      const color = hasRoad ? '#4CAF50' : '#f44336';
      const polygon = createGridPolygon(map, gridKey, color, 0.15, 'valid-move-highlight');
      if (polygon) {
        polygon.setStyle({ dashArray: '5, 5' });
        layerGroupRef.current?.addLayer(polygon);
      }
    });

    // Show loading indicator if road data is still loading
    if (roadDataLoading) {
      log.debug('Road data still loading...');
    }

    log.debug('Valid move highlights drawn:', validMoveKeys.length, 'road data ready:', roadDataReady);
  }, [map, gameTurnState, diceResult, movementPath, playerStartGridKey, selectedGridSquares, roadDataReady, roadDataLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (layerGroupRef.current) {
        layerGroupRef.current.remove();
      }
    };
  }, []);

  return null;
}
