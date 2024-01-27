import { Player } from "../models/player-models";
import { useRecoilValue } from "recoil";
import { LatLngTuple } from "leaflet";
import { Stack } from "@mui/material";
import { formatLatLong, toLatLngFromLatLngTuple } from "../mappings/route-mappings";
import React from "react";
import { currentPlayerState, mapCentreState, mapClickPositionState, mapZoomState } from "../atoms/game-atoms";
import { MapClickPosition } from "../models/os-maps-models";

export function MapPositions() {
    const zoom: number = useRecoilValue<number>(mapZoomState);
    const mapClickPosition: MapClickPosition = useRecoilValue<MapClickPosition>(mapClickPositionState);
    const mapCentrePosition: LatLngTuple = useRecoilValue<LatLngTuple>(mapCentreState);

    return <Stack direction={"row"} textAlign={"center"} alignItems={"center"} spacing={1}>
        <div>Zoom Level: {zoom || "none"}</div>
        <div>Map click position:{formatLatLong(mapClickPosition?.latLng)}</div>
        <div>Map centre position:{formatLatLong(toLatLngFromLatLngTuple(mapCentrePosition))}</div>
    </Stack>;
}
