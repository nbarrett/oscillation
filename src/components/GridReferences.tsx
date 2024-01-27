import { useRecoilValue } from "recoil";
import React, { useEffect } from "react";
import { Grid } from "@mui/material";
import { mapClickPositionState } from "../atoms/game-atoms";
import { log } from "../util/logging-config";
import { GridReferenceData, GridSquareCorners, MapClickPosition } from "../models/os-maps-models";
import { asTitle } from "../util/strings";

export function GridReferences() {

    const mapClickPosition: MapClickPosition = useRecoilValue<MapClickPosition>(mapClickPositionState);
    const gridReferenceData: GridReferenceData = mapClickPosition?.gridReferenceData;
    const gridSquareCorners: GridSquareCorners = mapClickPosition?.gridSquareCorners;
    const cornerPairs = gridSquareCorners ? Object.entries(gridSquareCorners) : null;

    useEffect(() => {
        log.info("gridReferenceData:", gridReferenceData, "cornerPairs:", cornerPairs);
    }, [cornerPairs]);

    return (
        cornerPairs ? <><Grid item xs>
            <div>Grid Reference</div>
            <div>{gridReferenceData.gridReference}</div>
        </Grid>{
            cornerPairs.map((cornerPair: [string, string]) =>
                <Grid item xs key={cornerPair[0]}>
                    <div>{asTitle(cornerPair[0])}</div>
                    <div>{cornerPair[1]}</div>
                </Grid>)}</> : null);
}
