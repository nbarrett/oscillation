import { Polyline } from 'react-leaflet';
import { LatLngTuple } from "leaflet";
import { useEffect } from "react";
import { DirectionsResponse, Profile, SerializableRouteDirectionsRequest } from "../models/route-models";
import { currentPlayerState, profileState, routeDirectionsState } from "../atoms/route-atoms";
import { useRecoilValue } from "recoil";
import { log } from '../util/logging-config';
import { createSerializableRouteDirectionsRequest, toApiTuple } from "../mappings/route-mappings";
import { Player } from "../models/player-models";

export function PolylineWithData(props: { player: Player }) {

    const profile = useRecoilValue<Profile>(profileState);
    // const player: Player = useRecoilValue<Player>(currentPlayerState);
    const routeDirectionsRequest: SerializableRouteDirectionsRequest = createSerializableRouteDirectionsRequest({
        profile,
        start: toApiTuple(props.player?.position),
        end: toApiTuple(props.player?.nextPosition)
    });
    const directionsResponse: DirectionsResponse = useRecoilValue<DirectionsResponse>(routeDirectionsState(routeDirectionsRequest));
    const positions: LatLngTuple[] = directionsResponse?.features[0]?.geometry?.coordinates?.map((tuple: number[]) => toApiTuple(tuple)) || [];

    useEffect(() => {
        log.debug("PolylineWithData:positions:", positions);
    }, [positions]);

    return (
        <Polyline
            color={'red'}
            opacity={0.7}
            weight={10}
            positions={positions}/>);
}
