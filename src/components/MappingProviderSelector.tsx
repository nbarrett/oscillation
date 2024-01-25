import * as React from 'react';
import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { enumValues } from "../util/enums";
import { MappingProvider } from "../models/route-models";
import { TextField } from "@mui/material";
import { useRecoilState } from "recoil";
import { log } from "../util/logging-config";
import { mappingProviderState } from "../atoms/os-maps-atoms";
import { asTitle } from "../util/strings";

export default function MappingProviderSelector() {

    const [mappingProvider, setMappingProvider] = useRecoilState<MappingProvider>(mappingProviderState);

    useEffect(() => {
        log.debug("MappingProviderSelector:mappingProvider:", mappingProvider);
    }, [mappingProvider]);

    function handleChange(event) {
        setMappingProvider(event.target.value);
    }

    return (
        <TextField fullWidth sx={{minWidth: 220}} select size={"small"}
                   label={"Mapping Provider"}
                   value={mappingProvider || ""}
                   onChange={handleChange}>
            {enumValues(MappingProvider).map((value, index) => {
                const attribute = asTitle(value);
                return <MenuItem key={value} value={value}>{attribute}
                </MenuItem>;
            })}
        </TextField>
    );
}
