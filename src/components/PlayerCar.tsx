"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import { Marker, Popup } from "react-leaflet"
import { useGameStore, GameTurnState, Player } from "@/stores/game-store"
import { carImageForStyle, useCarStore } from "@/stores/car-store"
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

const ANIMATION_MS_PER_SEGMENT = 200

export default function PlayerCar({ player }: PlayerCarProps) {
  const markerRef = useRef<L.Marker>(null)
  const {
    gameTurnState,
    currentPlayerName,
    localPlayerName,
  } = useGameStore()
  const { carSize } = useCarStore()

  const [routeAnim, setRouteAnim] = useState<[number, number][] | null>(null)
  const [animatedPosition, setAnimatedPosition] = useState<[number, number] | null>(null)

  const active = player.name === currentPlayerName
  const isAnimating = animatedPosition !== null
  const hide = !active && gameTurnState === GameTurnState.DICE_ROLLED && !isAnimating

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

  useEffect(() => {
    if (player.completedRoute && player.completedRoute.length >= 2) {
      setRouteAnim([...player.completedRoute])
    }
  }, [player.completedRoute])

  useEffect(() => {
    if (!routeAnim || routeAnim.length < 2) return

    let segmentIndex = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let cancelled = false

    const step = () => {
      if (cancelled) return
      setAnimatedPosition(routeAnim[segmentIndex])
      segmentIndex++
      if (segmentIndex < routeAnim.length) {
        timeoutId = setTimeout(step, ANIMATION_MS_PER_SEGMENT)
      } else {
        timeoutId = setTimeout(() => {
          if (cancelled) return
          setAnimatedPosition(null)
          setRouteAnim(null)
        }, ANIMATION_MS_PER_SEGMENT)
      }
    }

    step()
    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [routeAnim])

  useEffect(() => {
    const el = markerRef.current?.getElement() as HTMLElement | null
    if (!el || !routeAnim) return
    el.style.transition = `transform ${ANIMATION_MS_PER_SEGMENT}ms linear`
    return () => {
      el.style.transition = ""
    }
  }, [routeAnim])

  const isLocalPlayer = localPlayerName === player.name

  function popupCaption() {
    return isLocalPlayer ? `${player.name} (You)` : player.name
  }

  if (hide) {
    return null
  }

  return (
    <Marker
      position={animatedPosition ?? player.position}
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
