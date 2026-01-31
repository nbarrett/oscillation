"use client"

import { useGameStore, GameTurnState } from "@/stores/game-store"
import { pluraliseWithCount } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export default function GridSelectionButton() {
  const { selectedGridSquares, gameTurnState, clearGridSelections } = useGameStore()

  if (gameTurnState !== GameTurnState.DICE_ROLLED || selectedGridSquares.length === 0) {
    return null
  }

  return (
    <Button variant="outline" size="sm" onClick={clearGridSelections}>
      Clear {pluraliseWithCount(selectedGridSquares.length, "Move")}
    </Button>
  )
}
