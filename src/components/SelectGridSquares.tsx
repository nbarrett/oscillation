import { useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "proj4leaflet";
import { log } from "../util/logging-config";
import { useEffect } from "react";
import L, { LatLng } from "leaflet";
import { SetterOrUpdater, useRecoilState, useRecoilValue } from "recoil";
import { gridClearRequestState, mapClickPositionState, selectedGridSquaresState } from "../atoms/game-atoms";
import { calculateGridReferenceSquare } from "../mappings/os-maps-mappings";
import { colours } from "../models/game-models";
import isEqual from "lodash/isEqual";
import cloneDeep from "lodash/cloneDeep";
import { useGameState } from "../hooks/use-game-state";
import { MapClickPosition, SelectedGrid } from "../models/os-maps-models";

export function SelectGridSquares() {
    const gameState = useGameState();
    const mapClickPosition: MapClickPosition = useRecoilValue<MapClickPosition>(mapClickPositionState);
    const [selectedGridSquares, setSelectedGridSquares]: [SelectedGrid[], SetterOrUpdater<SelectedGrid[]>] = useRecoilState<SelectedGrid[]>(selectedGridSquaresState);
    const gridClearRequest: number = useRecoilValue<number>(gridClearRequestState);
    const map: L.Map = useMap();

    class IdentifiedPolygon extends L.Polygon {
        firstLatLong: LatLng;

        constructor(gridSquareLatLongs: LatLng[], options?: L.PolylineOptions) {
            super(gridSquareLatLongs, options);
            this.firstLatLong = gridSquareLatLongs[0];
        }
    }

    useEffect(() => {
        if (mapClickPosition) {
            const gridSquareLatLongs: LatLng[] = calculateGridReferenceSquare(map, mapClickPosition.gridReferenceData, mapClickPosition.gridSquareCorners);
            const existingItem = selectedGridSquares.find(item => isEqual(item.gridSquareLatLongs[0], gridSquareLatLongs[0]));
            if (gameState.gameData.diceResult > selectedGridSquares.length || existingItem) {
                if (existingItem) {
                    log.info("attempting to find layer with matching lat/long:", existingItem.gridSquareLatLongs);
                    map.eachLayer((layer) => {
                        if (isIdentifiedPolygon(layer)) {
                            if (isEqual(layer.firstLatLong, existingItem.gridSquareLatLongs[0])) {
                                log.info("found matching lat/long", layer.getLatLngs(), "removing polygon");
                                layer.remove();
                                setSelectedGridSquares(existingSelections => existingSelections.filter(existingSelection => !isEqual(existingSelection.gridSquareLatLongs, existingItem.gridSquareLatLongs)));
                            } else {
                                log.debug("layer lat/long", layer.getLatLngs(), "don't match", existingItem.gridSquareLatLongs);
                            }
                        } else {
                            log.debug("layer not a polygon", layer);
                        }
                    });
                } else {
                    log.info("could not find existing grid square with gridSquareLatLongs:", gridSquareLatLongs);
                    const gridSquare: IdentifiedPolygon = new IdentifiedPolygon(gridSquareLatLongs, {
                        interactive: true,
                        color: colours.osMapsPurple,
                        weight: 1
                    });
                    log.info("created gridSquare:", gridSquare);
                    const newItem: SelectedGrid = {gridSquareLatLongs};
                    log.info("created newItem:", newItem);
                    log.info("adding gridSquare to map:", gridSquare);
                    gridSquare.addTo(map);
                    setSelectedGridSquares(existingSelections => cloneDeep(existingSelections).concat(newItem));
                }
            }

        } else {
            log.debug("map not yet initialised");
        }

    }, [mapClickPosition]);

    useEffect(() => {
        const polygons: L.Polygon[] = [];
        map.eachLayer((layer) => {
            if (isIdentifiedPolygon(layer)) {
                log.debug("found IdentifiedPolygon", layer);
                polygons.push(layer);
            } else {
                log.debug("layer not an IdentifiedPolygon:", layer);
            }
        });

        log.info("selectedGridSquares:", selectedGridSquares, "polygons:", polygons);


    }, [selectedGridSquares]);

    useEffect(() => {
        log.info("gridClearRequest:", gridClearRequest);
        if (gridClearRequest > 0) {
            clearSelections();
        }

    }, [gridClearRequest]);


    function isIdentifiedPolygon(document: any): document is IdentifiedPolygon {
        return (document as IdentifiedPolygon).firstLatLong !== undefined;
    }

    function clearSelections() {
        log.info("request to clear grid");
        map.eachLayer((layer) => {
            if (layer instanceof L.Polygon) {
                log.info("removing polygon", layer);
                layer.remove();
            } else {
                log.info("layer not a polygon:", layer);
            }
        });
        setSelectedGridSquares([]);
    }

    return null;
}
