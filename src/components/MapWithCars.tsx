import blueCar from "../images/blue-car.png";
import redCar from "../images/red-car.png";
import whiteCar from "../images/white-car.png";
import markerIconImage from "leaflet/dist/images/marker-icon.png";
import React, { Fragment, useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import L, { Icon, LatLng, LatLngTuple } from "leaflet";
import Link from "@mui/material/Link";
import { Box, Stack } from "@mui/material";
import { log } from "../util/logging-config";
import { Player } from "../models/player-models";
import { useRecoilState, useRecoilValue } from "recoil";
import {
    currentPlayerState,
    mapCentreState,
    mapClickPositionState,
    mapZoomState,
    playersState
} from "../atoms/route-atoms";
import { formatLatLong, toLatLngFromLatLngTuple } from "../mappings/route-mappings";
import { accessTokenState, mappingProviderState, mapLayerState } from "../atoms/os-maps-atoms";
import { AccessTokenResponse, MapLayers, MapLayer } from "../models/os-maps-models";
import { Legend } from "./Legend";
import { RecordMapCentreAndZoom } from "./RecordMapCentreAndZoom";
import { RecordMapClick } from "./RecordMapClick";
import { MapLayerAttributes, MappingProvider } from "../models/route-models";
import { PlayerCar } from "./PlayerCar";
import { info } from "loglevel";

const startingPosition: LatLngTuple = [51.505, -0.09];

const whiteCarIcon: Icon<{ iconSize: [number, number]; iconUrl: any }> = new Icon({
    iconUrl: whiteCar,
    iconSize: [172, 62]
});
const blueCarIcon = new Icon({
    iconUrl: blueCar,
    iconSize: [172, 62]
});
const redCarIcon = new Icon({
    iconUrl: redCar,
    iconSize: [172, 62]
});

const markerIcon = new Icon({
    iconUrl: markerIconImage,
    iconSize: [72, 52]
});


function startingPositionFor(index: number): LatLngTuple {
    return [startingPosition[0] + 0.00014023745552549371 * index, startingPosition[1] + -0.0002467632293701172 * index];
}

function generatePlayers(icons: Icon[]): Player[] {
    return icons.map((icon, index) => ({name: `Player ${index + 1}`, icon, position: startingPositionFor(index)}));
}

export function MapWithCars() {

    const mapLayer: MapLayer = useRecoilValue<MapLayer>(mapLayerState);
    const mappingProvider: MappingProvider = useRecoilValue<MappingProvider>(mappingProviderState);
    const [players, setPlayers] = useRecoilState<Player[]>(playersState);
    const player: Player = useRecoilValue<Player>(currentPlayerState);
    const zoom: number = useRecoilValue<number>(mapZoomState);
    const mapClickPosition: LatLngTuple = useRecoilValue<LatLngTuple>(mapClickPositionState);
    const accessTokenResponse: AccessTokenResponse = useRecoilValue<AccessTokenResponse>(accessTokenState);
    const mapCentrePosition: LatLngTuple = useRecoilValue<LatLngTuple>(mapCentreState);
    const mapLayerAttributes: MapLayerAttributes = MapLayers[mapLayer];
    const [map, setMap] = useState<L.Map>();
    const key = encodeURIComponent(accessTokenResponse?.access_token);
    const urlOSMapsZXY = `https://api.os.uk/maps/raster/v1/zxy/${mapLayerAttributes?.urlPath}/{z}/{x}/{y}.png?key=${key}`;
    const urlOSMapsWMTS = `https://api.os.uk/maps/raster/v1/wmts?key=${key}&tileMatrixSet=EPSG:27700&version=1.0.0&style=default&layer=${mapLayerAttributes?.urlPath}&service=WMTS&request=GetTile&tileCol={x}&tileRow={y}&tileMatrix={z}`;
    const urlOpenStreetMapsZXY = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileUrl = deriveTileUrl();

    function deriveTileUrl() {
        switch (mappingProvider) {
            case MappingProvider.OPEN_STREET_MAPS:
                return urlOpenStreetMapsZXY;
            case MappingProvider.OS_MAPS_ZXY:
                return urlOSMapsZXY;
            case MappingProvider.OS_MAPS_WMTS:
                return urlOSMapsWMTS;
        }
    }


    info("attempting to use urlOSMapsWMTS:", urlOSMapsWMTS);

    useEffect(() => {
        const players = generatePlayers([whiteCarIcon, blueCarIcon, redCarIcon]);
        log.info("initialising players to:", players);
        setPlayers(players);
    }, []);

    useEffect(() => {
        log.info("mappingProvider:", mappingProvider, "urlOSMapsZXY:", urlOSMapsZXY, "urlOSMapsWMTS:", urlOSMapsWMTS, "urlOpenStreetMapsZXY:", urlOpenStreetMapsZXY, "tileUrl:", tileUrl);
    }, [urlOSMapsZXY, urlOSMapsWMTS, urlOpenStreetMapsZXY, tileUrl, mappingProvider]);

    useEffect(() => {
        log.info("accessTokenResponse:", accessTokenResponse, "tileUrl:", tileUrl);
    }, [accessTokenResponse, tileUrl]);

    useEffect(() => {
        log.info("mapLayerAttributes:", mapLayerAttributes);
    }, [mapLayerAttributes]);

    useEffect(() => {
        if (players.length > 0) {
            log.debug("MapWithCars:players:", players, "lat 1->2:", players[1].position[0] - players[0].position[0], "lng 1->2:", players[1].position[1] - players[0].position[1]);
        }
    }, [players]);

    function zoomToPlayer(player: Player) {
        map?.flyTo(player.position);
    }


    return (
        <>
            <Stack direction={"row"} spacing={1}>
                <div>Zoom Level: {zoom || "none"}</div>
                <div>Map click position:{formatLatLong(toLatLngFromLatLngTuple(mapClickPosition))}</div>
                <div>Map centre position:{formatLatLong(toLatLngFromLatLngTuple(mapCentrePosition))}</div>
            </Stack>
            <Stack direction={"row"} spacing={1}>
                <div>Current Player: {player?.name || "none"}</div>
                <div>Player positions:</div>
                {players.map(player => <Fragment key={player.name}>
                    <Link onClick={() => zoomToPlayer(player)} sx={{cursor: "pointer"}}
                          key={player.name}>{player.name}</Link>
                    <Box>lat-long: {formatLatLong(new LatLng(player.position[0], player.position[1]))}</Box>
                </Fragment>)}
            </Stack>
            <div style={{height: '80vh', width: '100%'}}>
                <MapContainer center={startingPosition} zoom={zoom} scrollWheelZoom={true}
                              ref={(map: L.Map) => setMap(map)} style={{height: '100%'}}>
                    <TileLayer url={tileUrl}
                               attribution={'© <a href="https://www.ordnancesurvey.co.uk/">Ordnance Survey Crown copyright and database rights 2022 OS 100018976</a> <a href="https://www.ordnancesurvey.co.uk/">Ordnance Survey</a>'}
                    />
                    {players.map((player: Player, key: number) => <PlayerCar key={key} player={player}/>)}
                    <Legend map={map as L.Map}/>
                    <RecordMapCentreAndZoom/>
                    <RecordMapClick/>
                </MapContainer>
            </div>
        </>);
    {
    }
}

