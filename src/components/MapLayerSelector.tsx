import * as React from 'react';
import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { enumValues } from "../util/enums";
import { MapLayerAttributes, MappingProvider } from "../models/route-models";
import { TextField, Tooltip } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { log } from "../util/logging-config";
import { mappingProviderState, mapLayerState } from "../atoms/os-maps-atoms";
import TickCrossIcon from "./Tick";
import { MapLayers, MapLayer } from "../models/os-maps-models";

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
        <Tooltip arrow placement={"bottom-end"} title={<div>Th tick/cross is there to indicate which map layers work and which don't</div>}>
            <TextField disabled={mappingProvider === MappingProvider.OPEN_STREET_MAPS}
                                                     sx={{minWidth: 220}} select size={"small"}
                                                     label={"Map Layer"}
                                                     value={mapLayer || ""}
                                                     onChange={handleChange}>
            {enumValues(MapLayer).map((value, index) => {
                const attribute: MapLayerAttributes = MapLayers[value];
                return <MenuItem key={attribute.name} value={attribute.name}>{attribute.displayName}
                    <TickCrossIcon isTick={attribute.renders}/>
                </MenuItem>;
            })}
        </TextField></Tooltip>
    );
}
