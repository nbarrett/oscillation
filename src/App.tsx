import * as React from 'react';
import "leaflet/dist/leaflet.css";
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ProTip from './ProTip';
import Icon from '@mui/material/Icon';
import { Grid, Stack } from "@mui/material";
import { Copyright } from "./Copyright";
import { MapWithCars } from "./MapWithCars";


export default function App() {
    return (
        <Container maxWidth={false}>
            <Stack pt={2} direction={"row"} alignContent={"center"}>
                <Icon sx={{height: 60, width: 150}}>
                    <img src="https://labs.os.uk/static/media/os-logo.svg"/>
                </Icon>
                <Typography variant="h5" component="h1" gutterBottom>
                    Oscillation
                </Typography>
            </Stack>
            <MapWithCars/>
            <Grid container alignItems={"start"}>
                <Grid item xs><ProTip/></Grid>
                <Grid item xs><Copyright/></Grid>
            </Grid>
        </Container>
    );
}
