import React, { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import "proj4leaflet";
import * as L from "leaflet";
import { log } from "../util/logging-config";
import { useTileLayerUrls } from "../hooks/use-tile-layer-urls";
import { useCustomCRSFor27700Projection } from "../hooks/use-epsg-27700-crs";

export function TileLayerForLeisure27700() {

    const mapTileUrls = useTileLayerUrls();
    const customCRS = useCustomCRSFor27700Projection();
    const tileUrl = mapTileUrls.url;

    useEffect(() => {
        let tileLayer: L.TileLayer;
        let map;
        log.info("creating map with options:", customCRS.options, "tileUrl:", tileUrl);
        map = L.map("map", customCRS.options);
        L.tileLayer(tileUrl).addTo(map);
        return () => {
            map.remove();
        };
    }, []);

    return <div id="map" style={{zIndex: 0, height: "100%"}}></div>;
}
