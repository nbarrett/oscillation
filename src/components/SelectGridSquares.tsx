"use client";

import { useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { trpc } from "@/lib/trpc/client";
import { useGameStore, occupiedGridKeys, GameTurnState } from "@/stores/game-store";
import { useDeckStore } from "@/stores/deck-store";
import { latLngToGridKey, getAdjacentRoadGrids, shortestPath, reachableRoadGrids, isRoadDataLoaded, onRoadDataReady, gridHasABRoad, gridHasRoad, loadRoadData, gridKeyToLatLng, roadPathThroughGrids } from "@/lib/road-data";
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

class PreviewPolygon extends L.Polygon {
  gridKey: string;

  constructor(gridSquareLatLongs: L.LatLng[], gridKey: string, options?: L.PolylineOptions) {
    super(gridSquareLatLongs, options);
    this.gridKey = gridKey;
  }
}

class EndpointPolygon extends L.Polygon {
  gridKey: string;

  constructor(gridSquareLatLongs: L.LatLng[], gridKey: string, options?: L.PolylineOptions) {
    super(gridSquareLatLongs, options);
    this.gridKey = gridKey;
  }
}

class RemotePreviewPolygon extends L.Polygon {
  gridKey: string;

  constructor(gridSquareLatLongs: L.LatLng[], gridKey: string, options?: L.PolylineOptions) {
    super(gridSquareLatLongs, options);
    this.gridKey = gridKey;
  }
}

class RoutePolyline extends L.Polyline {
  constructor(latlngs: L.LatLngExpression[], options?: L.PolylineOptions) {
    super(latlngs, options);
  }
}

function isIdentifiedPolygon(layer: L.Layer): layer is IdentifiedPolygon {
  return layer instanceof IdentifiedPolygon;
}

function isPreviewPolygon(layer: L.Layer): layer is PreviewPolygon {
  return layer instanceof PreviewPolygon;
}

function isEndpointPolygon(layer: L.Layer): layer is EndpointPolygon {
  return layer instanceof EndpointPolygon;
}

function isRoutePolyline(layer: L.Layer): layer is RoutePolyline {
  return layer instanceof RoutePolyline;
}

function isRemotePreviewPolygon(layer: L.Layer): layer is RemotePreviewPolygon {
  return layer instanceof RemotePreviewPolygon;
}

export default function SelectGridSquares() {
  const map = useMap();
  const gridClearRequest = useGameStore((s) => s.gridClearRequest);
  const setSelectedGridSquares = useGameStore((s) => s.setSelectedGridSquares);
  const setMovementPath = useGameStore((s) => s.setMovementPath);
  const setSelectedEndpoint = useGameStore((s) => s.setSelectedEndpoint);
  const gameTurnState = useGameStore((s) => s.gameTurnState);
  const diceResult = useGameStore((s) => s.diceResult);
  const movementPath = useGameStore((s) => s.movementPath);
  const playerStartGridKey = useGameStore((s) => s.playerStartGridKey);
  const showPreviewPaths = useGameStore((s) => s.showPreviewPaths);
  const requestPreviewRecompute = useGameStore((s) => s.requestPreviewRecompute);
  const previewPaths = useGameStore((s) => s.previewPaths);
  const previewPathIndex = useGameStore((s) => s.previewPathIndex);
  const remotePreviewPath = useGameStore((s) => s.remotePreviewPath);
  const sessionId = useGameStore((s) => s.sessionId);
  const updatePreviewPath = trpc.game.updatePreviewPath.useMutation();

  log.debug("SelectGridSquares render, turnState:", gameTurnState, "dice:", diceResult);

  const prevIndexRef = useRef(previewPathIndex);
  const drawnPathRef = useRef<string[] | null>(null);

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
      if (isIdentifiedPolygon(layer) || isRoutePolyline(layer)) {
        layer.remove();
      }
    });
  }

  function clearPreviewPolygons() {
    map.eachLayer((layer) => {
      if (isPreviewPolygon(layer) || isRoutePolyline(layer)) {
        layer.remove();
      }
    });
  }

  function clearEndpointPolygons() {
    map.eachLayer((layer) => {
      if (isEndpointPolygon(layer)) {
        layer.remove();
      }
    });
  }

  function clearRemotePreviewPolygons() {
    map.eachLayer((layer) => {
      if (isRemotePreviewPolygon(layer)) {
        layer.remove();
      }
    });
  }

  function drawRemotePreviewPath(path: string[]) {
    clearRemotePreviewPolygons();
    for (let i = 0; i < path.length; i++) {
      const key = path[i];
      const latLngs = gridKeyToLatLngs(map, key);
      const isLast = i === path.length - 1;
      const polygon = new RemotePreviewPolygon(latLngs, key, {
        interactive: false,
        color: colours.remotePreview,
        weight: isLast ? 3 : 2,
        fillOpacity: isLast ? 0.5 : 0.25,
        fillColor: colours.remotePreview,
      });
      polygon.addTo(map);
    }
  }

  function drawEndpoints(endpointKeys: string[]) {
    clearEndpointPolygons();
    for (const key of endpointKeys) {
      const latLngs = gridKeyToLatLngs(map, key);
      const polygon = new EndpointPolygon(latLngs, key, {
        interactive: true,
        color: colours.exactEndpoint,
        weight: 3,
        fillOpacity: 0.5,
        fillColor: colours.exactEndpoint,
      });
      polygon.addTo(map);
    }
  }

  function drawPreviewPaths(paths: string[][], index: number) {
    clearPreviewPolygons();

    const { currentPlayerName, players, showAllRoutes } = useGameStore.getState();
    const currentPlayer = players.find(p => p.name === currentPlayerName);
    const displayPaths = showAllRoutes ? paths : (paths[index] ? [paths[index]] : []);

    for (const path of displayPaths) {
      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        const latLngs = gridKeyToLatLngs(map, key);
        const polygon = new PreviewPolygon(latLngs, key, {
          interactive: true,
          color: colours.osMapsPurple,
          weight: 2,
          fillOpacity: 0.35,
        });
        polygon.addTo(map);
      }

      if (!currentPlayer || path.length === 0) continue;

      const roadPoints = roadPathThroughGrids(currentPlayer.position, path);
      const routePoints: L.LatLngTuple[] = roadPoints.map(([lat, lng]) => [lat, lng] as L.LatLngTuple);
      if (routePoints.length >= 2) {
        const routeLine = new RoutePolyline(routePoints, {
          color: colours.osMapsPurple,
          opacity: 0.8,
          weight: 6,
        });
        routeLine.addTo(map);
      }
    }
  }

  function drawPath(keys: string[], maxSteps?: number) {
    drawnPathRef.current = keys;
    clearPathPolygons();
    clearPreviewPolygons();
    clearEndpointPolygons();
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

  const computeAndSetPaths = useCallback(() => {
    if (!map || !showPreviewPaths) {
      clearPreviewPolygons();
      clearEndpointPolygons();
      return;
    }
    if (gameTurnState !== GameTurnState.DICE_ROLLED || !diceResult || movementPath.length > 0) {
      log.debug(`computeAndSetPaths: skipped (turnState=${gameTurnState} dice=${diceResult} startGrid=${playerStartGridKey} pathLen=${movementPath.length})`);
      return;
    }
    let effectiveStart = playerStartGridKey;
    if (!effectiveStart) {
      const { players, currentPlayerName } = useGameStore.getState();
      const currentPlayer = players.find(p => p.name === currentPlayerName);
      if (!currentPlayer) return;
      effectiveStart = latLngToGridKey(currentPlayer.position[0], currentPlayer.position[1]);
      useGameStore.getState().setPlayerStartGridKey(effectiveStart);
    }
    if (!isRoadDataLoaded()) {
      log.warn("computeAndSetPaths: road data not loaded, triggering load");
      const center = map.getCenter();
      void loadRoadData(center.lat, center.lng, 10);
      return;
    }
    const { players, currentPlayerName, reachableGrids } = useGameStore.getState();
    const occupied = occupiedGridKeys(players, currentPlayerName ?? "");
    const obstructionKeys = useDeckStore.getState().obstructions.map((o) => o.gridKey);
    for (const key of obstructionKeys) {
      occupied.add(key);
    }

    const reachable = reachableGrids ?? reachableRoadGrids(effectiveStart, diceResult, occupied);
    log.info(`computeAndSetPaths: dice=${diceResult} start=${effectiveStart} reachable=${reachable.size} occupied=${occupied.size} fromStore=${reachableGrids !== null}`);
    const roadCheck = (gridKey: string) => gridHasABRoad(gridKey) || gridHasRoad(gridKey);

    let atExactSteps = 0;
    let atExactStepsABRoad = 0;
    let atExactStepsAnyRoad = 0;
    reachable.forEach((steps, gridKey) => {
      if (steps === diceResult && !occupied.has(gridKey)) {
        atExactSteps++;
        if (gridHasABRoad(gridKey)) atExactStepsABRoad++;
        if (gridHasRoad(gridKey)) atExactStepsAnyRoad++;
      }
    });

    const endpoints: string[] = [];
    reachable.forEach((steps, gridKey) => {
      if (steps === diceResult && !occupied.has(gridKey) && gridHasABRoad(gridKey)) {
        endpoints.push(gridKey);
      }
    });

    if (endpoints.length === 0) {
      reachable.forEach((steps, gridKey) => {
        if (steps === diceResult && !occupied.has(gridKey) && gridHasRoad(gridKey)) {
          endpoints.push(gridKey);
        }
      });
    }

    const paths: string[][] = [];
    for (const endpoint of endpoints) {
      const path = shortestPath(effectiveStart, endpoint, diceResult, occupied);
      if (path) {
        paths.push(path);
      }
    }

    if (paths.length === 0) {
      const furthest: string[] = [];
      let maxDist = 0;
      reachable.forEach((steps, gridKey) => {
        if (!occupied.has(gridKey) && roadCheck(gridKey)) {
          if (steps > maxDist) {
            maxDist = steps;
            furthest.length = 0;
            furthest.push(gridKey);
          } else if (steps === maxDist) {
            furthest.push(gridKey);
          }
        }
      });
      for (const endpoint of furthest) {
        const path = shortestPath(effectiveStart, endpoint, diceResult, occupied);
        if (path) {
          paths.push(path);
        }
      }
    }
    log.info(`computeAndSetPaths: ${endpoints.length} exact-step endpoints → ${paths.length} valid paths (reachable=${reachable.size} dice=${diceResult})`);

    useGameStore.getState().setPathDiagnostics({
      dice: diceResult,
      reachable: reachable.size,
      atExactSteps,
      atExactStepsABRoad,
      atExactStepsAnyRoad,
      occupied: occupied.size,
      pathsFound: paths.length,
      startHasRoad: gridHasRoad(effectiveStart),
    });

    const allEndpointKeys = paths.map(p => p[p.length - 1]);
    drawEndpoints(allEndpointKeys);

    if (allEndpointKeys.length > 0) {
      const startLatLng = gridKeyToLatLng(effectiveStart);
      const points: L.LatLng[] = [L.latLng(startLatLng[0], startLatLng[1])];
      for (const key of allEndpointKeys) {
        const [lat, lng] = gridKeyToLatLng(key);
        points.push(L.latLng(lat, lng));
      }
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [80, 80], maxZoom: 13 });
    }

    useGameStore.getState().setPreviewPaths(paths);

    if (paths.length > 0) {
      drawPreviewPaths(paths, 0);
    }
  }, [map, gameTurnState, diceResult, playerStartGridKey, movementPath.length, showPreviewPaths, requestPreviewRecompute]);

  useEffect(() => {
    computeAndSetPaths();
  }, [computeAndSetPaths]);

  useEffect(() => {
    const unsub = onRoadDataReady(() => {
      log.info("road data ready, recomputing reachable grids and preview paths");
      const state = useGameStore.getState();
      if (state.gameTurnState === GameTurnState.DICE_ROLLED && state.diceResult) {
        let startKey = state.playerStartGridKey;
        if (!startKey) {
          const cp = state.players.find(p => p.name === state.currentPlayerName);
          if (cp) {
            startKey = latLngToGridKey(cp.position[0], cp.position[1]);
            useGameStore.getState().setPlayerStartGridKey(startKey);
          }
        }
        if (startKey) {
          const occupied = occupiedGridKeys(state.players, state.currentPlayerName ?? "");
          const obstructionKeys = useDeckStore.getState().obstructions.map((o) => o.gridKey);
          for (const key of obstructionKeys) {
            occupied.add(key);
          }
          const reachable = reachableRoadGrids(startKey, state.diceResult, occupied);
          useGameStore.getState().setReachableGrids(reachable);
        }
      }
      computeAndSetPaths();
    });
    return unsub;
  }, [computeAndSetPaths]);

  useEffect(() => {
    let prevLen = useGameStore.getState().movementPath.length;
    const unsub = useGameStore.subscribe((state) => {
      const newLen = state.movementPath.length;
      if (prevLen === 0 && newLen > 0 && state.gameTurnState === GameTurnState.DICE_ROLLED && state.diceResult) {
        if (drawnPathRef.current !== state.movementPath) {
          drawPath(state.movementPath, state.diceResult);
          checkMidMovementTrigger(state.movementPath, state.gameBounds);
        }
      }
      if (newLen === 0) {
        drawnPathRef.current = null;
      }
      prevLen = newLen;
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (previewPathIndex === prevIndexRef.current) return;
    prevIndexRef.current = previewPathIndex;

    if (previewPaths.length === 0 || movementPath.length > 0) return;

    drawPreviewPaths(previewPaths, previewPathIndex);
  }, [previewPathIndex, previewPaths, movementPath.length]);

  useEffect(() => {
    if (gameTurnState !== GameTurnState.DICE_ROLLED || movementPath.length > 0) return;
    if (previewPaths.length === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const { movementPath: currentPath, previewPaths: currentPreviews } = useGameStore.getState();
      if (currentPath.length > 0 || currentPreviews.length === 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        useGameStore.getState().cyclePreviewPath(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        useGameStore.getState().cyclePreviewPath(1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const { previewPaths: paths, previewPathIndex: idx, diceResult: dice, gameBounds } = useGameStore.getState();
        const path = paths[idx];
        if (path && dice) {
          useGameStore.getState().confirmPreviewPath();
          drawPath(path, dice);
          checkMidMovementTrigger(path, gameBounds);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameTurnState, movementPath.length, previewPaths.length]);

  useEffect(() => {
    const handler = (lat: number, lng: number) => {
      if (!map) return;

      const state = useGameStore.getState();
      const {
        playerStartGridKey: startKey,
        diceResult: dice,
        movementPath: path,
        players,
        currentPlayerName,
        gameTurnState: turnState,
        previewPaths: previews,
        cardTrigger: trigger,
        gameBounds: bounds,
      } = state;

      const localName = state.localPlayerName;
      if (localName === null || localName !== currentPlayerName) {
        log.info("click ignored: not local player's turn");
        return;
      }

      if (trigger) {
        log.info("click ignored: cardTrigger active");
        return;
      }

      let effectiveStartKey = startKey;
      if (turnState !== GameTurnState.DICE_ROLLED || !dice) {
        log.info("click ignored: turnState=", turnState, "startGrid=", startKey, "dice=", dice);
        return;
      }
      if (!effectiveStartKey) {
        const currentPlayer = players.find(p => p.name === currentPlayerName);
        if (!currentPlayer) return;
        effectiveStartKey = latLngToGridKey(currentPlayer.position[0], currentPlayer.position[1]);
        log.info("click: recovered playerStartGridKey from player position:", effectiveStartKey);
        useGameStore.getState().setPlayerStartGridKey(effectiveStartKey);
      }

      const gridKey = latLngToGridKey(lat, lng);
      log.info("click grid:", gridKey, "start:", effectiveStartKey);

      if (gridKey === effectiveStartKey) return;

      const occupied = occupiedGridKeys(players, currentPlayerName ?? "");
      const clickObstructions = useDeckStore.getState().obstructions.map((o) => o.gridKey);
      for (const key of clickObstructions) {
        occupied.add(key);
      }

      if (path.length > 0 && path[path.length - 1] === gridKey) {
        const newPath = path.slice(0, -1);
        setMovementPath(newPath);
        setSelectedEndpoint(newPath.length > 0 ? newPath[newPath.length - 1] : null);
        drawPath(newPath, dice);
        if (newPath.length === 0) {
          computeAndSetPaths();
        }
        return;
      }

      if (path.includes(gridKey)) return;

      if (path.length === 0 && previews.length > 0) {
        const matchIdx = previews.findIndex(p => p[p.length - 1] === gridKey);
        if (matchIdx >= 0) {
          useGameStore.getState().setPreviewPathIndex(matchIdx);
          drawPreviewPaths(previews, matchIdx);
          return;
        }
      }

      if (path.length === 0) {
        const found = shortestPath(effectiveStartKey, gridKey, dice, occupied);
        log.info("shortestPath result:", found ? `length ${found.length}` : "null", "for grid", gridKey, "roadData:", isRoadDataLoaded());
        if (found && found.length <= dice) {
          setMovementPath(found);
          setSelectedEndpoint(gridKey);
          useGameStore.getState().setPreviewPaths([]);
          drawPath(found, dice);
          checkMidMovementTrigger(found, bounds);
          return;
        }
      }

      if (path.length >= dice) {
        log.info("click ignored: path full", path.length, ">=", dice);
        return;
      }

      const lastKey = path.length > 0
        ? path[path.length - 1]
        : effectiveStartKey;

      const validNeighbors = getAdjacentRoadGrids(lastKey);
      if (!validNeighbors.includes(gridKey)) {
        log.info("click ignored: grid", gridKey, "not adjacent to", lastKey, "valid:", validNeighbors.slice(0, 5));
        return;
      }

      const wouldBeEndpoint = path.length + 1 === dice;
      if (wouldBeEndpoint && occupied.has(gridKey)) return;

      const newPath = [...path, gridKey];
      setMovementPath(newPath);
      setSelectedEndpoint(gridKey);
      useGameStore.getState().setPreviewPaths([]);
      drawPath(newPath, dice);
      checkMidMovementTrigger(newPath, bounds);
    };

    (window as unknown as Record<string, unknown>).__oscGridClickHandler = handler;
    log.info("Grid click handler registered");

    return () => {
      (window as unknown as Record<string, unknown>).__oscGridClickHandler = null;
    };
  }, [map]);

  useEffect(() => {
    if (gridClearRequest > 0) {
      map.eachLayer((layer) => {
        if ((layer instanceof L.Polygon && !isRemotePreviewPolygon(layer)) || isRoutePolyline(layer)) {
          layer.remove();
        }
      });
      setSelectedGridSquares([]);
      setMovementPath([]);
      useGameStore.getState().setPreviewPaths([]);
      setTimeout(() => computeAndSetPaths(), 50);
    }
  }, [gridClearRequest, map, setSelectedGridSquares, setMovementPath]);

  useEffect(() => {
    if (remotePreviewPath && remotePreviewPath.length > 0) {
      drawRemotePreviewPath(remotePreviewPath);
    } else {
      clearRemotePreviewPolygons();
    }
  }, [remotePreviewPath]);

  const broadcastDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!sessionId) return;
    const currentPath = previewPaths[previewPathIndex] ?? null;
    if (broadcastDebounceRef.current) clearTimeout(broadcastDebounceRef.current);
    broadcastDebounceRef.current = setTimeout(() => {
      updatePreviewPath.mutate({ sessionId, path: currentPath ?? null });
    }, 600);
    return () => {
      if (broadcastDebounceRef.current) clearTimeout(broadcastDebounceRef.current);
    };
  }, [previewPaths, previewPathIndex, sessionId]);

  return null;
}
