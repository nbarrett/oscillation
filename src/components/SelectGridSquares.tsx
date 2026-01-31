'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { isEqual } from "es-toolkit/compat";
import { useGameStore, GridReferenceData, GridSquareCorners, SelectedGrid } from '@/stores/game-store';
import { colours, log } from '@/lib/utils';

class IdentifiedPolygon extends L.Polygon {
  firstLatLong: L.LatLng;

  constructor(gridSquareLatLongs: L.LatLng[], options?: L.PolylineOptions) {
    super(gridSquareLatLongs, options);
    this.firstLatLong = gridSquareLatLongs[0];
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
    setSelectedGridSquares,
    addSelectedGridSquare,
    removeSelectedGridSquare,
  } = useGameStore();

  function findExistingGridSquareIndex(gridSquareLatLongs: L.LatLng[]): number {
    return selectedGridSquares.findIndex(
      (item) => item.gridSquareLatLongs.length > 0 &&
        isEqual(item.gridSquareLatLongs[0], { lat: gridSquareLatLongs[0].lat, lng: gridSquareLatLongs[0].lng })
    );
  }

  function deselectGridSquare(gridSquareLatLongs: L.LatLng[], existingIndex: number) {
    map.eachLayer((layer) => {
      if (isIdentifiedPolygon(layer)) {
        const firstLL = gridSquareLatLongs[0];
        if (isEqual({ lat: layer.firstLatLong.lat, lng: layer.firstLatLong.lng }, { lat: firstLL.lat, lng: firstLL.lng })) {
          log.info("removing polygon for deselection");
          layer.remove();
        }
      }
    });
    removeSelectedGridSquare(existingIndex);
  }

  function selectGridSquare(gridSquareLatLongs: L.LatLng[]) {
    const gridSquare = new IdentifiedPolygon(gridSquareLatLongs, {
      interactive: true,
      color: colours.osMapsPurple,
      weight: 1,
    });

    gridSquare.addTo(map);
    addSelectedGridSquare({
      gridSquareLatLongs: gridSquareLatLongs.map((ll) => ({ lat: ll.lat, lng: ll.lng })),
    });
    log.info("added grid square polygon");
  }

  function canSelectMoreGridSquares(): boolean {
    return !!(diceResult && diceResult > selectedGridSquares.length);
  }

  useEffect(() => {
    if (!mapClickPosition || !map) return;

    const gridSquareLatLongs = calculateGridReferenceSquare(
      map,
      mapClickPosition.gridReferenceData,
      mapClickPosition.gridSquareCorners
    );

    if (gridSquareLatLongs.length === 0) return;

    const existingIndex = findExistingGridSquareIndex(gridSquareLatLongs);

    if (existingIndex !== -1) {
      deselectGridSquare(gridSquareLatLongs, existingIndex);
    } else if (canSelectMoreGridSquares()) {
      selectGridSquare(gridSquareLatLongs);
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
  }

  useEffect(() => {
    if (gridClearRequest > 0) {
      clearAllPolygons();
    }
  }, [gridClearRequest, map, setSelectedGridSquares]);

  return null;
}
