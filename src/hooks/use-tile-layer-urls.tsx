import { useEffect } from "react";
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
        log.debug("accessTokenResponse:", accessTokenResponse);
    }, [accessTokenResponse]);

    useEffect(() => {
        log.info("for mapLayerAttributes:", mapLayerAttributes, "key:", key, "tileUrl:", url);
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

