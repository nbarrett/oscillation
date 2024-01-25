import { useEffect } from "react";
import { useRecoilState } from "recoil";
import { namedLocationsState, startingPositionState } from "../atoms/route-atoms";
import { log } from "../util/logging-config";
import { NamedLocation } from "../shared/NamedLocation";
import { referenceStartingPoints } from "../models/game-models";
import { remult } from "remult";

export default function useNamedLocations() {

    const [namedLocation, setNamedLocation] = useRecoilState<NamedLocation>(startingPositionState);
    const [namedLocations, set_] = useRecoilState<NamedLocation[]>(namedLocationsState);
    const startingPointsRepo = remult.repo(NamedLocation);

    useEffect(() => {
        log.debug("useNamedLocations:namedLocation:", namedLocation, "namedLocations:", namedLocations);
        if (!namedLocation && namedLocations?.length > 0) {
            const firstNamedLocation = namedLocations[0];
            log.debug("useNamedLocations:namedLocation:initialised to:", firstNamedLocation);
            setNamedLocation(firstNamedLocation);
        } else if (namedLocations?.length == 0) {
            log.debug("useNamedLocations:namedLocation:migration required");
        }
    }, [namedLocations, namedLocation]);

    useEffect(() => {

    }, [namedLocation]);


    async function prePopulateDataStore() {
        for (const point of referenceStartingPoints) {
            log.debug("prePopulateDataStore:point:", point);
            const existingPoint = await startingPointsRepo.findFirst({name: point.name});
            if (!existingPoint) {
                const newData = {name: point.name, location: point.location};
                log.debug("prePopulateDataStore:point:inserting:", newData);
                await startingPointsRepo.save(newData);
            } else {
                log.debug("prePopulateDataStore:found:", existingPoint, "for:", point);
            }
        }
    }

    return {prePopulateDataStore, namedLocations, namedLocation, setNamedLocation};
}
