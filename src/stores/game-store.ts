import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum GameTurnState {
  ROLL_DICE = 'ROLL_DICE',
  DICE_ROLLED = 'DICE_ROLLED',
  MOVE_PLAYER = 'MOVE_PLAYER',
  END_TURN = 'END_TURN',
}

export interface Player {
  position: [number, number];
  nextPosition?: [number, number];
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
  setPlayerZoomRequest: (name: string | null) => void;
  clearGridSelections: () => void;
  updatePlayerPosition: (playerName: string, position: [number, number]) => void;
  updatePlayerNextPosition: (playerName: string, nextPosition: [number, number] | null) => void;
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

      setPlayerZoomRequest: (playerZoomRequest) => set({ playerZoomRequest }),

      clearGridSelections: () => set((state) => ({
        selectedGridSquares: [],
        gridClearRequest: state.gridClearRequest + 1,
      })),

      updatePlayerPosition: (playerName, position) => set((state) => ({
        players: state.players.map((player) =>
          player.name === playerName ? { ...player, position } : player
        ),
      })),

      updatePlayerNextPosition: (playerName, nextPosition) => set((state) => ({
        players: state.players.map((player) =>
          player.name === playerName ? { ...player, nextPosition: nextPosition ?? undefined } : player
        ),
      })),

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
          gridClearRequest: state.gridClearRequest + 1,
        });
      },

      playerRouteReceived: () => {
        const state = get();
        const currentPlayer = state.players.find(
          (p) => p.name === state.currentPlayerName
        );
        if (currentPlayer?.nextPosition) {
          set({
            players: state.players.map((player) =>
              player.name === state.currentPlayerName
                ? { ...player, position: player.nextPosition!, nextPosition: undefined }
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
        players: state.players,
        currentPlayerName: state.currentPlayerName,
        mapZoom: state.mapZoom,
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
