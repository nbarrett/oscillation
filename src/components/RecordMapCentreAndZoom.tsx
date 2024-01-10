import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { log } from "../util/logging-config";
import { formatLatLong } from "../mappings/route-mappings";
import { RecoilState, useRecoilState } from "recoil";
import { Profile } from "../models/route-models";
import { mapCentreState, mapZoomState, profileState } from "../atoms/route-atoms";
import { LatLngTuple } from "leaflet";

export function RecordMapCentreAndZoom() {

    const map = useMap();

    const [zoom, setZoom] = useRecoilState<number>(mapZoomState);
    const [mapCentre, setMapCentre] = useRecoilState<LatLngTuple>(mapCentreState);


    useEffect(() => {
        if (map) {
            map.on("dragend zoomend", () => {
                const zoom = map.getZoom();
                log.info(`map centre is ${formatLatLong(map.getCenter())} zoom: ${zoom}`);
                setZoom(zoom);
                setMapCentre([map.getCenter().lat, map.getCenter().lng]);
            });
        } else {
            log.info("map not yet initialised");
        }
    }, [map]);
    return null;
}

