'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { isEqual } from "es-toolkit/compat";
import {
  useGameStore,
  GridReferenceData,
  GridSquareCorners,
  SelectedGrid,
  createGridKey,
} from '@/stores/game-store';
import { colours, log } from '@/lib/utils';

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
    const parts = cornerGridReference.split(' ');
    const cornerEasting = parseInt(`${gridReferenceData.row}${parts[1]}`.padEnd(gridReferenceData.eastings.length, '0'), 10);
    const cornerNorthing = parseInt(`${gridReferenceData.column}${parts[2]}`.padEnd(gridReferenceData.northings.length, '0'), 10);

    const cornerPoint = new L.Point(cornerEasting, cornerNorthing);
    const cornerLatLng = map.options.crs!.unproject(cornerPoint);
    return { cornerLatLng };
  } catch (e) {
    log.error('failed to transform grid reference:', e);
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
    diceResult,
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
    // Only allow deselecting from the end of the path
    const pathIndex = movementPath.indexOf(gridKey);
    if (pathIndex !== movementPath.length - 1) {
      log.info("Cannot deselect grid that's not at the end of the path");
      return;
    }

    map.eachLayer((layer) => {
      if (isIdentifiedPolygon(layer) && layer.gridKey === gridKey) {
        log.info("removing polygon for deselection");
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
    log.info("added grid square to movement path:", gridKey);
  }

  useEffect(() => {
    if (!mapClickPosition || !map) return;

    const gridKey = createGridKey(
      mapClickPosition.gridReferenceData.eastings,
      mapClickPosition.gridReferenceData.northings
    );

    const gridSquareLatLongs = calculateGridReferenceSquare(
      map,
      mapClickPosition.gridReferenceData,
      mapClickPosition.gridSquareCorners
    );

    if (gridSquareLatLongs.length === 0) return;

    const existingIndex = findExistingGridSquareIndex(gridKey);

    if (existingIndex !== -1) {
      // Try to deselect (only works if it's the last in path)
      deselectGridSquare(gridKey, existingIndex);
    } else if (canSelectGrid(gridKey)) {
      selectGridSquare(gridSquareLatLongs, gridKey);
    } else {
      log.info("Cannot select grid - not adjacent to current path or max moves reached");
    }
  }, [mapClickPosition]);

  function clearAllPolygons() {
    log.info("clearing all grid selections");
    map.eachLayer((layer) => {
      if (layer instanceof L.Polygon) {
        layer.remove();
      }
    });
    setSelectedGridSquares([]);
    setMovementPath([]);
  }

  useEffect(() => {
    if (gridClearRequest > 0) {
      clearAllPolygons();
    }
  }, [gridClearRequest, map, setSelectedGridSquares]);

  return null;
}
