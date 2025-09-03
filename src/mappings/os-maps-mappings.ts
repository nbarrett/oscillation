import L, { LatLng, Point } from "leaflet";
import { log } from "../util/logging-config";
import {
    gridReferenceCodes,
    GridReferenceData,
    GridReferenceTransform,
    GridSquareCorners
} from "../models/os-maps-models";
import isNaN from "lodash-es/isNaN";

export function gridReferenceDataFromEastingsAndNothings(eastings: string, northings: string): GridReferenceData {
    const row = +eastings.substring(0, 1);
    const column = +northings.substring(0, 1);
    const gridCode = gridReferenceCodes[row][column];
    const gridReference = `${gridCode} ${eastings.substring(1, 5)} ${northings.substring(1, 5)}`;
    log.debug("row:", row, "from first digit of eastings:", eastings, "column:", column, "from first digit of northings:", northings, "gridCode:", gridCode);
    return {eastings, northings, row, column, gridCode, gridReference};
}

export function gridReferenceDataFromLatLong(map: L.Map, latlng: LatLng): GridReferenceData {
    const osCoordinates: Point = map.options.crs.project(latlng);
    const eastings: number = Math.round(osCoordinates.x);
    const northings: number = Math.round(osCoordinates.y);
    const gridReferenceData: GridReferenceData = gridReferenceDataFromEastingsAndNothings(eastings.toString(), northings.toString());
    log.info("latlng:", latlng, "osCoordinates:", osCoordinates, "eastings:", eastings, "northings:", northings, "gridReferenceData:", gridReferenceData);
    return gridReferenceData;
}

function eastingsFromGridReference(gridReference: string) {
    return gridReference.split(" ")[1];
}

function northingsFromFromGridReference(gridReference: string) {
    return gridReference.split(" ")[2];
}

function transformGridReference(cornerGridReference: string, gridReferenceData: GridReferenceData, map: L.Map): GridReferenceTransform {
    const cornerEastingFromGridReference = eastingsFromGridReference(cornerGridReference);
    const cornerEasting = `${gridReferenceData.row}${cornerEastingFromGridReference}`.padEnd(gridReferenceData.eastings.length, '0');
    const cornerEastingNumber: number = +cornerEasting;
    const cornerNorthingFromGridReference = northingsFromFromGridReference(cornerGridReference);
    const cornerNorthing = `${gridReferenceData.column}${cornerNorthingFromGridReference}`.padEnd(gridReferenceData.northings.length, '0');
    const cornerNorthingNumber: number = +cornerNorthing;
    try {
        const cornerPoint = new Point(cornerEastingNumber, cornerNorthingNumber);
        const cornerLatLng: LatLng = map.options.crs.unproject(cornerPoint);
        return {cornerGridReference, cornerEastingNumber, cornerNorthingNumber, cornerPoint, cornerLatLng};
    } catch (e) {
        log.error("failed to create point from cornerEasting", cornerEasting, "cornerEastingNumber:", cornerEastingNumber, "cornerNorthing:", cornerNorthing, "cornerNorthingNumber:", cornerNorthingNumber, "e:", e);
        return {cornerGridReference, cornerEastingNumber, cornerNorthingNumber};
    }
}

export function calculateGridSquareCorners(gridReferenceData: GridReferenceData): GridSquareCorners {
    const gridReference = gridReferenceData.gridReference;
    const eastings = eastingsFromGridReference(gridReference);
    const northings = northingsFromFromGridReference(gridReference);
    const eastingFloor = Math.floor(+eastings / 100) * 100;
    const northingFloor = Math.floor(+northings / 100) * 100;
    const eastingCeil = eastingFloor + 100;
    const northingCeil = northingFloor + 100;

    return {
        northWest: `${(gridReferenceData.gridCode)} ${eastingFloor.toString().padStart(4, '0')} ${northingCeil.toString().padStart(4, '0')}`,
        northEast: `${(gridReferenceData.gridCode)} ${eastingCeil.toString().padStart(4, '0')} ${northingCeil.toString().padStart(4, '0')}`,
        southEast: `${(gridReferenceData.gridCode)} ${eastingCeil.toString().padStart(4, '0')} ${northingFloor.toString().padStart(4, '0')}`,
        southWest: `${(gridReferenceData.gridCode)} ${eastingFloor.toString().padStart(4, '0')} ${northingFloor.toString().padStart(4, '0')}`
    };
}

export function calculateGridReferenceSquare(map: L.Map, gridReferenceData: GridReferenceData, cornerGridReferences: GridSquareCorners): LatLng[] {
    const gridSquareCornerLatLongs: GridReferenceTransform[] = Object.entries(cornerGridReferences).map((cornerGridReference: [string, string]) => transformGridReference(cornerGridReference[1], gridReferenceData, map));
    const gridSquareLatLongs: LatLng[] = gridSquareCornerLatLongs.map(item => item.cornerLatLng).filter(item => !isNaN(item));
    log.info("given gridReferenceData:", gridReferenceData.gridReference, "cornerGridReferences:", cornerGridReferences, "gridSquareCornerLatLongs:", gridSquareCornerLatLongs, "gridSquareLatLongs:", gridSquareLatLongs);
    return gridSquareLatLongs;
}
