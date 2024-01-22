import * as React from 'react';
import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { enumKeyValues } from "../util/enums";
import { Profile } from "../models/route-models";
import { asTitle } from "../util/strings";
import { TextField } from "@mui/material";
import { useRecoilState } from "recoil";
import { profileState } from "../atoms/route-atoms";
import { log } from "../util/logging-config";

export default function ProfileSelector() {

    const [profile, setProfile] = useRecoilState<Profile>(profileState);

    useEffect(() => {
        if (!profile) {
            log.info("ProfileSelector:profile:initialised to:", profile);
            setProfile(Profile.DRIVING_CAR);
        }
    }, []);

    useEffect(() => {
        log.info("ProfileSelector:profile:", profile);
    }, [profile]);

    function handleChange(event) {
        setProfile(event.target.value);
    }

    return (
        <TextField fullWidth sx={{minWidth: 220}} select size={"small"}
                   label={"Driving Profile"}
                   value={profile||""}
                   onChange={handleChange}>
            {enumKeyValues(Profile).map((value, index) =>
                <MenuItem key={value.key} value={value.value}>{asTitle(value.value)}</MenuItem>)}
        </TextField>
    );
}
