import * as React from "react";
import "leaflet/dist/leaflet.css";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import ProTip from "./ProTip";
import Icon from "@mui/material/Icon";
import { Grid, Stack } from "@mui/material";
import { Copyright } from "./Copyright";
import { MapWithCars } from "./MapWithCars";
import { RecoilRoot } from "recoil";
import ProfileSelector from "./ProfileSelector";
import MapLayerSelector from "./MapLayerSelector";
import MappingProviderSelector from "./MappingProviderSelector";
import { MapPositions } from "./MapPositions";
import { PlayerPositions } from "./PlayerPositions";
import { DiceRoller } from "./DiceRoller";


import { createTheme, ThemeProvider } from "@mui/material/styles";
import StartingPositionSelector from "./StartingPositionSelector";

export default function App() {

    const theme = createTheme({
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: "none",
                    }
                },
            },
        },
    });

    return (
        <RecoilRoot>
            <ThemeProvider theme={theme}>
                <Container maxWidth={false}>
                    <Stack pt={2} direction={"row"} alignItems={"center"} spacing={2}>
                        <Icon sx={{pt: 1, height: 60, width: 150}}>
                            <img src="https://labs.os.uk/static/media/os-logo.svg"/>
                        </Icon>
                        <Typography variant="h4" component="h1" gutterBottom>
                            Oscillation
                        </Typography>
                        <Typography sx={{display: {xs: "none", xl: "block"}}}
                                    variant="h6" component="h1" gutterBottom>
                            Version 0.1
                        </Typography>
                    </Stack>
                    <Grid pt={1} container alignItems={"center"} spacing={2}>
                        <Grid item xs>
                            <ProfileSelector/>
                        </Grid>
                        <Grid item xs>
                            <MappingProviderSelector/>
                        </Grid>
                        <Grid item xs>
                            <MapLayerSelector/>
                        </Grid>
                        <Grid item xs>
                            <StartingPositionSelector/>
                        </Grid>
                    </Grid>
                    <Grid container alignItems={"center"} spacing={2}>
                        <Grid item xs={12} xl={8}>
                            <DiceRoller/>
                        </Grid>
                        <Grid item xs={12} xl={4}>
                            <MapPositions/>
                        </Grid>
                    </Grid>
                    <PlayerPositions/>
                    <MapWithCars/>
                    <Grid container alignItems={"start"}>
                        <Grid item xs><ProTip/></Grid>
                        <Grid item xs><Copyright/></Grid>
                    </Grid>
                </Container>
            </ThemeProvider>
        </RecoilRoot>
    );
}
