"use client"

import { cn } from "@/lib/cn"

interface DiceFaceProps {
  value: 1 | 2 | 3 | 4 | 5 | 6
  className?: string
}

function Pip({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return <circle cx={cx} cy={cy} r="10" fill={color} />
}

function DiceFaceSVG({ value }: { value: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const pipPositions: Record<number, Array<{ cx: number; cy: number }>> = {
    1: [{ cx: 50, cy: 50 }],
    2: [
      { cx: 22, cy: 22 },
      { cx: 78, cy: 78 },
    ],
    3: [
      { cx: 22, cy: 22 },
      { cx: 50, cy: 50 },
      { cx: 78, cy: 78 },
    ],
    4: [
      { cx: 22, cy: 22 },
      { cx: 78, cy: 22 },
      { cx: 22, cy: 78 },
      { cx: 78, cy: 78 },
    ],
    5: [
      { cx: 22, cy: 22 },
      { cx: 78, cy: 22 },
      { cx: 50, cy: 50 },
      { cx: 22, cy: 78 },
      { cx: 78, cy: 78 },
    ],
    6: [
      { cx: 22, cy: 22 },
      { cx: 78, cy: 22 },
      { cx: 22, cy: 50 },
      { cx: 78, cy: 50 },
      { cx: 22, cy: 78 },
      { cx: 78, cy: 78 },
    ],
  }

  const isOdd = value % 2 === 1
  const pipColor = isOdd ? "#4f3a8c" : "#e91e63"
  const pips = pipPositions[value] || []

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {pips.map((pip, index) => (
        <Pip key={index} cx={pip.cx} cy={pip.cy} color={pipColor} />
      ))}
    </svg>
  )
}

interface Dice3DProps {
  value: 1 | 2 | 3 | 4 | 5 | 6
  isRolling?: boolean
  className?: string
}

const faceRotations: Record<number, string> = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(-90deg)",
  6: "rotateX(180deg) rotateY(0deg)",
}

export function Dice3D({ value, isRolling, className }: Dice3DProps) {
  const rotation = faceRotations[value]

  return (
    <div className={cn("dice-scene", className)}>
      <div
        className={cn(
          "dice-cube",
          isRolling && "dice-rolling"
        )}
        style={!isRolling ? { transform: rotation } : undefined}
      >
        <div className="dice-face dice-face-1"><DiceFaceSVG value={1} /></div>
        <div className="dice-face dice-face-2"><DiceFaceSVG value={2} /></div>
        <div className="dice-face dice-face-3"><DiceFaceSVG value={3} /></div>
        <div className="dice-face dice-face-4"><DiceFaceSVG value={4} /></div>
        <div className="dice-face dice-face-5"><DiceFaceSVG value={5} /></div>
        <div className="dice-face dice-face-6"><DiceFaceSVG value={6} /></div>
      </div>
    </div>
  )
}

interface DiceDisplayProps {
  dice1: number
  dice2: number
  isRolling: boolean
  className?: string
}

export function DiceDisplay({ dice1, dice2, isRolling, className }: DiceDisplayProps) {
  const safeValue = (v: number): 1 | 2 | 3 | 4 | 5 | 6 => {
    if (v < 1 || v > 6) return 1
    return v as 1 | 2 | 3 | 4 | 5 | 6
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Dice3D value={safeValue(dice1)} isRolling={isRolling} />
      <Dice3D value={safeValue(dice2)} isRolling={isRolling} />
    </div>
  )
}

export function DiceFace({ value, className }: DiceFaceProps) {
  return (
    <div className={cn("w-12 h-12", className)}>
      <Dice3D value={value} />
    </div>
  )
}
