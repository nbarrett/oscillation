"use client";

import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import { useGameStore, Player } from "@/stores/game-store";
import { roadPathBetween } from "@/lib/road-data";
import { colours, log } from "@/lib/utils";
import type { LatLngTuple } from "leaflet";

interface PlayerMoveRouteProps {
  player: Player;
}

export default function PlayerMoveRoute({ player }: PlayerMoveRouteProps) {
  const { playerRouteReceived } = useGameStore();
  const [positions, setPositions] = useState<LatLngTuple[]>([]);

  useEffect(() => {
    if (player.completedRoute && player.completedRoute.length >= 2) {
      const fullPath: LatLngTuple[] = [];

      for (let i = 0; i < player.completedRoute.length - 1; i++) {
        const [startLat, startLng] = player.completedRoute[i];
        const [endLat, endLng] = player.completedRoute[i + 1];
        const segment = roadPathBetween(startLat, startLng, endLat, endLng);

        for (let j = i === 0 ? 0 : 1; j < segment.length; j++) {
          fullPath.push([segment[j][0], segment[j][1]] as LatLngTuple);
        }
      }

      log.debug("PlayerMoveRoute: showing", fullPath.length, "road points for player:", player.name);
      setPositions(fullPath);
      playerRouteReceived();
    }
  }, [player.completedRoute, player.name, playerRouteReceived]);

  return (
    <Polyline
      color={colours.osMapsPurple}
      opacity={0.8}
      weight={10}
      positions={positions}
    />
  );
}
