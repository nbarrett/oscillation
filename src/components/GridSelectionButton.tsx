'use client';

import { Button } from '@mui/material';
import { useGameStore, GameTurnState } from '@/stores/game-store';
import { colours, pluraliseWithCount } from '@/lib/utils';

export default function GridSelectionButton() {
  const { selectedGridSquares, gameTurnState, clearGridSelections } = useGameStore();

  if (gameTurnState !== GameTurnState.DICE_ROLLED || selectedGridSquares.length === 0) {
    return null;
  }

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={clearGridSelections}
      sx={{
        '&': { backgroundColor: colours.osMapsPurple },
        '&:hover': { backgroundColor: colours.osMapsPink },
      }}
    >
      Clear {pluraliseWithCount(selectedGridSquares.length, 'Move')}
    </Button>
  );
}
