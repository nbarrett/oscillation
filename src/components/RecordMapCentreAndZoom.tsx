import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { log } from "../util/logging-config";
import { formatLatLong } from "../mappings/route-mappings";
import { useRecoilState, useSetRecoilState } from "recoil";
import { LatLngTuple } from "leaflet";
import { mapCentreState, mapZoomState } from "../atoms/game-atoms";

export function RecordMapCentreAndZoom() {

    const map = useMap();

    const setZoom = useSetRecoilState<number>(mapZoomState);
    const [mapCentre, setMapCentre] = useRecoilState<LatLngTuple>(mapCentreState);


    useEffect(() => {
        if (map) {
            map.on("dragend zoomend", () => {
                const zoom = map.getZoom();
                log.info(`map centre is ${formatLatLong(map.getCenter())} setting zoom to: ${zoom}`);
                setZoom(zoom);
                setMapCentre([map.getCenter().lat, map.getCenter().lng]);
            });
        } else {
            log.info("map not yet initialised");
        }
    }, [map]);
    return null;
}

