import { create } from "zustand"
import { persist } from "zustand/middleware"
import { log } from "@/lib/utils"
import { latLngToGridKey, gridKeyToLatLng, gridHasRoad, isRoadDataLoaded, reachableRoadGrids } from "@/lib/road-data"
import { CAR_STYLES } from "@/stores/car-store"
import { type AreaSize, type GameBounds, DEFAULT_AREA_SIZE } from "@/lib/area-size"

export enum GameTurnState {
  ROLL_DICE = "ROLL_DICE",
  DICE_ROLLED = "DICE_ROLLED",
  MOVE_PLAYER = "MOVE_PLAYER",
  END_TURN = "END_TURN",
}

export type GamePhase = "lobby" | "picking" | "playing" | "ended"

export interface SelectedPoi {
  category: string;
  osmId: number;
  name: string | null;
  lat: number;
  lng: number;
}

export interface Player {
  position: [number, number];
  previousPosition: [number, number] | null;
  completedRoute: [number, number][] | null;
  name: string;
  iconType: string;
  visitedPois: string[];
  hasReturnedToStart: boolean;
}

export interface GridReferenceData {
  eastings: string;
  northings: string;
  column: number;
  row: number;
  gridCode: string;
  gridReference: string;
}

export interface GridSquareCorners {
  northWest: string;
  northEast: string;
  southWest: string;
  southEast: string;
}

export interface MapClickPosition {
  latLng: { lat: number; lng: number };
  gridReferenceData: GridReferenceData;
  gridSquareCorners: GridSquareCorners;
}

export interface SelectedGrid {
  gridSquareLatLongs: { lat: number; lng: number }[];
  gridKey: string;
}

export function createGridKey(eastings: string, northings: string): string {
  const e = Math.floor(parseInt(eastings, 10) / 1000) * 1000;
  const n = Math.floor(parseInt(northings, 10) / 1000) * 1000;
  return `${e}-${n}`;
}

export function occupiedGridKeys(players: Player[], excludePlayerName: string): Set<string> {
  const keys = new Set<string>();
  for (const player of players) {
    if (player.name !== excludePlayerName) {
      keys.add(latLngToGridKey(player.position[0], player.position[1]));
    }
  }
  return keys;
}

export function getAdjacentGridKeys(gridKey: string): string[] {
  const [e, n] = gridKey.split("-").map(Number);
  return [
    `${e}-${n + 1000}`,
    `${e}-${n - 1000}`,
    `${e + 1000}-${n}`,
    `${e - 1000}-${n}`,
  ];
}

interface GameState {
  players: Player[];
  gameTurnState: GameTurnState;
  currentPlayerName: string | null;
  diceResult: number | null;
  mapCentre: [number, number] | null;
  mapClickPosition: MapClickPosition | null;
  mapZoom: number;
  selectedGridSquares: SelectedGrid[];
  movementPath: string[];
  playerStartGridKey: string | null;
  playerZoomRequest: string | null;
  gridClearRequest: number;
  areaSize: AreaSize;
  gameBounds: GameBounds | null;
  sessionId: string | null;
  playerId: string | null;
  sessionCode: string | null;
  localPlayerName: string | null;
  reachableGrids: Map<string, number> | null;
  selectedEndpoint: string | null;
  pendingServerUpdate: boolean;
  phase: GamePhase;
  creatorPlayerId: string | null;
  selectedPois: SelectedPoi[] | null;
  poiCandidates: SelectedPoi[] | null;
  winnerName: string | null;

  setReachableGrids: (grids: Map<string, number> | null) => void;
  setSelectedEndpoint: (endpoint: string | null) => void;
  setAreaSize: (areaSize: AreaSize) => void;
  setGameBounds: (bounds: GameBounds | null) => void;
  setPlayers: (players: Player[]) => void;
  setGameTurnState: (state: GameTurnState) => void;
  setCurrentPlayer: (name: string) => void;
  setDiceResult: (result: number | null) => void;
  setMapCentre: (centre: [number, number]) => void;
  setMapClickPosition: (position: MapClickPosition | null) => void;
  setMapZoom: (zoom: number) => void;
  setSelectedGridSquares: (grids: SelectedGrid[]) => void;
  addSelectedGridSquare: (grid: SelectedGrid) => void;
  removeSelectedGridSquare: (index: number) => void;
  setMovementPath: (path: string[]) => void;
  addToMovementPath: (gridKey: string) => void;
  removeFromMovementPath: (gridKey: string) => void;
  setPlayerStartGridKey: (gridKey: string | null) => void;
  canSelectGrid: (gridKey: string) => boolean;
  getLastPathGridKey: () => string | null;
  setPlayerZoomRequest: (name: string | null) => void;
  clearGridSelections: () => void;
  updatePlayerPosition: (playerName: string, position: [number, number]) => void;
  movePlayerTo: (playerName: string, newPosition: [number, number]) => void;
  handleDiceRoll: (result: number) => void;
  handleEndTurn: () => void;
  playerRouteReceived: () => void;
  initialisePlayers: (startingPosition: [number, number]) => void;
  setSessionId: (sessionId: string | null) => void;
  setPlayerId: (playerId: string | null) => void;
  setSessionCode: (code: string | null) => void;
  setLocalPlayerName: (name: string | null) => void;
  setPendingServerUpdate: (pending: boolean) => void;
  setPhase: (phase: GamePhase) => void;
  setCreatorPlayerId: (id: string | null) => void;
  setSelectedPois: (pois: SelectedPoi[] | null) => void;
  setPoiCandidates: (candidates: SelectedPoi[] | null) => void;
  setWinnerName: (name: string | null) => void;
  isCreator: () => boolean;
  leaveSession: () => void;
}

const defaultZoom = 7;

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      players: [],
      gameTurnState: GameTurnState.ROLL_DICE,
      currentPlayerName: null,
      diceResult: null,
      mapCentre: null,
      mapClickPosition: null,
      mapZoom: defaultZoom,
      selectedGridSquares: [],
      movementPath: [],
      playerStartGridKey: null,
      playerZoomRequest: null,
      gridClearRequest: 0,
      areaSize: DEFAULT_AREA_SIZE,
      gameBounds: null,
      sessionId: null,
      playerId: null,
      sessionCode: null,
      localPlayerName: null,
      reachableGrids: null,
      selectedEndpoint: null,
      pendingServerUpdate: false,
      phase: "lobby" as GamePhase,
      creatorPlayerId: null,
      selectedPois: null,
      poiCandidates: null,
      winnerName: null,

      setReachableGrids: (reachableGrids) => set({ reachableGrids }),

      setSelectedEndpoint: (selectedEndpoint) => set({ selectedEndpoint }),

      setAreaSize: (areaSize) => set({ areaSize }),

      setGameBounds: (gameBounds) => set({ gameBounds }),

      setPlayers: (players) => set({ players }),

      setGameTurnState: (gameTurnState) => set({ gameTurnState }),

      setCurrentPlayer: (currentPlayerName) => set({ currentPlayerName }),

      setDiceResult: (diceResult) => set({ diceResult }),

      setMapCentre: (mapCentre) => set({ mapCentre }),

      setMapClickPosition: (mapClickPosition) => set({ mapClickPosition }),

      setMapZoom: (mapZoom) => set({ mapZoom }),

      setSelectedGridSquares: (selectedGridSquares) => set({ selectedGridSquares }),

      addSelectedGridSquare: (grid) => set((state) => ({
        selectedGridSquares: [...state.selectedGridSquares, grid],
      })),

      removeSelectedGridSquare: (index) => set((state) => ({
        selectedGridSquares: state.selectedGridSquares.filter((_, i) => i !== index),
      })),

      setMovementPath: (movementPath) => set({ movementPath }),

      addToMovementPath: (gridKey) => set((state) => ({
        movementPath: [...state.movementPath, gridKey],
      })),

      removeFromMovementPath: (gridKey) => set((state) => {
        const index = state.movementPath.indexOf(gridKey);
        if (index === -1) return state;
        if (index === state.movementPath.length - 1) {
          return { movementPath: state.movementPath.slice(0, -1) };
        }
        return state;
      }),

      setPlayerStartGridKey: (playerStartGridKey) => set({ playerStartGridKey }),

      canSelectGrid: (gridKey) => {
        const state = get();
        if (!state.diceResult) {
          log.debug("canSelectGrid: no diceResult");
          return false;
        }
        if (!state.reachableGrids) {
          log.debug("canSelectGrid: no reachableGrids");
          return false;
        }
        if (gridKey === state.playerStartGridKey) {
          log.debug("canSelectGrid: clicked start grid");
          return false;
        }
        if (!state.reachableGrids.has(gridKey)) {
          log.debug("canSelectGrid: grid", gridKey, "not in reachableGrids (size:", state.reachableGrids.size, ")");
          return false;
        }
        return true;
      },

      getLastPathGridKey: () => {
        const state = get();
        if (state.movementPath.length === 0) {
          return state.playerStartGridKey;
        }
        return state.movementPath[state.movementPath.length - 1];
      },

      setPlayerZoomRequest: (playerZoomRequest) => set({ playerZoomRequest }),

      clearGridSelections: () => set((state) => ({
        selectedGridSquares: [],
        movementPath: [],
        gridClearRequest: state.gridClearRequest + 1,
        selectedEndpoint: null,
      })),

      updatePlayerPosition: (playerName, position) => {
        log.debug("updatePlayerPosition:", playerName, "to:", position);
        return set((state) => ({
          players: state.players.map((player) =>
            player.name === playerName ? { ...player, position } : player
          ),
        }));
      },

      movePlayerTo: (playerName, newPosition) => {
        log.debug("movePlayerTo:", playerName, "newPosition:", newPosition);
        return set((state) => ({
          players: state.players.map((player) =>
            player.name === playerName
              ? { ...player, previousPosition: player.position, position: newPosition }
              : player
          ),
        }));
      },

      handleDiceRoll: (result) => {
        const state = get();
        const currentPlayer = state.players.find(
          (p) => p.name === state.currentPlayerName
        );
        if (!currentPlayer) {
          set({ diceResult: result, gameTurnState: GameTurnState.DICE_ROLLED });
          return;
        }

        const startGridKey = latLngToGridKey(currentPlayer.position[0], currentPlayer.position[1]);

        const occupied = occupiedGridKeys(state.players, state.currentPlayerName ?? "");
        const reachable = reachableRoadGrids(startGridKey, result, occupied);

        set({
          diceResult: result,
          gameTurnState: GameTurnState.DICE_ROLLED,
          playerStartGridKey: startGridKey,
          playerZoomRequest: state.currentPlayerName,
          reachableGrids: reachable,
          selectedEndpoint: null,
        } as Partial<GameState> as GameState);
      },

      handleEndTurn: () => {
        const state = get();

        let routeCoords: [number, number][] | null = null;

        if (state.movementPath.length > 0 && state.currentPlayerName && state.playerStartGridKey) {
          const currentPlayer = state.players.find((p) => p.name === state.currentPlayerName);
          const startCoord: [number, number] = currentPlayer
            ? [currentPlayer.position[0], currentPlayer.position[1]]
            : gridKeyToLatLng(state.playerStartGridKey);
          routeCoords = [
            startCoord,
            ...state.movementPath.map((key) => gridKeyToLatLng(key)),
          ];

          const lastGridKey = state.movementPath[state.movementPath.length - 1];
          const destination = gridKeyToLatLng(lastGridKey);

          set({
            players: state.players.map((player) =>
              player.name === state.currentPlayerName
                ? {
                    ...player,
                    previousPosition: player.position,
                    position: destination,
                    completedRoute: routeCoords,
                  }
                : player
            ),
          });
        }

        const updatedState = get();
        const currentIndex = updatedState.players.findIndex(
          (p) => p.name === updatedState.currentPlayerName
        );
        const nextIndex = (currentIndex + 1) % updatedState.players.length;
        const nextPlayer = updatedState.players[nextIndex];

        set({
          gameTurnState: GameTurnState.ROLL_DICE,
          currentPlayerName: nextPlayer?.name ?? null,
          diceResult: null,
          selectedGridSquares: [],
          movementPath: [],
          playerStartGridKey: null,
          gridClearRequest: updatedState.gridClearRequest + 1,
          reachableGrids: null,
          selectedEndpoint: null,
        });
      },

      playerRouteReceived: () => {
        const state = get();
        const movedPlayer = state.players.find((p) => p.completedRoute !== null);
        log.debug("playerRouteReceived: movedPlayer:", movedPlayer?.name);
        if (movedPlayer) {
          set({
            players: state.players.map((player) =>
              player.name === movedPlayer.name
                ? { ...player, previousPosition: null, completedRoute: null }
                : player
            ),
          });
        }
      },

      initialisePlayers: (startingPosition) => {
        const players: Player[] = CAR_STYLES.slice(0, 3).map((iconType, index) => ({
          name: `Player ${index + 1}`,
          iconType,
          position: [
            startingPosition[0] + 0.00014023745552549371 * index,
            startingPosition[1] + -0.0002467632293701172 * index,
          ] as [number, number],
          previousPosition: null,
          completedRoute: null,
          visitedPois: [],
          hasReturnedToStart: false,
        }))

        set({
          players,
          currentPlayerName: players[0].name,
          gameTurnState: GameTurnState.ROLL_DICE,
          playerZoomRequest: players[0].name,
        })
      },

      setSessionId: (sessionId) => set({ sessionId }),

      setPlayerId: (playerId) => set({ playerId }),

      setSessionCode: (sessionCode) => set({ sessionCode }),

      setLocalPlayerName: (localPlayerName) => set({ localPlayerName }),

      setPendingServerUpdate: (pendingServerUpdate) => set({ pendingServerUpdate }),

      setPhase: (phase) => set({ phase }),

      setCreatorPlayerId: (creatorPlayerId) => set({ creatorPlayerId }),

      setSelectedPois: (selectedPois) => set({ selectedPois }),

      setPoiCandidates: (poiCandidates) => set({ poiCandidates }),

      setWinnerName: (winnerName) => set({ winnerName }),

      isCreator: () => {
        const state = get();
        return state.playerId !== null && state.playerId === state.creatorPlayerId;
      },

      leaveSession: () => set({
        sessionId: null,
        playerId: null,
        sessionCode: null,
        localPlayerName: null,
        areaSize: DEFAULT_AREA_SIZE,
        gameBounds: null,
        players: [],
        currentPlayerName: null,
        gameTurnState: GameTurnState.ROLL_DICE,
        reachableGrids: null,
        selectedEndpoint: null,
        phase: "lobby" as GamePhase,
        creatorPlayerId: null,
        selectedPois: null,
        poiCandidates: null,
        winnerName: null,
      }),
    }),
    {
      name: "oscillation-game",
      partialize: (state) => ({
        mapZoom: state.mapZoom,
        mapCentre: state.mapCentre,
        sessionId: state.sessionId,
        playerId: state.playerId,
        sessionCode: state.sessionCode,
        localPlayerName: state.localPlayerName,
        areaSize: state.areaSize,
        phase: state.phase,
        creatorPlayerId: state.creatorPlayerId,
      }),
    }
  )
);

export const useCurrentPlayer = () => {
  const { players, currentPlayerName } = useGameStore();
  return players.find((p) => p.name === currentPlayerName);
};

export const usePlayer = (playerName: string) => {
  const players = useGameStore((state) => state.players);
  return players.find((p) => p.name === playerName);
};
