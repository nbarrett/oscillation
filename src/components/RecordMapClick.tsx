'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useGameStore, GridReferenceData, GridSquareCorners } from '@/stores/game-store';
import { log, formatLatLong } from '@/lib/utils';

const gridReferenceCodes: string[][] = [
  ['SV', 'SQ', 'SL', 'SF', 'SA', 'NV', 'NQ', 'NL', 'NF', 'NA', 'HV', 'HQ', 'HL'],
  ['SW', 'SR', 'SM', 'SG', 'SB', 'NW', 'NR', 'NM', 'NG', 'NB', 'HW', 'HR', 'HM'],
  ['SX', 'SS', 'SN', 'SH', 'SC', 'NX', 'NS', 'NN', 'NH', 'NC', 'HX', 'HS', 'HN'],
  ['SY', 'ST', 'SO', 'SJ', 'SD', 'NY', 'NT', 'NO', 'NJ', 'ND', 'HY', 'HT', 'HO'],
  ['SZ', 'SU', 'SP', 'SK', 'SE', 'NZ', 'NU', 'NP', 'NK', 'NE', 'HZ', 'HU', 'HP'],
  ['TV', 'TQ', 'TL', 'TF', 'TA', 'OV', 'OQ', 'OL', 'OF', 'OA', 'JV', 'JQ', 'JL'],
  ['TW', 'TR', 'TM', 'TG', 'TB', 'OW', 'OR', 'OM', 'OG', 'OB', 'JW', 'JR', 'JM'],
];

function gridReferenceDataFromLatLong(map: L.Map, latlng: L.LatLng): GridReferenceData {
  const osCoordinates = map.options.crs!.project(latlng);
  const eastings = Math.round(osCoordinates.x).toString();
  const northings = Math.round(osCoordinates.y).toString();

  const row = parseInt(eastings.substring(0, 1), 10);
  const column = parseInt(northings.substring(0, 1), 10);
  const gridCode = gridReferenceCodes[row]?.[column] || 'XX';
  const gridReference = `${gridCode} ${eastings.substring(1, 4)} ${northings.substring(1, 4)}`;

  return { eastings, northings, row, column, gridCode, gridReference };
}

function calculateGridSquareCorners(gridReferenceData: GridReferenceData): GridSquareCorners {
  const gridReference = gridReferenceData.gridReference;
  const parts = gridReference.split(' ');
  const eastings = parts[1];
  const northings = parts[2];

  const eastingFloor = Math.floor(parseInt(eastings, 10) / 10) * 10;
  const northingFloor = Math.floor(parseInt(northings, 10) / 10) * 10;
  const eastingCeil = eastingFloor + 10;
  const northingCeil = northingFloor + 10;

  const pad = (n: number) => n.toString().padStart(3, '0');

  return {
    northWest: `${gridReferenceData.gridCode} ${pad(eastingFloor)} ${pad(northingCeil)}`,
    northEast: `${gridReferenceData.gridCode} ${pad(eastingCeil)} ${pad(northingCeil)}`,
    southEast: `${gridReferenceData.gridCode} ${pad(eastingCeil)} ${pad(northingFloor)}`,
    southWest: `${gridReferenceData.gridCode} ${pad(eastingFloor)} ${pad(northingFloor)}`,
  };
}

export default function RecordMapClick() {
  const map = useMap();
  const setMapClickPosition = useGameStore((state) => state.setMapClickPosition);

  useEffect(() => {
    if (!map) {
      log.debug('map not yet initialised');
      return;
    }

    const handleClick = (e: L.LeafletMouseEvent) => {
      log.debug('you clicked map at position', formatLatLong({ lat: e.latlng.lat, lng: e.latlng.lng }));
      const gridReferenceData = gridReferenceDataFromLatLong(map, e.latlng);
      const gridSquareCorners = calculateGridSquareCorners(gridReferenceData);
      setMapClickPosition({
        latLng: { lat: e.latlng.lat, lng: e.latlng.lng },
        gridReferenceData,
        gridSquareCorners,
      });
    };

    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
    };
  }, [map, setMapClickPosition]);

  return null;
}
