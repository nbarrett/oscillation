import { HasAuditTimestamps } from "./common-models";
import * as L from "leaflet";
import { LatLngTuple } from "leaflet";

export interface UserData extends HasAuditTimestamps {
    avatarUrl?: string;
    firstName?: string;
    lastName?: string;
    userName?: string;
    mobile?: string;
    phone?: string;
}

export interface UserRoles extends HasAuditTimestamps {
    systemAccess?: boolean;
    accountSettings?: boolean;
}

export interface AccessTokenResponse {
    access_token: string;
    expires_in: string;
    issued_at: string;
    token_type: string;
}

export enum MapLayer {
    LEISURE_27700 = "LEISURE_27700",
    LIGHT_27700 = "LIGHT_27700",
    LIGHT_3857 = "LIGHT_3857",
    OUTDOOR_27700 = "OUTDOOR_27700",
    OUTDOOR_3857 = "OUTDOOR_3857",
    ROAD_27700 = "ROAD_27700",
    ROAD_3857 = "ROAD_3857",
}

export enum ProjectionValue {
    ESPG_27700 = "EPSG:27700",
    ESPG_3857 = "EPSG:3857",
}

export interface MapLayerAttributes {
    name: string;
    displayName: string;
    style: string;
    renders: boolean;
    minZoom: number;
    maxZoom: number;
    layerParameters: LayerParameters;
}

export interface LayerParameters {
    service: string;
    request: string;
    version: string;
    height: number;
    width: number;
    outputFormat: string;
    style: string;
    layer: string;
    tileMatrixSet: ProjectionValue;
    tileMatrix: string;
    tileRow: string;
    tileCol: string;
}

export const MapLayers: { [key in MapLayer]: MapLayerAttributes } = {
    LEISURE_27700: {
        name: MapLayer.LEISURE_27700,
        displayName: "Leisure 27700",
        style: "Leisure",
        minZoom: 0,
        maxZoom: 8,
        renders: false,
        layerParameters: {
            service: "WMTS",
            request: "GetTile",
            version: "2.0.0",
            height: 256,
            width: 256,
            outputFormat: "image/png",
            style: "default",
            layer: "Leisure_27700",
            tileMatrixSet: ProjectionValue.ESPG_27700,
            tileMatrix: "{z}",
            tileRow: "{y}",
            tileCol: "{x}"
        }
    },
    LIGHT_27700: {
        name: MapLayer.LIGHT_27700,
        displayName: "Light 27700",
        style: "Light",
        minZoom: 0,
        maxZoom: 8,
        renders: false,
        layerParameters: {
            service: "WMTS",
            request: "GetTile",
            version: "2.0.0",
            height: 256,
            width: 256,
            outputFormat: "image/png",
            style: "default",
            layer: "Light_27700",
            tileMatrixSet: ProjectionValue.ESPG_27700,
            tileMatrix: "{z}",
            tileRow: "{y}",
            tileCol: "{x}"
        }
    },
    LIGHT_3857: {
        name: MapLayer.LIGHT_3857,
        displayName: "Light 3857",
        style: "Light",
        minZoom: 7,
        maxZoom: 20,
        renders: true,
        layerParameters: {
            service: "WMTS",
            request: "GetTile",
            version: "2.0.0",
            height: 256,
            width: 256,
            outputFormat: "image/png",
            style: "default",
            layer: "Light_3857",
            tileMatrixSet: ProjectionValue.ESPG_3857,
            tileMatrix: "{z}",
            tileRow: "{y}",
            tileCol: "{x}"
        }
    },
    OUTDOOR_27700: {
        name: MapLayer.OUTDOOR_27700,
        displayName: "Outdoor 27700",
        style: "Outdoor",
        minZoom: 0,
        maxZoom: 8,
        renders: true,
        layerParameters: {
            service: "WMTS",
            request: "GetTile",
            version: "2.0.0",
            height: 256,
            width: 256,
            outputFormat: "image/png",
            style: "default",
            layer: "Outdoor_27700",
            tileMatrixSet: ProjectionValue.ESPG_27700,
            tileMatrix: "{z}",
            tileRow: "{y}",
            tileCol: "{x}"
        }
    },
    OUTDOOR_3857: {
        name: MapLayer.OUTDOOR_3857,
        displayName: "Outdoor 3857",
        style: "Outdoor",
        minZoom: 7,
        maxZoom: 20,
        renders: true,
        layerParameters: {
            service: "WMTS",
            request: "GetTile",
            version: "2.0.0",
            height: 256,
            width: 256,
            outputFormat: "image/png",
            style: "default",
            layer: "Outdoor_3857",
            tileMatrixSet: ProjectionValue.ESPG_3857,
            tileMatrix: "{z}",
            tileRow: "{y}",
            tileCol: "{x}"
        }
    },
    ROAD_27700: {
        name: MapLayer.ROAD_27700,
        displayName: "Road 27700",
        style: "Road",
        minZoom: 0,
        maxZoom: 8,
        renders: true,
        layerParameters: {
            service: "WMTS",
            request: "GetTile",
            version: "2.0.0",
            height: 256,
            width: 256,
            outputFormat: "image/png",
            style: "default",
            layer: "Road_27700",
            tileMatrixSet: ProjectionValue.ESPG_27700,
            tileMatrix: "{z}",
            tileRow: "{y}",
            tileCol: "{x}"
        }
    },
    ROAD_3857: {
        name: MapLayer.ROAD_3857,
        displayName: "Outdoor 3857",
        style: "Outdoor",
        minZoom: 7,
        maxZoom: 20,
        renders: true,
        layerParameters: {
            service: "WMTS",
            request: "GetTile",
            version: "2.0.0",
            height: 256,
            width: 256,
            outputFormat: "image/png",
            style: "default",
            layer: "Outdoor_3857",
            tileMatrixSet: ProjectionValue.ESPG_3857,
            tileMatrix: "{z}",
            tileRow: "{y}",
            tileCol: "{x}"
        }
    }
};


export interface MapOptions {
    crs: L.Proj.CRS;
    maxZoom: number;
    attributionControl: boolean;
    center: LatLngTuple;
    minZoom: number;
    zoom: number;
    maxBounds: LatLngTuple[];
}
