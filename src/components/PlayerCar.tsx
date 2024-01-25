import { Player } from "../models/player-models";
import React, { useEffect, useMemo, useRef } from "react";
import { log } from "../util/logging-config";
import { LatLng, LatLngExpression, LatLngTuple } from "leaflet";
import { Marker, Popup } from "react-leaflet";
import { PlayerMoveRoute } from "./PlayerMoveRoute";
import { GameTurnState } from "../models/game-models";
import { useGameState } from "../hooks/use-game-state";
import { asTitle, pluraliseWithCount } from "../util/strings";

function positionFrom(markerRef: React.MutableRefObject<any>): LatLngTuple {
    const latLng: LatLng = markerRef.current.getLatLng();
    return [latLng.lat, latLng.lng];
}

export function PlayerCar(props: { player: Player }) {

    const markerRef = useRef<any>(null);
    const gameState = useGameState();
    const active = props.player.name === gameState?.gameData?.currentPlayerName;
    const activeLabel = active ? "active" : "not active";
    const draggable = active && gameState.gameData.gameTurnState === GameTurnState.DICE_ROLLED;
    const eventHandlers = useMemo(
        () => ({
            dragstart() {
                if (active) {
                    const position = positionFrom(markerRef);
                    log.debug("drag start for:", props?.player?.name, "position:", position);
                    gameState.setPlayerData("position", position);
                } else {
                    log.warn("drag start not possible for:", props?.player?.name, "as", activeLabel);
                }
            },
            dragend: function () {
                if (active) {
                    const position = positionFrom(markerRef);
                    log.debug("drag end for:", props?.player?.name, "position:", position);
                    gameState.setPlayerData("nextPosition", position);
                } else {
                    log.warn("drag start not possible for:", props?.player?.name, "as", activeLabel);
                }

            },
            mouseover: function (data) {
                log.debug(activeLabel, "mouseover for:", props?.player?.name, "data:", data);
                markerRef.current.openPopup();
            },
            mouseout: function (data) {
                log.debug(activeLabel, "mouseout for:", props?.player?.name, "data:", data);
            },
        }),
        [props.player, active],
    );

    useEffect(() => {
    }, [markerRef]);

    useEffect(() => {
        if (active && markerRef) {
            log.debug("opening popup for ", props?.player?.name, "ref:", markerRef.current, "gameTurnState:", gameState.gameData.gameTurnState);
            markerRef.current.openPopup();
        } else {
            log.debug("not opening popup for ", props?.player?.name, "ref:", markerRef.current, "gameTurnState:", gameState.gameData.gameTurnState);
        }
    }, [active, markerRef, gameState.gameData.gameTurnState]);

    const popupPosition: LatLngExpression = [75.505, 190];

    function popupCaption() {
        if (draggable) {
            return `Okay ${props?.player?.name} - move ${pluraliseWithCount(gameState.gameData.diceResult, "square")}!`;
        } else if (active) {
            return `It's ${props?.player?.name}'s turn and it's time to ${asTitle(gameState.gameData.gameTurnState)}`;
        } else {
            return `It's ${gameState.gameData.currentPlayerName}'s turn - you must wait for them to finish first!`;
        }
    }

    return (
        <Marker position={props?.player?.position} icon={props?.player?.icon}
                draggable={draggable}
                riseOnHover={false}
                eventHandlers={eventHandlers}
                ref={markerRef}>
            <PlayerMoveRoute player={props?.player}/>
            <Popup position={popupPosition} className="custom-popup">
                {popupCaption()}</Popup>
        </Marker>);
}
