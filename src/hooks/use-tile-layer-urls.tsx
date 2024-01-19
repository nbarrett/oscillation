import React, { useEffect } from "react";
import { log } from "../util/logging-config";
import { useRecoilValue } from "recoil";
import { accessTokenState, mapLayerState, mappingProviderState } from "../atoms/os-maps-atoms";
import { AccessTokenResponse, MapLayer, MapLayerAttributes, MapLayers } from "../models/os-maps-models";
import { MappingProvider } from "../models/route-models";

export function useTileLayerUrls() {

    const mapLayer: MapLayer = useRecoilValue<MapLayer>(mapLayerState);
    const mappingProvider: MappingProvider = useRecoilValue<MappingProvider>(mappingProviderState);
    const accessTokenResponse: AccessTokenResponse = useRecoilValue<AccessTokenResponse>(accessTokenState);
    const mapLayerAttributes: MapLayerAttributes = MapLayers[mapLayer];
    const key = encodeURI(accessTokenResponse?.access_token);
    const tileMatrixSet = mapLayerAttributes?.tileMatrixSet;
    const layer = encodeURI(mapLayerAttributes?.layerName);
    const urlOSMapsZXY = osMapsZXYUrl();
    const urlOSMapsWMTS = osMapsWMTSUrl();
    const urlOpenStreetMapsZXY = openStreetMapsUrl();
    const url = deriveUrlBasedOn(mappingProvider);

    function deriveUrlBasedOn(mappingProvider: MappingProvider) {
        switch (mappingProvider) {
            case MappingProvider.OPEN_STREET_MAPS:
                return urlOpenStreetMapsZXY;
            case MappingProvider.OS_MAPS_ZXY:
                return urlOSMapsZXY;
            case MappingProvider.OS_MAPS_WMTS:
                return urlOSMapsWMTS;
        }
    }


    useEffect(() => {
        log.info("mappingProvider:", mappingProvider, "urlOSMapsZXY:", urlOSMapsZXY, "urlOSMapsWMTS:", urlOSMapsWMTS, "urlOpenStreetMapsZXY:", urlOpenStreetMapsZXY, "tileUrl:", url);
    }, [urlOSMapsZXY, urlOSMapsWMTS, urlOpenStreetMapsZXY, url, mappingProvider]);

    useEffect(() => {
        log.info("accessTokenResponse:", accessTokenResponse);
    }, [accessTokenResponse]);

    useEffect(() => {
        log.info("for mapLayerAttributes:", mapLayerAttributes, "tileUrl:", url, "tileMatrixSet:", tileMatrixSet, "layer:", layer);
    }, [url]);


    function osMapsZXYUrl() {
        return `https://api.os.uk/maps/raster/v1/zxy/${mapLayerAttributes?.layerName}/{z}/{x}/{y}.png?key=${key}`;
    }

    function osMapsWMTSUrl() {
        return `https://api.os.uk/maps/raster/v1/wmts?key=${key}&service=WMTS&request=GetTile&version=1.0.0&style=default&layer=${mapLayerAttributes?.layerName}&tileMatrixSet=${tileMatrixSet}&tileMatrix={z}&tileRow={y}&tileCol={x}`;
    }

    function openStreetMapsUrl() {
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }

    return {url, tileMatrixSet, layer};
}

