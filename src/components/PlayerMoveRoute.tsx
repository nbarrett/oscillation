"use client";

import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import { useGameStore, Player } from "@/stores/game-store";
import { roadPathThroughGrids, latLngToGridKey } from "@/lib/road-data";
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
      const startPos: [number, number] = player.completedRoute[0];
      const gridKeys = player.completedRoute.slice(1).map(
        ([lat, lng]) => latLngToGridKey(lat, lng)
      );
      const roadPoints = roadPathThroughGrids(startPos, gridKeys);
      const fullPath: LatLngTuple[] = roadPoints.map(
        ([lat, lng]) => [lat, lng] as LatLngTuple
      );

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
