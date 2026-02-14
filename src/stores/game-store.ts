import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { log } from '@/lib/utils';
import { latLngToGridKey } from '@/lib/road-data';

export enum GameTurnState {
  ROLL_DICE = 'ROLL_DICE',
  DICE_ROLLED = 'DICE_ROLLED',
  MOVE_PLAYER = 'MOVE_PLAYER',
  END_TURN = 'END_TURN',
}

export interface Player {
  position: [number, number];
  previousPosition?: [number, number];
  name: string;
  iconType: 'white' | 'blue' | 'red';
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
  gridKey: string; // Unique key based on grid coordinates (e.g., "1234-5678")
}

// Helper to create a grid key from eastings/northings (floored to 100m)
export function createGridKey(eastings: string, northings: string): string {
  const e = Math.floor(parseInt(eastings, 10) / 100) * 100;
  const n = Math.floor(parseInt(northings, 10) / 100) * 100;
  return `${e}-${n}`;
}

// Check if two grid keys represent adjacent squares (N/S/E/W only, no diagonal)
export function areGridsAdjacent(key1: string, key2: string): boolean {
  const [e1, n1] = key1.split('-').map(Number);
  const [e2, n2] = key2.split('-').map(Number);

  const eDiff = Math.abs(e1 - e2);
  const nDiff = Math.abs(n1 - n2);

  // Adjacent means exactly 100m apart in one direction, 0 in the other
  return (eDiff === 100 && nDiff === 0) || (eDiff === 0 && nDiff === 100);
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
  const [e, n] = gridKey.split('-').map(Number);
  return [
    `${e}-${n + 100}`, // North
    `${e}-${n - 100}`, // South
    `${e + 100}-${n}`, // East
    `${e - 100}-${n}`, // West
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
  movementPath: string[]; // Ordered list of grid keys representing the path
  playerStartGridKey: string | null; // Grid key where current player started their turn
  playerZoomRequest: string | null;
  gridClearRequest: number;
  sessionId: string | null;
  playerId: string | null;
  sessionCode: string | null;

  setPlayers: (players: Player[]) => void;
  setGameTurnState: (state: GameTurnState) => void;
  setCurrentPlayer: (name: string) => void;
  setDiceResult: (result: number) => void;
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
      sessionId: null,
      playerId: null,
      sessionCode: null,

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
        // Only allow removing from the end of the path
        if (index === state.movementPath.length - 1) {
          return { movementPath: state.movementPath.slice(0, -1) };
        }
        return state;
      }),

      setPlayerStartGridKey: (playerStartGridKey) => set({ playerStartGridKey }),

      canSelectGrid: (gridKey) => {
        const state = get();
        // Can't select if no dice rolled
        if (!state.diceResult) return false;
        // Can't select if already at max moves
        if (state.movementPath.length >= state.diceResult) return false;
        if (state.movementPath.includes(gridKey)) return false;
        const occupied = occupiedGridKeys(state.players, state.currentPlayerName ?? "");
        if (occupied.has(gridKey)) return false;

        if (state.movementPath.length === 0) {
          if (!state.playerStartGridKey) return false;
          return areGridsAdjacent(gridKey, state.playerStartGridKey);
        }

        const lastGridKey = state.movementPath[state.movementPath.length - 1];
        return areGridsAdjacent(gridKey, lastGridKey);
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

      handleDiceRoll: (result) => set({
        diceResult: result,
        gameTurnState: GameTurnState.DICE_ROLLED,
      }),

      handleEndTurn: () => {
        const state = get();
        const currentIndex = state.players.findIndex(
          (p) => p.name === state.currentPlayerName
        );
        const nextIndex = (currentIndex + 1) % state.players.length;
        const nextPlayer = state.players[nextIndex];

        set({
          gameTurnState: GameTurnState.ROLL_DICE,
          currentPlayerName: nextPlayer?.name ?? null,
          diceResult: null,
          selectedGridSquares: [],
          movementPath: [],
          playerStartGridKey: null,
          gridClearRequest: state.gridClearRequest + 1,
        });
      },

      playerRouteReceived: () => {
        const state = get();
        const currentPlayer = state.players.find(
          (p) => p.name === state.currentPlayerName
        );
        log.debug("playerRouteReceived: currentPlayer:", currentPlayer?.name, "previousPosition:", currentPlayer?.previousPosition);
        if (currentPlayer?.previousPosition) {
          set({
            players: state.players.map((player) =>
              player.name === state.currentPlayerName
                ? { ...player, previousPosition: undefined }
                : player
            ),
          });
        }
      },

      initialisePlayers: (startingPosition) => {
        const iconTypes: ("white" | "blue" | "red")[] = ["white", "blue", "red"]
        const players: Player[] = iconTypes.map((iconType, index) => ({
          name: `Player ${index + 1}`,
          iconType,
          position: [
            startingPosition[0] + 0.00014023745552549371 * index,
            startingPosition[1] + -0.0002467632293701172 * index,
          ] as [number, number],
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

      leaveSession: () => set({
        sessionId: null,
        playerId: null,
        sessionCode: null,
        players: [],
        currentPlayerName: null,
        gameTurnState: GameTurnState.ROLL_DICE,
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
