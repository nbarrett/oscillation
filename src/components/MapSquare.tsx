import React from 'react';
import { TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'proj4leaflet';
import { log } from "../util/logging-config";

export function MapSquare() {

    const map = useMap();
    const gridCodes: string[][] = [
        ["SV", "SQ", "SL", "SF", "SA", "NV", "NQ", "NL", "NF", "NA", "HV", "HQ", "HL"],
        ["SW", "SR", "SM", "SG", "SB", "NW", "NR", "NM", "NG", "NB", "HW", "HR", "HM"],
        ["SX", "SS", "SN", "SH", "SC", "NX", "NS", "NN", "NH", "NC", "HX", "HS", "HN"],
        ["SY", "ST", "SO", "SJ", "SD", "NY", "NT", "NO", "NJ", "ND", "HY", "HT", "HO"],
        ["SZ", "SU", "SP", "SK", "SE", "NZ", "NU", "NP", "NK", "NE", "HZ", "HU", "HP"],
        ["TV", "TQ", "TL", "TF", "TA", "OV", "OQ", "OL", "OF", "OA", "JV", "JQ", "JL"],
        ["TW", "TR", "TM", "TG", "TB", "OW", "OR", "OM", "OG", "OB", "JW", "JR", "JM"]
    ];

    function gridReferenceFrom(eastings: string, northings: string): string {
        return `${gridCodeFrom(eastings, northings)} ${eastings.substring(1, 4)}${northings.substring(1, 4)}`;
    }

    function gridCodeFrom(eastings: string, northings: string): string {
        return gridCodes[+eastings.substring(0, 1)][+northings.substring(0, 1)];
    }

    map.on('click', function (event) {
        // Transform clicked coordinates to EPSG:27700
        const clickedPoint = map.project(event.latlng);
        const osCoordinates = map.options.crs.project(event.latlng);
        const easting: number = Math.round(osCoordinates.x);
        const northing: number = Math.round(osCoordinates.y);

        // Calculate grid square
        const gridSquare = convertEastingNorthingToGridReference(easting, northing);
        const gridReference = gridReferenceFrom(easting.toString(), northing.toString());
        log.info('GPT Clicked Grid Square:', gridSquare);
        log.info('My own code Clicked Grid Square:', gridReference);
    });

    function convertEastingNorthingToGridReference(easting: number, northing: number) {
        const gridSquareSize = 100000; // 100km grid square size
        const e100km = Math.floor(easting / gridSquareSize);
        const n100km = Math.floor(northing / gridSquareSize);

        const gridSquareLetters = getGridSquareLetters(e100km, n100km);
        const eNumeric = easting % gridSquareSize;
        const nNumeric = northing % gridSquareSize;

        const eNumericReference = eNumeric.toString().padStart(5, '0').slice(-3);
        const nNumericReference = nNumeric.toString().padStart(5, '0').slice(-3);

        return `${gridSquareLetters} ${eNumericReference}${nNumericReference}`;
    }

    function getGridSquareLetters(e100km: number, n100km: number): string {
        return gridCodes[n100km][e100km];
    }

    return <>blah</>;
}

export function MapTiler() {
    return <TileLayer url="https://tileserver.maptiler.com/osm-merc/{z}/{x}/{y}.png" attribution="© Ordnance Survey"/>;
}
