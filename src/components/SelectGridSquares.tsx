"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { useGameStore, occupiedGridKeys, GameTurnState } from "@/stores/game-store";
import { latLngToGridKey, getAdjacentRoadGrids, shortestPath } from "@/lib/road-data";
import { gridKeyToLatLngs } from "@/lib/grid-polygon";
import { isOnBoardEdge, isOnMotorwayOrRailway } from "@/lib/deck-triggers";
import { type GameBounds } from "@/lib/area-size";
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

class EndpointPreview extends L.Polygon {
  gridKey: string;

  constructor(gridSquareLatLongs: L.LatLng[], gridKey: string, options?: L.PolylineOptions) {
    super(gridSquareLatLongs, options);
    this.gridKey = gridKey;
  }
}

function isIdentifiedPolygon(layer: L.Layer): layer is IdentifiedPolygon {
  return layer instanceof IdentifiedPolygon;
}

function isEndpointPreview(layer: L.Layer): layer is EndpointPreview {
  return layer instanceof EndpointPreview;
}

export default function SelectGridSquares() {
  const map = useMap();
  const endpointsRef = useRef<Set<string> | null>(null);
  const {
    mapClickPosition,
    gridClearRequest,
    setSelectedGridSquares,
    setMovementPath,
    setSelectedEndpoint,
    gameTurnState,
    diceResult,
    movementPath,
    playerStartGridKey,
    showPreviewPaths,
  } = useGameStore();

  function checkMidMovementTrigger(path: string[], gameBounds: GameBounds | null) {
    const lastKey = path[path.length - 1];
    if (!lastKey) return;

    if (isOnBoardEdge(lastKey, gameBounds)) {
      useGameStore.getState().setCardTrigger({ type: "edge", gridKey: lastKey, stepsUsed: path.length });
      return;
    }

    const mwResult = isOnMotorwayOrRailway(lastKey);
    if (mwResult.triggered) {
      useGameStore.getState().setCardTrigger({ type: "motorway", gridKey: lastKey, stepsUsed: path.length });
    }
  }

  function clearPathPolygons() {
    map.eachLayer((layer) => {
      if (isIdentifiedPolygon(layer)) {
        layer.remove();
      }
    });
  }

  function clearEndpointPreviews() {
    map.eachLayer((layer) => {
      if (isEndpointPreview(layer)) {
        layer.remove();
      }
    });
  }

  function drawEndpointPreviews(endpoints: Set<string>, reachableGrids: Map<string, number> | null, maxSteps: number) {
    clearEndpointPreviews();

    if (reachableGrids) {
      reachableGrids.forEach((steps, gridKey) => {
        if (steps === maxSteps) return;
        const latLngs = gridKeyToLatLngs(map, gridKey);
        const polygon = new EndpointPreview(latLngs, gridKey, {
          interactive: false,
          color: colours.osMapsPurple,
          weight: 2,
          fillOpacity: 0.35,
        });
        polygon.addTo(map);
      });
    }

    let count = 0;
    endpoints.forEach((gridKey) => {
      const latLngs = gridKeyToLatLngs(map, gridKey);
      const polygon = new EndpointPreview(latLngs, gridKey, {
        interactive: true,
        color: colours.exactEndpoint,
        weight: 4,
        fillOpacity: 0.7,
      });
      polygon.addTo(map);
      count++;
    });
    log.debug("drawEndpointPreviews: drew", count, "endpoints");
  }

  function drawPath(keys: string[], maxSteps?: number) {
    clearPathPolygons();
    clearEndpointPreviews();
    const isComplete = maxSteps !== undefined && keys.length === maxSteps;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const isLast = i === keys.length - 1 && isComplete;
      const latLngs = gridKeyToLatLngs(map, key);
      const polygon = new IdentifiedPolygon(latLngs, key, {
        interactive: true,
        color: isLast ? colours.exactEndpoint : colours.osMapsPurple,
        weight: isLast ? 3 : 2,
        fillOpacity: isLast ? 0.5 : 0.3,
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
    if (!map) return;
    if (!showPreviewPaths) {
      endpointsRef.current = null;
      clearEndpointPreviews();
      return;
    }
    if (gameTurnState === GameTurnState.DICE_ROLLED && diceResult && playerStartGridKey && movementPath.length === 0) {
      const { reachableGrids, players, currentPlayerName } = useGameStore.getState();
      const occupied = occupiedGridKeys(players, currentPlayerName ?? "");
      const endpoints = new Set<string>();
      if (reachableGrids) {
        reachableGrids.forEach((steps, gridKey) => {
          if (steps === diceResult && !occupied.has(gridKey)) endpoints.add(gridKey);
        });
      }
      endpointsRef.current = endpoints;
      drawEndpointPreviews(endpoints, reachableGrids, diceResult);
    } else if (gameTurnState !== GameTurnState.DICE_ROLLED) {
      endpointsRef.current = null;
      clearEndpointPreviews();
    }
  }, [map, gameTurnState, diceResult, playerStartGridKey, movementPath.length, showPreviewPaths]);

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

    const { cardTrigger, gameBounds } = state;
    if (cardTrigger) return;

    if (gameTurnState !== GameTurnState.DICE_ROLLED || !playerStartGridKey || !diceResult) return;

    const gridKey = latLngToGridKey(
      mapClickPosition.latLng.lat,
      mapClickPosition.latLng.lng
    );

    if (gridKey === playerStartGridKey) return;

    const occupied = occupiedGridKeys(players, currentPlayerName ?? "");

    if (movementPath.length > 0 && movementPath[movementPath.length - 1] === gridKey) {
      const newPath = movementPath.slice(0, -1);
      setMovementPath(newPath);
      setSelectedEndpoint(newPath.length > 0 ? newPath[newPath.length - 1] : null);
      drawPath(newPath, diceResult);
      if (newPath.length === 0 && endpointsRef.current) {
        const { reachableGrids } = useGameStore.getState();
        drawEndpointPreviews(endpointsRef.current, reachableGrids, diceResult);
      }
      return;
    }

    if (movementPath.includes(gridKey)) return;

    if (endpointsRef.current?.has(gridKey) && movementPath.length === 0) {
      const path = shortestPath(playerStartGridKey, gridKey, diceResult);
      if (path) {
        setMovementPath(path);
        setSelectedEndpoint(gridKey);
        drawPath(path, diceResult);
        checkMidMovementTrigger(path, gameBounds);
        return;
      }
    }

    if (movementPath.length >= diceResult) return;

    const lastKey = movementPath.length > 0
      ? movementPath[movementPath.length - 1]
      : playerStartGridKey;

    const validNeighbors = getAdjacentRoadGrids(lastKey);
    if (!validNeighbors.includes(gridKey)) return;

    const wouldBeEndpoint = movementPath.length + 1 === diceResult;
    if (wouldBeEndpoint && occupied.has(gridKey)) return;

    const newPath = [...movementPath, gridKey];
    setMovementPath(newPath);
    setSelectedEndpoint(gridKey);
    drawPath(newPath, diceResult);
    checkMidMovementTrigger(newPath, gameBounds);
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
      endpointsRef.current = null;
    }
  }, [gridClearRequest, map, setSelectedGridSquares, setMovementPath]);

  return null;
}
