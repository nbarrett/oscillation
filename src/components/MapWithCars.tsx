import cloneDeep from "lodash-es/cloneDeep";
import blueCar from "../images/blue-car.png";
import redCar from "../images/red-car.png";
import whiteCar from "../images/white-car.png";
import markerIconImage from "leaflet/dist/images/marker-icon.png";
import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapContainer, TileLayer } from "react-leaflet";
import L, { Icon, LatLngTuple } from "leaflet";
import { log } from "../util/logging-config";
import { Player } from "../models/player-models";
import { SetterOrUpdater, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { accessTokenState, mapLayerState, mapState } from "../atoms/os-maps-atoms";
import { AccessTokenResponse, MapLayer, MapLayerAttributes, MapLayers } from "../models/os-maps-models";
import { Legend } from "./Legend";
import { RecordMapCentreAndZoom } from "./RecordMapCentreAndZoom";
import { RecordMapClick } from "./RecordMapClick";
import { PlayerCar } from "./PlayerCar";
import { useTileLayerUrls } from "../hooks/use-tile-layer-urls";
import { mapZoomState, playerZoomRequestState, selectablePlayerState } from "../atoms/game-atoms";
import { useGameState } from "../hooks/use-game-state";
import { formatLatLong } from "../mappings/route-mappings";

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

    const gameState = useGameState();
    const playerZoomRequest: string = useRecoilValue<string>(playerZoomRequestState);
    const mapLayer: MapLayer = useRecoilValue<MapLayer>(mapLayerState);
    const playerZoom: Player = useRecoilValue<Player>(selectablePlayerState(playerZoomRequest));
    const players: Player[] = gameState.gameData.players;
    const [zoom, setZoom]: [number, SetterOrUpdater<number>] = useRecoilState<number>(mapZoomState);
    const accessTokenResponse: AccessTokenResponse = useRecoilValue<AccessTokenResponse>(accessTokenState);
    const mapLayerAttributes: MapLayerAttributes = MapLayers[mapLayer];
    const setSharedMap = useSetRecoilState<L.Map>(mapState);
    const [map, setMap] = useState<L.Map>();
    const mapTileUrls = useTileLayerUrls();

    useEffect(() => {
        const players = generatePlayers([whiteCarIcon, blueCarIcon, redCarIcon]);
        log.info("initialising players to:", players);
        gameState.initialisePlayers(players);
    }, []);

    useEffect(() => {
        if (playerZoom) {
            log.info("zooming to players to:", playerZoom.name, "position:", playerZoom.position);
            map?.flyTo(playerZoom.position);
        }
    }, [playerZoom]);


    useEffect(() => {
        setSharedMap(cloneDeep(map));
    }, [map]);


    useEffect(() => {
        log.info("zoom:", zoom, "mapLayerAttributes:", mapLayerAttributes);
        if (zoom < mapLayerAttributes?.minZoom || zoom > mapLayerAttributes?.maxZoom) {
            const newZoom = mapLayerAttributes.minZoom + Math.floor(mapLayerAttributes.maxZoom - mapLayerAttributes.minZoom / 2);
            log.info("zoom:", zoom, "outside range of minZoom:", mapLayerAttributes.minZoom, "-> maxZoom:", mapLayerAttributes.maxZoom, "setting zoom to:", newZoom);
            setZoom(newZoom);
        }
    }, [mapLayerAttributes, zoom]);

    useEffect(() => {
        log.info("for mapLayerAttributes:", mapLayerAttributes, "tileUrl:", mapTileUrls?.url);
    }, [mapTileUrls?.url]);

    function zoomToPlayer(player: Player) {
        map?.flyTo(player.position);
    }

    return (
        <>
            <div style={{height: '80vh', width: '100%'}}>
                <MapContainer center={startingPosition} zoom={zoom} scrollWheelZoom={true}
                              ref={(map: L.Map) => setMap(map)} style={{height: '100%'}}>
                    {accessTokenResponse?.access_token ? <TileLayer url={mapTileUrls?.url}
                                                                    attribution={'© <a href="https://www.ordnancesurvey.co.uk/">Ordnance Survey Crown copyright and database rights 2022 OS 100018976</a> <a href="https://www.ordnancesurvey.co.uk/">Ordnance Survey</a>'}
                    /> : <div>waiting for access token</div>}
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

