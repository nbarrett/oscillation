import blueCar from "./blue-car.png";
import redCar from "./red-car.png";
import whiteCar from "./white-car.png";
import markerIconImage from "leaflet/dist/images/marker-icon.png";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L, { Icon, LatLng, LatLngTuple } from "leaflet";
import { Legend } from "./Legend";
import { Player } from "./models";
import Link from "@mui/material/Link";
import { Box, Stack } from "@mui/material";
import { PolylineWithData } from "./Polyline";

const startingPosition: LatLngTuple = [51.505, -0.09];

const whiteCarIcon: Icon<{ iconSize: [number, number]; iconUrl: any }> = new Icon({
    iconUrl: whiteCar,
    iconSize: [172, 62]
});
const blueCarIcon = new Icon({
    iconUrl: blueCar,
    iconSize: [172, 62]
});
const redCarIcon = new Icon({
    iconUrl: redCar,
    iconSize: [172, 62]
});

const markerIcon = new Icon({
    iconUrl: markerIconImage,
    iconSize: [72, 52]
});


function startingPositionFor(index: number): LatLngTuple {
    return [startingPosition[0] + 0.00014023745552549371 * index, startingPosition[1] + -0.0002467632293701172 * index];
}

function generatePlayers(icons: Icon[]): Player[] {
    return icons.map((icon, index) => ({name: `Player ${index + 1}`, icon, position: startingPositionFor(index)}));
}

export function MapWithCars() {

    const [players, setPlayers]: [Player[], ((value: (((prevState: Player[]) => Player[]) | Player[])) => void)] = useState<Player[]>(generatePlayers([whiteCarIcon, blueCarIcon, redCarIcon]));
    const [map, setMap] = useState<L.Map>();

    useEffect(() => {
        console.log("MapWithCars:players:", players, "lat 1->2:", players[1].position[0] - players[0].position[0], "lng 1->2:", players[1].position[1] - players[0].position[1]);
    }, [players]);

    function zoomToPlayer(player: Player) {
        map?.flyTo(player.position);
    }

    return <>
        <Stack direction={"row"} spacing={1}>
            <div>Player positions:</div>
            {players.map(player => <>
                <Link onClick={() => zoomToPlayer(player)} sx={{cursor: "pointer"}}
                      key={player.name}>{player.name}</Link>
                <Box>lat-long: {player.position[0]},{player.position[1]}</Box>
                {/*<Box>long: {player.position[1]}</Box>*/}
            </>)}</Stack>
        <MapContainer center={startingPosition} zoom={17} scrollWheelZoom={true}
                      ref={(map: L.Map) => setMap(map)}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
            {players.map((player: Player, key: number) => <PlayerCar key={key} player={player} players={players}
                                                                     setPlayers={setPlayers}/>)}
            <Legend map={map as L.Map}/>
            <PolylineWithData/>
        </MapContainer></>;
}

export function PlayerCar(props: {
    player: Player,
    players: Player[],
    setPlayers: ((value: (((prevState: Player[]) => Player[]) | Player[])) => void)
}) {

    const markerRef = useRef<any>(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    console.log("marker position for ", props?.player?.name, "is:", marker);
                    props.setPlayers(existing => {
                        let latLng: LatLng = marker.getLatLng();
                        return existing.map(player => player?.name === props?.player?.name ? ({
                            ...player,
                            position: [latLng.lat, latLng.lng]
                        }) : player);
                    });
                }
            },
        }),
        [],
    );

    useEffect(() => {
        console.log("opening popup for ", props?.player?.name, "ref:", markerRef.current);
        markerRef.current.openPopup();
    }, [markerRef]);


    return <Marker position={props?.player?.position} icon={props?.player?.icon} draggable eventHandlers={eventHandlers}
                   ref={markerRef}>
        <Popup position={[71.505, 9]}>
            I am {props?.player?.name}!
        </Popup>
    </Marker>;
}
