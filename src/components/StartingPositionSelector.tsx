import * as React from "react";
import { useEffect } from "react";
import MenuItem from "@mui/material/MenuItem";
import { asTitle } from "../util/strings";
import { Button, TextField } from "@mui/material";
import { formatLatLong } from "../mappings/route-mappings";
import Typography from "@mui/material/Typography";
import Stack from '@mui/material/Stack';
import { NamedLocation } from "../shared/NamedLocation";
import useNamedLocationsData from "../hooks/use-named-locations";
import { colours } from "../models/game-models";
import { log } from "../util/logging-config";
import isNull from "lodash-es/isNull";

export default function StartingPositionSelector() {

    const namedLocationsData = useNamedLocationsData();
    const namedLocations: NamedLocation[] = namedLocationsData?.namedLocations;
    const namedLocation: NamedLocation = namedLocationsData?.namedLocation;

    useEffect(() => {
        log.debug("StartingPositionSelector:namedLocations:", namedLocations);
    }, [namedLocations]);

    function handleChange(event) {
        const namedLocation = namedLocations.find((value: NamedLocation) => value.name === event.target.value);
        namedLocationsData.setNamedLocation(namedLocation);
    }

    return isNull(namedLocations) ?
        <Button fullWidth variant="contained"
                color="primary"
                onClick={() => namedLocationsData.prePopulateDataStore()}
                sx={{
                    '&': {
                        backgroundColor: colours.osMapsPurple,
                    },
                    '&:hover': {
                        backgroundColor: colours.osMapsPink,
                    },
                }}>Populate Starting Points</Button> :
        <TextField fullWidth sx={{minWidth: 220}} select size={"small"}
                   label={"Game Starting Point"}
                   value={namedLocation?.name || ""}
                   onChange={handleChange}>
            {namedLocations?.map((value: NamedLocation, index) => (
                <MenuItem key={value?.name} value={value?.name}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <div>{asTitle(value?.name)}</div>
                        <Typography variant="body2" color="text.secondary">
                            {formatLatLong(value?.location)}
                        </Typography>
                    </Stack>
                </MenuItem>
            ))}
        </TextField>;
}
