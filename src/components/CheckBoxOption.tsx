import React from 'react';
import { useRecoilState } from 'recoil';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { customTileSelectedState } from "../atoms/os-maps-atoms";

export function TileTypeSelection() {
    const [tileType, setTileType] = useRecoilState(customTileSelectedState);

    return (
        <FormControlLabel
            control={<Checkbox checked={tileType} onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setTileType(event.target.checked);
            }}/>}
            label="Use Custom Tle Layer"
        />
    );
}
