import * as React from 'react';
import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { enumValues } from "../util/enums";
import { MappingProvider } from "../models/route-models";
import { TextField } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { log } from "../util/logging-config";
import { mapLayerState, mappingProviderState } from "../atoms/os-maps-atoms";
import { MapLayer, MapLayerAttributes, MapLayers } from "../models/os-maps-models";

export default function MapLayerSelector() {

    const [mapLayer, setMapLayer] = useRecoilState<MapLayer>(mapLayerState);
    const mappingProvider: MappingProvider = useRecoilValue<MappingProvider>(mappingProviderState);

    useEffect(() => {
        if (!mapLayer) {
            log.debug("ProfileSelector:mapLayer:initialised to:", mapLayer);
            setMapLayer(MapLayer.LEISURE_27700);
        }
    }, []);

    useEffect(() => {
        log.debug("ProfileSelector:mapLayer:", mapLayer);
    }, [mapLayer]);

    function handleChange(event) {
        setMapLayer(event.target.value);
    }

    return (
            <TextField fullWidth disabled={mappingProvider === MappingProvider.OPEN_STREET_MAPS}
                       sx={{minWidth: 220}} select size={"small"}
                       label={"Map Layer"}
                       value={mapLayer || ""}
                       onChange={handleChange}>
                {enumValues(MapLayer).map((value, index) => {
                    const attribute: MapLayerAttributes = MapLayers[value];
                    return <MenuItem key={attribute.name} value={attribute.name}>{attribute.displayName}</MenuItem>;
                })}
            </TextField>
    );
}
