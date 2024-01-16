import * as React from 'react';
import "leaflet/dist/leaflet.css";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ProTip from './ProTip';
import Icon from '@mui/material/Icon';
import { Grid, Stack } from "@mui/material";
import { Copyright } from "./Copyright";
import { MapWithCars } from "./MapWithCars";
import { RecoilRoot } from 'recoil';
import ProfileSelector from "./ProfileSelector";
import Dice from "./Dice";
import MapLayerSelector from "./MapLayerSelector";
import MappingProviderSelector from "./MappingProviderSelector";


export default function App() {
    return (
        <RecoilRoot>
            <Container maxWidth={false}>
                <Stack pt={2} direction={"row"} alignItems={"center"} spacing={2}>
                    <Icon sx={{pt: 1, height: 60, width: 150}}>
                        <img src="https://labs.os.uk/static/media/os-logo.svg"/>
                    </Icon>
                    <Typography variant="h4" component="h1" gutterBottom>
                        Oscillation
                    </Typography>
                    <Typography variant="h6" component="h1" gutterBottom>
                        Version 0.1
                    </Typography>
                    <ProfileSelector/>
                    <MappingProviderSelector/>
                    <MapLayerSelector/>
                </Stack>
                <Dice/>
                <MapWithCars/>
                <Grid container alignItems={"start"}>
                    <Grid item xs><ProTip/></Grid>
                    <Grid item xs><Copyright/></Grid>
                </Grid>
            </Container>
        </RecoilRoot>
    );
}
