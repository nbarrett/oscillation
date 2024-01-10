import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { log } from "../util/logging-config";
import { formatLatLong } from "../mappings/route-mappings";
import { useRecoilState, useSetRecoilState } from "recoil";
import { mapCentreState, mapClickPositionState, mapZoomState } from "../atoms/route-atoms";
import { LatLngTuple } from "leaflet";

export function RecordMapClick() {
    const map = useMap();

    const setMapClickPosition = useSetRecoilState<LatLngTuple>(mapClickPositionState);

    useEffect(() => {
        if (map) {
            map.on('click', (e) => {
                log.info("you clicked map at position", formatLatLong(e.latlng));
                setMapClickPosition([e.latlng.lat, e.latlng.lng])
            });
        } else {
            log.info("map not yet initialised");
        }

    }, [map]);


    return null;

}
