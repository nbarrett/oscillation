"use client"

import { useEffect, useMemo, useRef } from "react"
import L from "leaflet"
import { Marker, Popup } from "react-leaflet"
import { useGameStore, GameTurnState, Player } from "@/stores/game-store"
import { carImageForStyle, useCarStore } from "@/stores/car-store"
import { asTitle, pluraliseWithCount } from "@/lib/utils"
import PlayerMoveRoute from "./PlayerMoveRoute"

function createCarIcon(iconType: string, isActive: boolean, carWidth: number): L.DivIcon {
  const carHeight = Math.round(carWidth * 0.65)
  const imagePath = carImageForStyle(iconType)
  const shadowOffset = isActive ? 8 : 4
  const liftAmount = isActive ? -6 : -2
  const scale = isActive ? 1.15 : 1

  return new L.DivIcon({
    className: "car-3d-icon",
    iconSize: [carWidth, carHeight + 20],
    iconAnchor: [carWidth / 2, carHeight + 10],
    html: `
      <div class="car-3d-container" style="
        position: relative;
        width: ${carWidth}px;
        height: ${carHeight + 20}px;
        transform: scale(${scale});
        transition: transform 0.2s ease;
      ">
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: ${carWidth * 0.8}px;
          height: ${shadowOffset * 2}px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(2px);
        "></div>
        <div style="
          position: absolute;
          bottom: ${10 + liftAmount}px;
          left: 0;
          width: ${carWidth}px;
          height: ${carHeight}px;
        ">
          <img
            src="${imagePath}"
            alt="car"
            style="
              width: 100%;
              height: 100%;
              object-fit: contain;
              filter: drop-shadow(2px 4px 3px rgba(0,0,0,0.3));
            "
          />
        </div>
        ${isActive ? `
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: ${carWidth}px;
          height: 6px;
          background: radial-gradient(ellipse, rgba(255,215,0,0.6) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        "></div>
        ` : ""}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
        }
      </style>
    `,
  })
}

interface PlayerCarProps {
  player: Player
}

export default function PlayerCar({ player }: PlayerCarProps) {
  const markerRef = useRef<L.Marker>(null)
  const {
    gameTurnState,
    diceResult,
    currentPlayerName,
  } = useGameStore()
  const { carSize } = useCarStore()

  const active = player.name === currentPlayerName
  const hide = !active && gameTurnState === GameTurnState.DICE_ROLLED

  const icon = useMemo(
    () => createCarIcon(player.iconType || CAR_FALLBACK, active, carSize),
    [player.iconType, active, carSize]
  )

  const eventHandlers = useMemo(
    () => ({
      mouseover() {
        markerRef.current?.openPopup()
      },
    }),
    []
  )

  useEffect(() => {
    if (active && markerRef.current) {
      markerRef.current.openPopup()
    }
  }, [active, gameTurnState])

  function popupCaption() {
    if (active && gameTurnState === GameTurnState.DICE_ROLLED) {
      return `Okay ${player.name} - move ${pluraliseWithCount(diceResult || 0, "square")}!`
    } else if (active) {
      return `It's ${player.name}'s turn and it's time to ${asTitle(gameTurnState)}`
    } else {
      return `It's ${currentPlayerName}'s turn - you must wait for them to finish first!`
    }
  }

  if (hide) {
    return null
  }

  return (
    <Marker
      position={player.position}
      icon={icon}
      riseOnHover={false}
      eventHandlers={eventHandlers}
      ref={markerRef}
    >
      <PlayerMoveRoute player={player} />
      <Popup className="custom-popup" offset={[0, -50]}>{popupCaption()}</Popup>
    </Marker>
  )
}

const CAR_FALLBACK = "FERRARI_RED"
