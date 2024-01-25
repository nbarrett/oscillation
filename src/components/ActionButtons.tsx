import React, { useEffect } from 'react';
import { Button, Grid, Stack } from "@mui/material";
import { colours } from '../models/game-models';
import { SetterOrUpdater, useRecoilState } from "recoil";
import { log } from "../util/logging-config";
import { GeoJsonObject } from "../models/os-features-models";
import {
    featuresRequestIndexState,
    geoJsonFeaturesCapturedState,
    geoJsonFeaturesState,
    layerGroupState
} from "../atoms/os-features-atoms";
import { LayerGroup } from "leaflet";

export function ActionButtons() {

    const [geoJson, setGeoJson]: [GeoJsonObject, SetterOrUpdater<GeoJsonObject>] = useRecoilState<GeoJsonObject>(geoJsonFeaturesState);
    const [captured, setCaptured]: [boolean, SetterOrUpdater<boolean>] = useRecoilState<boolean>(geoJsonFeaturesCapturedState);
    const [layerGroup, setLayerGroup]: [LayerGroup, SetterOrUpdater<LayerGroup>] = useRecoilState<LayerGroup>(layerGroupState);
    const [featuresRequestIndex, setFeaturesRequestIndex]: [number, SetterOrUpdater<number>] = useRecoilState<number>(featuresRequestIndexState);

    useEffect(() => {
        log.debug("geoJson:", geoJson, "captured:", captured, "layerGroup:", layerGroup);
    }, [geoJson, captured, layerGroup]);

    function beginCapture() {

    }

    function reset() {
        setFeaturesRequestIndex(0);
        layerGroup.clearLayers();
        setGeoJson(existing => ({...existing, features: []}));
    }

    return (
        <Grid pt={2} container alignItems={"center"} spacing={2} mb={2}>
            <Grid item xs={12} xl={6}>
                <Stack direction={"row"} alignItems={"center"} spacing={1}>
                    <Button fullWidth variant="contained"
                            color="primary"
                            onClick={beginCapture}
                            disabled={false}
                            sx={{
                                '&': {
                                    backgroundColor: colours.osMapsPurple,
                                },
                                '&:hover': {
                                    backgroundColor: colours.osMapsPink,
                                },
                            }}>Capture Features</Button>
                    <Button fullWidth variant="contained"
                            color="primary"
                            onClick={reset}
                            disabled={false}
                            sx={{
                                '&': {
                                    backgroundColor: colours.osMapsPurple,
                                },
                                '&:hover': {
                                    backgroundColor: colours.osMapsPink,
                                },
                            }}>Reset</Button>
                </Stack>
            </Grid>
            <Grid item xs={12} xl={6}>
                <Stack direction={"row"} alignItems={"center"} textAlign={"center"} spacing={1}>
                </Stack>
            </Grid>
        </Grid>);
}
