'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { useGameStore, useCurrentPlayer, GameTurnState, Player } from '@/stores/game-store';
import { log, asTitle, pluraliseWithCount } from '@/lib/utils';
import PlayerMoveRoute from './PlayerMoveRoute';

const carSize = { width: 80, height: 40 };

function create3DCarIcon(color: string, isActive: boolean): L.DivIcon {
  const shadowOffset = isActive ? 8 : 4;
  const liftAmount = isActive ? -6 : -2;
  const scale = isActive ? 1.1 : 1;

  return new L.DivIcon({
    className: 'car-3d-icon',
    iconSize: [carSize.width, carSize.height + 20],
    iconAnchor: [carSize.width / 2, carSize.height + 10],
    html: `
      <div class="car-3d-container" style="
        position: relative;
        width: ${carSize.width}px;
        height: ${carSize.height + 20}px;
        transform: scale(${scale});
        transition: transform 0.2s ease;
      ">
        <!-- Shadow -->
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%) rotateX(60deg);
          width: ${carSize.width * 0.8}px;
          height: ${shadowOffset * 2}px;
          background: radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%);
          border-radius: 50%;
          filter: blur(2px);
        "></div>
        <!-- Car body -->
        <div style="
          position: absolute;
          bottom: ${10 + liftAmount}px;
          left: 0;
          width: ${carSize.width}px;
          height: ${carSize.height}px;
          transform: perspective(200px) rotateX(15deg);
          transform-origin: center bottom;
        ">
          <img
            src="/${color}-car.png"
            alt="${color} car"
            style="
              width: 100%;
              height: 100%;
              object-fit: contain;
              filter: drop-shadow(2px 4px 3px rgba(0,0,0,0.3));
            "
          />
        </div>
        ${isActive ? `
        <!-- Active glow -->
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: ${carSize.width}px;
          height: 6px;
          background: radial-gradient(ellipse, rgba(255,215,0,0.6) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) scale(1.2); }
        }
      </style>
    `,
  });
}

interface PlayerCarProps {
  player: Player;
}

export default function PlayerCar({ player }: PlayerCarProps) {
  const markerRef = useRef<L.Marker>(null);
  const currentPlayer = useCurrentPlayer();
  const {
    gameTurnState,
    diceResult,
    currentPlayerName,
    movePlayerTo,
  } = useGameStore();

  const active = player.name === currentPlayerName;
  const draggable = active && gameTurnState === GameTurnState.DICE_ROLLED;
  const hide = !active && gameTurnState === GameTurnState.DICE_ROLLED;

  const icon = useMemo(
    () => create3DCarIcon(player.iconType || 'white', active),
    [player.iconType, active]
  );

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        if (active && markerRef.current) {
          const latLng = markerRef.current.getLatLng();
          log.debug("Car dropped:", player.name, "at position:", [latLng.lat, latLng.lng]);
          movePlayerTo(player.name, [latLng.lat, latLng.lng]);
        }
      },
      mouseover() {
        markerRef.current?.openPopup();
      },
    }),
    [player, active, movePlayerTo]
  );

  useEffect(() => {
    if (active && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [active, gameTurnState]);

  function popupCaption() {
    if (draggable) {
      return `Okay ${player.name} - move ${pluraliseWithCount(diceResult || 0, 'square')}!`;
    } else if (active) {
      return `It's ${player.name}'s turn and it's time to ${asTitle(gameTurnState)}`;
    } else {
      return `It's ${currentPlayerName}'s turn - you must wait for them to finish first!`;
    }
  }

  if (hide) {
    return null;
  }

  return (
    <Marker
      position={player.position}
      icon={icon}
      draggable={draggable}
      riseOnHover={false}
      eventHandlers={eventHandlers}
      ref={markerRef}
    >
      <PlayerMoveRoute player={player} />
      <Popup className="custom-popup" offset={[0, -50]}>{popupCaption()}</Popup>
    </Marker>
  );
}
