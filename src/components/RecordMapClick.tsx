import { useMap } from "react-leaflet";
import { useEffect } from "react";
import { log } from "../util/logging-config";
import { formatLatLong } from "../mappings/route-mappings";
import { SetterOrUpdater, useSetRecoilState } from "recoil";
import { mapClickPositionState } from "../atoms/game-atoms";
import { GridReferenceData, GridSquareCorners, MapClickPosition } from "../models/os-maps-models";
import { calculateGridSquareCorners, gridReferenceDataFromLatLong } from "../mappings/os-maps-mappings";

export function RecordMapClick() {

    const map = useMap();
    const setMapClickPosition: SetterOrUpdater<MapClickPosition> = useSetRecoilState<MapClickPosition>(mapClickPositionState);

    useEffect(() => {
        if (map) {
            map.on('click', (e) => {
                log.debug(e, "you clicked map at position", formatLatLong(e.latlng));
                const gridReferenceData: GridReferenceData = gridReferenceDataFromLatLong(map, e.latlng);
                const gridSquareCorners: GridSquareCorners = calculateGridSquareCorners(gridReferenceData);
                setMapClickPosition({gridReferenceData, gridSquareCorners, latLng: e.latlng});
            });
        } else {
            log.debug("map not yet initialised");
        }

    }, [map]);


    return null;

}
