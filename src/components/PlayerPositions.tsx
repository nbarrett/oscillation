'use client';

import { useEffect } from 'react';
import { Box, Grid, Link } from '@mui/material';
import { useGameStore, useCurrentPlayer, GameTurnState } from '@/stores/game-store';
import { formatLatLong, log } from '@/lib/utils';
import GridReferences from './GridReferences';

export default function PlayerPositions() {
  const {
    players,
    gameTurnState,
    setCurrentPlayer,
    setPlayerZoomRequest,
    setGameTurnState,
  } = useGameStore();
  const currentPlayer = useCurrentPlayer();

  useEffect(() => {
    if (players.length > 0 && !currentPlayer) {
      log.debug('initialising current player to:', players[0]);
      setCurrentPlayer(players[0].name);
    }
  }, [currentPlayer, players, setCurrentPlayer]);

  useEffect(() => {
    log.debug('gameTurnState received:', gameTurnState);
    if (gameTurnState === GameTurnState.END_TURN) {
      selectNextPlayer();
    }
  }, [gameTurnState]);

  function selectNextPlayer() {
    if (!currentPlayer) return;

    const currentPlayerIndex = players.findIndex(
      (player) => player.name === currentPlayer.name
    );
    const newIndex =
      currentPlayerIndex < players.length - 1 ? currentPlayerIndex + 1 : 0;
    const newPlayer = players[newIndex];

    if (newPlayer) {
      log.debug('setting current player to:', newPlayer);
      setCurrentPlayer(newPlayer.name);
      setPlayerZoomRequest(newPlayer.name);
      setGameTurnState(GameTurnState.ROLL_DICE);
    } else {
      log.error('unable to find next player');
    }
  }

  return (
    <Grid container direction="row" spacing={1}>
      {players.map((player) => (
        <Grid item xs key={player.name}>
          <Link
            onClick={() => setPlayerZoomRequest(player.name)}
            sx={{ cursor: 'pointer' }}
          >
            {player.name}
          </Link>
          <Box>lat-long: {formatLatLong(player.position)}</Box>
        </Grid>
      ))}
      <GridReferences />
    </Grid>
  );
}
