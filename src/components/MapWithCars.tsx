"use client";

import { useEffect, useState, useCallback } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import { useGameStore } from "@/stores/game-store";
import { useMapStore, MapLayers, MappingProvider, ProjectionValue } from "@/stores/map-store";
import { useRouteStore } from "@/stores/route-store";
import { log } from "@/lib/utils";
import "proj4leaflet";
import PlayerCar from "./PlayerCar";
import RecordMapCentreAndZoom from "./RecordMapCentreAndZoom";
import RecordMapClick from "./RecordMapClick";
import SelectGridSquares from "./SelectGridSquares";
import ValidMoveHighlights from "./ValidMoveHighlights";
import MapContextMenu from "./MapContextMenu";
import ClickPositionMarker from "./ClickPositionMarker";
import GridOverlay from "./GridOverlay";
import PubMarkers from "./PubMarkers";
import SpireMarkers from "./ChurchMarkers";
import TowerMarkers from "./TowerMarkers";
import PhoneMarkers from "./PhoneMarkers";
import SchoolMarkers from "./SchoolMarkers";
import MapSearch from "./MapSearch";

function createBritishNationalGridCRS(): L.Proj.CRS | null {
  if (typeof window === "undefined") return null;
  return new L.Proj.CRS(
    "EPSG:27700",
    "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs",
    {
      resolutions: [896.0, 448.0, 224.0, 112.0, 56.0, 28.0, 14.0, 7.0, 3.5, 1.75],
      origin: [-238375.0, 1376256.0],
    }
  );
}

export default function MapWithCars() {
  const { players, mapZoom, mapCentre, setMapZoom, playerZoomRequest, setPlayerZoomRequest } = useGameStore();
  const { accessToken, mapLayer, mappingProvider } = useMapStore();
  const { startingPosition } = useRouteStore();

  const [map, setMap] = useState<L.Map | null>(null);
  const [britishNationalGridCRS, setBritishNationalGridCRS] = useState<L.Proj.CRS | null>(null);

  const mapLayerAttributes = MapLayers[mapLayer];

  const usesBritishNationalGrid =
    mappingProvider !== MappingProvider.OPEN_STREET_MAPS &&
    mapLayerAttributes?.layerParameters?.tileMatrixSet === ProjectionValue.ESPG_27700;

  const crs = usesBritishNationalGrid && britishNationalGridCRS ? britishNationalGridCRS : L.CRS.EPSG3857;
  const canRender = mapLayerAttributes && startingPosition && (!usesBritishNationalGrid || britishNationalGridCRS);
  const playerToZoom = players.find((p) => p.name === playerZoomRequest);
  const mapKey = `map-${usesBritishNationalGrid ? "27700" : "3857"}`;

  useEffect(() => {
    const crs = createBritishNationalGridCRS();
    if (crs) {
      setBritishNationalGridCRS(crs);
    }
  }, []);

  
  useEffect(() => {
    if (map) {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [map]);

  useEffect(() => {
    if (playerToZoom && map) {
      log.debug("zooming to player:", playerToZoom.name, "position:", playerToZoom.position);
      map.flyTo(playerToZoom.position, 9);
      setPlayerZoomRequest(null);
    }
  }, [playerToZoom, map, setPlayerZoomRequest]);


  useEffect(() => {
    log.debug("zoom:", mapZoom, "mapLayerAttributes:", mapLayerAttributes, "usesBritishNationalGrid:", usesBritishNationalGrid);
    if (usesBritishNationalGrid) {
      if (mapZoom < mapLayerAttributes?.minZoom) {
        log.debug("zoom:", mapZoom, "below minZoom:", mapLayerAttributes.minZoom);
        setMapZoom(mapLayerAttributes.minZoom);
      } else if (mapZoom > mapLayerAttributes?.maxZoom) {
        log.debug("zoom:", mapZoom, "above maxZoom:", mapLayerAttributes.maxZoom);
        setMapZoom(mapLayerAttributes.maxZoom);
      }
    }
  }, [usesBritishNationalGrid, mapLayerAttributes, mapZoom, setMapZoom]);

  const buildTileUrl = useCallback(() => {
    const key = accessToken?.access_token;
    if (!key) return null;

    switch (mappingProvider) {
      case MappingProvider.OPEN_STREET_MAPS:
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      case MappingProvider.OS_MAPS_ZXY:
        return `https://api.os.uk/maps/raster/v1/zxy/${mapLayerAttributes?.layerParameters?.layer}/{z}/{x}/{y}.png?key=${key}`;
      case MappingProvider.OS_MAPS_WMTS:
        const params = mapLayerAttributes
          ? Object.entries(mapLayerAttributes.layerParameters)
              .map(([k, v]) => `${k}=${v}`)
              .join("&")
          : "";
        return `https://api.os.uk/maps/raster/v1/wmts?key=${key}&${params}`;
      default:
        return null;
    }
  }, [accessToken, mappingProvider, mapLayerAttributes]);

  const tileUrl = buildTileUrl();

  if (!canRender) {
    return null;
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        key={mapKey}
        crs={crs}
        whenReady={() => log.debug("map ready")}
        minZoom={usesBritishNationalGrid ? mapLayerAttributes?.minZoom : 0}
        maxZoom={usesBritishNationalGrid ? mapLayerAttributes?.maxZoom : 18}
        zoom={mapZoom}
        center={mapCentre || [startingPosition.lat, startingPosition.lng]}
        scrollWheelZoom={true}
        ref={(mapRef) => setMap(mapRef)}
        style={{ height: "100%" }}
      >
        {tileUrl ? (
          <TileLayer
            url={tileUrl}
            attribution='© <a href="https://www.ordnancesurvey.co.uk/">Ordnance Survey Crown copyright and database rights 2024 OS 100018976</a>'
          />
        ) : (
          <div>waiting for access token</div>
        )}
        {players.map((player, key) => (
          <PlayerCar key={key} player={player} />
        ))}
        <RecordMapCentreAndZoom />
        <RecordMapClick />
        <SelectGridSquares />
        <ValidMoveHighlights />
        <MapContextMenu />
        <ClickPositionMarker />
        <GridOverlay />
        <PubMarkers />
        <SpireMarkers />
        <TowerMarkers />
        <PhoneMarkers />
        <SchoolMarkers />
        <MapSearch />
      </MapContainer>
    </div>
  );
}
