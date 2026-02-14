"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  useGameStore,
  GridReferenceData,
  GridSquareCorners,
} from "@/stores/game-store";
import { latLngToGridKey } from "@/lib/road-data";
import { colours, log } from "@/lib/utils";

class IdentifiedPolygon extends L.Polygon {
  firstLatLong: L.LatLng;
  gridKey: string;

  constructor(gridSquareLatLongs: L.LatLng[], gridKey: string, options?: L.PolylineOptions) {
    super(gridSquareLatLongs, options);
    this.firstLatLong = gridSquareLatLongs[0];
    this.gridKey = gridKey;
  }
}

function isIdentifiedPolygon(layer: L.Layer): layer is IdentifiedPolygon {
  return (layer as IdentifiedPolygon).firstLatLong !== undefined;
}

function transformGridReference(
  cornerGridReference: string,
  gridReferenceData: GridReferenceData,
  map: L.Map
): { cornerLatLng: L.LatLng | null } {
  try {
    const parts = cornerGridReference.split(" ");
    const cornerEasting = parseInt(`${gridReferenceData.row}${parts[1]}`.padEnd(gridReferenceData.eastings.length, "0"), 10);
    const cornerNorthing = parseInt(`${gridReferenceData.column}${parts[2]}`.padEnd(gridReferenceData.northings.length, "0"), 10);

    const cornerPoint = new L.Point(cornerEasting, cornerNorthing);
    const cornerLatLng = map.options.crs!.unproject(cornerPoint);
    return { cornerLatLng };
  } catch (e) {
    log.error("Failed to transform grid reference:", e);
    return { cornerLatLng: null };
  }
}

function calculateGridReferenceSquare(
  map: L.Map,
  gridReferenceData: GridReferenceData,
  gridSquareCorners: GridSquareCorners
): L.LatLng[] {
  const corners = Object.values(gridSquareCorners);
  return corners
    .map((corner) => transformGridReference(corner, gridReferenceData, map).cornerLatLng)
    .filter((latLng): latLng is L.LatLng => latLng !== null);
}

export default function SelectGridSquares() {
  const map = useMap();
  const {
    mapClickPosition,
    selectedGridSquares,
    gridClearRequest,
    movementPath,
    setSelectedGridSquares,
    addSelectedGridSquare,
    removeSelectedGridSquare,
    addToMovementPath,
    removeFromMovementPath,
    canSelectGrid,
    setMovementPath,
  } = useGameStore();

  function findExistingGridSquareIndex(gridKey: string): number {
    return selectedGridSquares.findIndex((item) => item.gridKey === gridKey);
  }

  function deselectGridSquare(gridKey: string, existingIndex: number) {
    const pathIndex = movementPath.indexOf(gridKey);
    if (pathIndex !== movementPath.length - 1) return;

    map.eachLayer((layer) => {
      if (isIdentifiedPolygon(layer) && layer.gridKey === gridKey) {
        layer.remove();
      }
    });
    removeSelectedGridSquare(existingIndex);
    removeFromMovementPath(gridKey);
  }

  function selectGridSquare(gridSquareLatLongs: L.LatLng[], gridKey: string) {
    const gridSquare = new IdentifiedPolygon(gridSquareLatLongs, gridKey, {
      interactive: true,
      color: colours.osMapsPurple,
      weight: 2,
      fillOpacity: 0.3,
    });

    gridSquare.addTo(map);
    addSelectedGridSquare({
      gridSquareLatLongs: gridSquareLatLongs.map((ll) => ({ lat: ll.lat, lng: ll.lng })),
      gridKey,
    });
    addToMovementPath(gridKey);
  }

  useEffect(() => {
    if (!mapClickPosition || !map) return;

    const gridKey = latLngToGridKey(
      mapClickPosition.latLng.lat,
      mapClickPosition.latLng.lng
    );

    const gridSquareLatLongs = calculateGridReferenceSquare(
      map,
      mapClickPosition.gridReferenceData,
      mapClickPosition.gridSquareCorners
    );

    if (gridSquareLatLongs.length === 0) return;

    const existingIndex = findExistingGridSquareIndex(gridKey);

    if (existingIndex !== -1) {
      deselectGridSquare(gridKey, existingIndex);
    } else if (canSelectGrid(gridKey)) {
      selectGridSquare(gridSquareLatLongs, gridKey);
    }
  }, [mapClickPosition]);

  useEffect(() => {
    if (gridClearRequest > 0) {
      map.eachLayer((layer) => {
        if (layer instanceof L.Polygon) {
          layer.remove();
        }
      });
      setSelectedGridSquares([]);
      setMovementPath([]);
    }
  }, [gridClearRequest, map, setSelectedGridSquares, setMovementPath]);

  return null;
}
