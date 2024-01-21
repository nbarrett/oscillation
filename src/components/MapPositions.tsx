import { Player } from "../models/player-models";
import { useRecoilValue } from "recoil";
import { LatLngTuple } from "leaflet";
import { Stack } from "@mui/material";
import { formatLatLong, toLatLngFromLatLngTuple } from "../mappings/route-mappings";
import React from "react";
import { currentPlayerState, mapCentreState, mapClickPositionState, mapZoomState } from "../atoms/game-atoms";

export function MapPositions() {
    const player: Player = useRecoilValue<Player>(currentPlayerState);
    const zoom: number = useRecoilValue<number>(mapZoomState);
    const mapClickPosition: LatLngTuple = useRecoilValue<LatLngTuple>(mapClickPositionState);
    const mapCentrePosition: LatLngTuple = useRecoilValue<LatLngTuple>(mapCentreState);

    return <Stack direction={"row"} textAlign={"center"} alignItems={"center"} spacing={1}>
        <div>Current Player: {player?.name || "none"}</div>
        <div>Zoom Level: {zoom || "none"}</div>
        <div>Map click position:{formatLatLong(toLatLngFromLatLngTuple(mapClickPosition))}</div>
        <div>Map centre position:{formatLatLong(toLatLngFromLatLngTuple(mapCentrePosition))}</div>
    </Stack>;
}
