"use client";

import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import { trpc } from "@/lib/trpc/client";
import { useGameStore, useCurrentPlayer, Player } from "@/stores/game-store";
import { useRouteStore, Profile } from "@/stores/route-store";
import { colours, log } from "@/lib/utils";
import type { LatLngTuple } from "leaflet";

interface PlayerMoveRouteProps {
  player: Player;
}

function toApiCoordinateFormat(position: [number, number] | null): [number, number] | null {
  if (!position) return null;
  return [position[1], position[0]];
}

export default function PlayerMoveRoute({ player }: PlayerMoveRouteProps) {
  const currentPlayer = useCurrentPlayer();
  const { playerRouteReceived } = useGameStore();
  const { profile } = useRouteStore();
  const [positions, setPositions] = useState<LatLngTuple[]>([]);

  const active = player.name === currentPlayer?.name;
  const hasPreviousPosition = !!player.previousPosition;

  const startPosition = active && hasPreviousPosition ? toApiCoordinateFormat(player.previousPosition) : null;
  const endPosition = active && hasPreviousPosition ? toApiCoordinateFormat(player.position) : null;

  const { data: directionsResponse } = trpc.directions.getDirections.useQuery(
    {
      profile: profile as Profile,
      start: startPosition!,
      end: endPosition!,
    },
    {
      enabled: !!(startPosition && endPosition),
    }
  );

  function toLeafletCoordinateFormat(coords: number[][]): LatLngTuple[] {
    return coords.map((tuple: number[]) => [tuple[1], tuple[0]] as LatLngTuple);
  }

  useEffect(() => {
    if (directionsResponse?.features?.[0]?.geometry?.coordinates) {
      const coords = directionsResponse.features[0].geometry.coordinates;
      const receivedPositions = toLeafletCoordinateFormat(coords);

      if (receivedPositions.length > 0) {
        log.debug("PlayerMoveRoute: received", receivedPositions.length, "positions for player:", player.name);
        setPositions(receivedPositions);
        playerRouteReceived();
      }
    }
  }, [directionsResponse, player.name, playerRouteReceived]);

  return (
    <Polyline
      color={colours.osMapsPurple}
      opacity={0.8}
      weight={10}
      positions={positions}
    />
  );
}
