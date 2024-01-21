import { Polyline } from 'react-leaflet';
import { LatLngTuple } from "leaflet";
import { useEffect, useState } from "react";
import { DirectionsResponse, Profile, SerializableRouteDirectionsRequest } from "../models/route-models";
import { profileState, routeDirectionsState } from "../atoms/route-atoms";
import { useRecoilValue } from "recoil";
import { log } from '../util/logging-config';
import { createSerializableRouteDirectionsRequest, toApiTuple } from "../mappings/route-mappings";
import { Player } from "../models/player-models";
import { currentPlayerState } from "../atoms/game-atoms";
import { useGameState } from "../hooks/use-game-state";
import { colours } from "../models/game-models";

export function PlayerMoveRoute(props: { player: Player }) {

    const currentPlayer: Player = useRecoilValue<Player>(currentPlayerState);
    const gameState = useGameState();
    const active = props.player?.name === currentPlayer?.name;
    const profile = useRecoilValue<Profile>(profileState);
    const routeDirectionsRequest: SerializableRouteDirectionsRequest = active ? createSerializableRouteDirectionsRequest({
        profile,
        start: toApiTuple(props.player?.position),
        end: toApiTuple(props.player?.nextPosition)
    }) : null;
    const directionsResponse: DirectionsResponse = useRecoilValue<DirectionsResponse>(routeDirectionsState(routeDirectionsRequest));
    const [positions, setPositions]: [LatLngTuple[], (positions: LatLngTuple[]) => void] = useState<LatLngTuple[]>([]);
    const receivedPositions: LatLngTuple[] = directionsResponse?.features[0]?.geometry?.coordinates?.map((tuple: number[]) => toApiTuple(tuple)) || [];

    useEffect(() => {
        if (receivedPositions.length > 0) {
            log.info("PlayerMoveRoute:positions received for player:", props.player.name, "->", receivedPositions);
            setPositions(receivedPositions);
            gameState.playerRouteReceived();
        }
    }, [receivedPositions]);

    return (
        <Polyline
            color={colours.osMapsPurple}
            opacity={0.8}
            weight={10}
            positions={positions}/>);
}
