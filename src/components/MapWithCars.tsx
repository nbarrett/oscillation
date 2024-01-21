import blueCar from "../images/blue-car.png";
import redCar from "../images/red-car.png";
import whiteCar from "../images/white-car.png";
import markerIconImage from "leaflet/dist/images/marker-icon.png";
import React, { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import L, { Icon, LatLngTuple } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import { log } from "../util/logging-config";
import { Player } from "../models/player-models";
import { SetterOrUpdater, useRecoilState, useRecoilValue } from "recoil";
import { accessTokenState, mapLayerState, mappingProviderState } from "../atoms/os-maps-atoms";
import {
    AccessTokenResponse,
    MapLayer,
    MapLayerAttributes,
    MapLayers,
    ProjectionValue
} from "../models/os-maps-models";
import { Legend } from "./Legend";
import "proj4leaflet";
import { RecordMapCentreAndZoom } from "./RecordMapCentreAndZoom";
import { RecordMapClick } from "./RecordMapClick";
import { PlayerCar } from "./PlayerCar";
import { useTileLayerUrls } from "../hooks/use-tile-layer-urls";
import { mapZoomState, playerZoomRequestState, selectablePlayerState } from "../atoms/game-atoms";
import { useGameState } from "../hooks/use-game-state";
import { useCustomCRSFor27700Projection } from "../hooks/use-epsg-27700-crs";
import { MappingProvider } from "../models/route-models";

export const startingPosition: LatLngTuple = [51.505, -0.09];

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
    const mappingProvider: MappingProvider = useRecoilValue<MappingProvider>(mappingProviderState);
    const mapLayerAttributes: MapLayerAttributes = MapLayers[mapLayer];
    const [map, setMap] = useState<L.Map>();
    const mapTileUrls = useTileLayerUrls();
    const useCustomTileLayer: boolean = mappingProvider !== MappingProvider.OPEN_STREET_MAPS && mapLayerAttributes?.layerParameters?.tileMatrixSet === ProjectionValue.ESPG_27700;
    const customCRS = useCustomCRSFor27700Projection();
    const crs = useCustomTileLayer ? customCRS.crs : L.CRS.EPSG3857;

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
        log.info("zoom:", zoom, "mapLayerAttributes:", mapLayerAttributes, "useCustomTileLayer:", useCustomTileLayer);
        if (useCustomTileLayer) {
            if (zoom < mapLayerAttributes?.minZoom) {
            const newZoom = mapLayerAttributes.minZoom + Math.floor(mapLayerAttributes.maxZoom - mapLayerAttributes.minZoom / 2);
                log.info("zoom:", zoom, "below minZoom:", mapLayerAttributes.minZoom);
                setZoom(mapLayerAttributes.minZoom);
            } else if (zoom > mapLayerAttributes?.maxZoom) {
                log.info("zoom:", zoom, "above mxnZoom:", mapLayerAttributes.maxZoom);
                setZoom(mapLayerAttributes.maxZoom);
        }
        } else {
            log.info("zoom:", zoom, "not validated and intercepted");
        }
    }, [useCustomTileLayer, mapLayerAttributes, zoom]);

    useEffect(() => {
        log.info("for mapLayerAttributes:", mapLayerAttributes, "tileUrl:", mapTileUrls?.url, "useCustomTileLayer:", useCustomTileLayer);
    }, [mapTileUrls?.url, useCustomTileLayer]);

    useEffect(() => {
        log.info("crs:", crs, "useCustomTileLayer:", useCustomTileLayer);
    }, [crs, useCustomTileLayer]);

    return mapLayerAttributes ?
        <div style={{height: '80vh', width: '100%'}}>
            <MapContainer crs={crs} whenReady={() => log.info("map ready")}
                          minZoom={useCustomTileLayer ? mapLayerAttributes?.minZoom : 0}
                          maxZoom={useCustomTileLayer ? mapLayerAttributes?.maxZoom : 18}
                          zoom={zoom} center={startingPosition} scrollWheelZoom={true}
                          ref={(map: L.Map) => setMap(map)} style={{height: '100%'}}>
                {accessTokenResponse?.access_token ?
                    <TileLayer url={mapTileUrls?.url}
                               attribution={'© <a href="https://www.ordnancesurvey.co.uk/">Ordnance Survey Crown copyright and database rights 2022 OS 100018976</a> <a href="https://www.ordnancesurvey.co.uk/">Ordnance Survey</a>'}
                    />
                    : <div>waiting for access token</div>}
                    {players.map((player: Player, key: number) => <PlayerCar key={key} player={player}/>)}
                    <Legend map={map as L.Map}/>
                    <RecordMapCentreAndZoom/>
                    <RecordMapClick/>
                </MapContainer>
        </div>
        : null;
}
