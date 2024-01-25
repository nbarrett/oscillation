import { useEffect } from "react";
import { log } from "../util/logging-config";
import { MapLayerAttributes } from "../models/os-maps-models";
import { MappingProvider } from "../models/route-models";
import { useApiKey } from "./use-api-key";
import { useMapLayers } from "./use-map-layers";

export function useTileLayerUrls() {

    const apiKey = useApiKey();
    const mapLayers = useMapLayers();
    const mappingProvider: MappingProvider = mapLayers.mappingProvider;
    const mapLayerAttributes: MapLayerAttributes = mapLayers.mapLayerAttributes;
    const key = apiKey.key;
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
        log.debug("mappingProvider:", mappingProvider, "urlOSMapsZXY:", urlOSMapsZXY, "urlOSMapsWMTS:", urlOSMapsWMTS, "urlOpenStreetMapsZXY:", urlOpenStreetMapsZXY, "tileUrl:", url);
    }, [urlOSMapsZXY, urlOSMapsWMTS, urlOpenStreetMapsZXY, url, mappingProvider]);


    useEffect(() => {
        log.debug("for mapLayerAttributes:", mapLayerAttributes, "key:", key, "tileUrl:", url);
    }, [url]);


    function osMapsZXYUrl() {
        return key ? `https://api.os.uk/maps/raster/v1/zxy/${mapLayerAttributes?.layerParameters?.layer}/{z}/{x}/{y}.png?key=${key}` : null;
    }

    function osMapsWMTSUrl() {
        const nameValuePars = mapLayerAttributes ? Object.entries(mapLayerAttributes?.layerParameters)
            .map((pair: [string, any]) => `${pair[0]}=${pair[1]}`).join("&") : "";
        return key ? `https://api.os.uk/maps/raster/v1/wmts?key=${key}&${nameValuePars}` : null;
    }

    function openStreetMapsUrl() {
        return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    }

    return {url};
}

