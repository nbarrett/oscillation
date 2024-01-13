import { Player } from "../models/player-models";
import { useSetRecoilState } from "recoil";
import { currentPlayerState, playersState } from "../atoms/route-atoms";
import React, { useEffect, useMemo, useRef } from "react";
import { log } from "../util/logging-config";
import { LatLng, LatLngTuple } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { PolylineWithData } from "./Polyline";

function positionFrom(markerRef: React.MutableRefObject<any>): LatLngTuple {
    const latLng: LatLng = markerRef.current.getLatLng();
    return [latLng.lat, latLng.lng];
}

export function PlayerCar(props: { player: Player }) {

    const setPlayers = useSetRecoilState<Player[]>(playersState);
    const setPlayer = useSetRecoilState<Player>(currentPlayerState);
    const markerRef = useRef<any>(null);
    const eventHandlers = useMemo(
        () => ({
            dragstart() {
                const position = positionFrom(markerRef);
                log.info("drag start for:", props?.player?.name, "position:", position);
                setPlayers(existing => {
                    return existing.map(player => player?.name === props?.player?.name ? ({
                        ...player,
                        position: position
                    }) : player);
                });
                setPlayer({...props.player, position: position});
            },
            dragend: function () {
                                const position = positionFrom(markerRef);
                log.info("dragend for:", props?.player?.name, "position:", position);
                // setPlayer(existing => ({
                //     ...existing,
                //     nextPosition: position
                // }));
                setPlayers(existing => {
                    return existing.map(player => player?.name === props?.player?.name ? ({
                        ...player,
                        nextPosition: position
                    }) : player);
                });
            },
        }),
        [],
    );

    useEffect(() => {
        log.debug("opening popup for ", props?.player?.name, "ref:", markerRef.current);
        markerRef.current.openPopup();
    }, [markerRef]);


    return (
        <><PolylineWithData player={props?.player}/>
        <Marker position={props?.player?.position} icon={props?.player?.icon}
                draggable eventHandlers={eventHandlers}
                ref={markerRef}>
            <Popup position={[71.505, 9]}>I am {props?.player?.name}!</Popup>
        </Marker></>);
}
