import "leaflet/dist/leaflet.css";
import "proj4leaflet";
import * as L from "leaflet";
import proj4 from "proj4";
import Proj4 from "proj4";
import { log } from "../util/logging-config";
import { useRecoilValue } from "recoil";
import { mapZoomState } from "../atoms/game-atoms";
import { MapOptions } from "../models/os-maps-models";
import { useGameState } from "./use-game-state";
import { useEffect, useState } from "react";

export function useCustomCRSFor27700Projection() {
    const gameState = useGameState();
    const zoom: number = useRecoilValue<number>(mapZoomState);
    const [epsg27700, set27700] = useState<proj4.Converter>();

    const crs = new L.Proj.CRS("EPSG:27700", "+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs", {
        resolutions: [896.0, 448.0, 224.0, 112.0, 56.0, 28.0, 14.0, 7.0, 3.5, 1.75],
        origin: [-238375.0, 1376256.0]
    });

    useEffect(() => {
        const epsg27700: proj4.Converter = Proj4('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs');
        set27700(epsg27700);
    }, []);

    function transformCoords(input) {
        const output = proj4("EPSG:27700", "EPSG:4326", input).reverse();
        log.debug("transformCoords:", input, "->", output);
        return output;
    }

    const options: MapOptions = {
        crs,
        minZoom: 0,
        maxZoom: 8,
        center: gameState?.startingPosition?.location,
        zoom: zoom,
        maxBounds: [
            transformCoords([-238375.0, 0.0]),
            transformCoords([900000.0, 1376256.0])
        ],
        attributionControl: false
    };


    return {crs, options, epsg27700};
}
