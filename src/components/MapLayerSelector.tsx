import * as React from 'react';
import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { enumValues } from "../util/enums";
import { MappingProvider } from "../models/route-models";
import { Stack, TextField } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { log } from "../util/logging-config";
import { mapLayerState, mappingProviderState } from "../atoms/os-maps-atoms";
import TickCrossIcon from "./Tick";
import { MapLayer, MapLayerAttributes, MapLayers } from "../models/os-maps-models";

export default function MapLayerSelector() {

    const [mapLayer, setMapLayer] = useRecoilState<MapLayer>(mapLayerState);
    const mappingProvider: MappingProvider = useRecoilValue<MappingProvider>(mappingProviderState);

    useEffect(() => {
        if (!mapLayer) {
            log.info("ProfileSelector:mapLayer:initialised to:", mapLayer);
            setMapLayer(MapLayer.LIGHT_3857);
        }
    }, []);

    useEffect(() => {
        log.info("ProfileSelector:mapLayer:", mapLayer);
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
                    return <MenuItem key={attribute.name} value={attribute.name}>
                        <Stack direction={"row"} alignItems={"center"} spacing={1}>
                            <div>{attribute.displayName}</div>
                            <TickCrossIcon isTick={attribute.renders}/>
                        </Stack>
                    </MenuItem>;
                })}
            </TextField>
    );
}
