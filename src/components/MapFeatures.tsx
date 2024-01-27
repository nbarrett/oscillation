import "leaflet/dist/leaflet.css";
import "proj4leaflet";
import * as L from "leaflet";
import { LayerGroup } from "leaflet";
import { SetterOrUpdater, useRecoilState, useRecoilValue } from "recoil";
import { mapClickPositionState, mapZoomState } from "../atoms/game-atoms";
import { useApiKey } from "../hooks/use-api-key";
import { useMapLayers } from "../hooks/use-map-layers";
import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { log } from "../util/logging-config";
import { GeoJsonObject } from "../models/os-features-models";
import {
    featuresRequestIndexState,
    geoJsonFeaturesCapturedState,
    geoJsonFeaturesState,
    layerGroupState
} from "../atoms/os-features-atoms";
import { MapClickPosition } from "../models/os-maps-models";


export function MapFeatures() {

    const intCount = 100;
    const zoom: number = useRecoilValue<number>(mapZoomState);
    const [geoJson, setGeoJson]: [GeoJsonObject, SetterOrUpdater<GeoJsonObject>] = useRecoilState<GeoJsonObject>(geoJsonFeaturesState);
    const [captured, setCaptured]: [boolean, SetterOrUpdater<boolean>] = useRecoilState<boolean>(geoJsonFeaturesCapturedState);
    const [layerGroup, setLayerGroup]: [LayerGroup, SetterOrUpdater<LayerGroup>] = useRecoilState<LayerGroup>(layerGroupState);
    const [featuresRequestIndex, setFeaturesRequestIndex]: [number, SetterOrUpdater<number>] = useRecoilState<number>(featuresRequestIndexState);
    const apiKey = useApiKey();
    const mapLayers = useMapLayers();
    const map = useMap();
    const mapClickPosition: MapClickPosition = useRecoilValue<MapClickPosition>(mapClickPositionState);

    useEffect(() => {
        // setLayerGroup(L.layerGroup().addTo(map));
        // setFeaturesRequestIndex(0);
    }, []);

    function captureFeatures() {
        // Get the visible map bounds.
        const bounds = map.getBounds();

        // Convert the bounds to a formatted BBOX string.
        const sw = bounds.getSouthWest().lat + "," + bounds.getSouthWest().lng;
        const ne = bounds.getNorthEast().lat + "," + bounds.getNorthEast().lng;

        const coords = sw + " " + ne;

        // Create an OGC XML filter parameter value which will select the Greenspace
        // features intersecting the BBOX coordinates.
        let xml = "<ogc:Filter>";
        xml += "<ogc:BBOX>";
        xml += "<ogc:PropertyName>SHAPE</ogc:PropertyName>";
        xml += "<gml:Box srsName=\"EPSG:4326\">";
        xml += "<gml:coordinates>" + coords + "</gml:coordinates>";
        xml += "</gml:Box>";
        xml += "</ogc:BBOX>";
        xml += "</ogc:Filter>";

        // Define (WFS) parameters object.
        const wfsParams = {
            key: apiKey.key,
            service: "WFS",
            request: "GetFeature",
            version: "2.0.0",
            typeNames: "Zoomstack_RoadsLocal",
            outputFormat: "GEOJSON",
            filter: xml,
            count: intCount,
            startIndex: featuresRequestIndex
        };

        // Use fetch() method to request GeoJSON data from the OS Features API.
        //
        // If successful - remove everything from the layer group; then add a new GeoJSON
        // layer (with the appended features).
        //
        // Calls can be made until the number of features returned is less than the
        // requested count, at which point it can be assumed that all features for
        // the query have been returned, and there is no need to request further pages.
        fetch(queryFeatures(wfsParams))
            .then(response => response.json())
            .then(data => {
                log.debug("received data:", data);
                setGeoJson((existing => ({...existing, features: existing.features.concat(data.features)})));

                // geoJson.features.push.apply(geoJson.features, data.features);

                layerGroup.clearLayers();

                layerGroup.addLayer(
                    L.geoJson(geoJson as any, {
                        interactive: false,
                        style: {
                            color: "#7ba37b",
                            fillOpacity: 0.5
                        }
                    })
                );

                log.debug("request-count:", Math.ceil(geoJson.features.length / intCount));
                log.debug("feature-count:", geoJson.features.length);

                if (data.features.length < intCount) {
                    log.debug("request now disabled:");
                    setCaptured(true);
                }
                setFeaturesRequestIndex(existing => existing + intCount);
            });
    }

    function queryFeatures(params) {
        const encodedParameters = Object.keys(params)
            .map(paramName => paramName + "=" + encodeURI(params[paramName]))
            .join("&");

        const url = "https://api.os.uk/features/v1/wfs?" + encodedParameters;
        log.debug("url:", url);
        return url;
    }

    function reset() {

    }


    useEffect(() => {
        if (mapClickPosition) {
            // captureFeatures();
        } else {
            log.debug("map not yet initialised");
        }

    }, [mapClickPosition]);

    return null;
}
