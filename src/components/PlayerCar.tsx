'use client';

import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { Marker, Popup } from 'react-leaflet';
import { useGameStore, useCurrentPlayer, GameTurnState, Player } from '@/stores/game-store';
import { log, asTitle, pluraliseWithCount } from '@/lib/utils';
import PlayerMoveRoute from './PlayerMoveRoute';

const carIcons = {
  white: new L.Icon({ iconUrl: '/white-car.png', iconSize: [172, 62] }),
  blue: new L.Icon({ iconUrl: '/blue-car.png', iconSize: [172, 62] }),
  red: new L.Icon({ iconUrl: '/red-car.png', iconSize: [172, 62] }),
};

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
    updatePlayerPosition,
    updatePlayerNextPosition,
  } = useGameStore();

  const active = player.name === currentPlayerName;
  const draggable = active && gameTurnState === GameTurnState.DICE_ROLLED;
  const hide = !active && gameTurnState === GameTurnState.DICE_ROLLED;

  const icon = carIcons[player.iconType] || carIcons.white;

  const eventHandlers = useMemo(
    () => ({
      dragstart() {
        if (active && markerRef.current) {
          const latLng = markerRef.current.getLatLng();
          log.debug('drag start for:', player.name, 'position:', [latLng.lat, latLng.lng]);
          updatePlayerPosition(player.name, [latLng.lat, latLng.lng]);
        }
      },
      dragend() {
        if (active && markerRef.current) {
          const latLng = markerRef.current.getLatLng();
          log.debug('drag end for:', player.name, 'position:', [latLng.lat, latLng.lng]);
          updatePlayerNextPosition(player.name, [latLng.lat, latLng.lng]);
        }
      },
      mouseover() {
        markerRef.current?.openPopup();
      },
    }),
    [player, active, updatePlayerPosition, updatePlayerNextPosition]
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
      <Popup className="custom-popup">{popupCaption()}</Popup>
    </Marker>
  );
}
