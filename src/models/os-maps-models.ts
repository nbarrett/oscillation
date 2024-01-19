import { HasAuditTimestamps } from "./common-models";

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

export interface MapLayerAttributes {
    name: string;
    displayName: string;
    style: string;
    projection: string;
    layerName: string;
    tileMatrixSet: string;
    renders: boolean;
    minZoom: number;
    maxZoom: number;
}

export const MapLayers: { [key in MapLayer]: MapLayerAttributes } = {
    LEISURE_27700: {
        name: MapLayer.LEISURE_27700,
        displayName: "Leisure 27700",
        style: "Leisure",
        projection: "EPSG:27700",
        layerName: "Leisure_027700",
        tileMatrixSet: "EPSG:27700",
        minZoom: 0,
        maxZoom: 13,
        renders: false
    },
    LIGHT_27700: {
        name: MapLayer.LIGHT_27700,
        displayName: "Light 27700",
        style: "Light",
        projection: "EPSG:27700",
        layerName: "Light_27700",
        tileMatrixSet: "EPSG:27700",
        minZoom: 0,
        maxZoom: 13,
        renders: false
    },
    LIGHT_3857: {
        name: MapLayer.LIGHT_3857,
        displayName: "Light 3857",
        style: "Light",
        projection: "EPSG:3857",
        layerName: "Light_3857",
        tileMatrixSet: "EPSG:3857",
        minZoom: 7,
        maxZoom: 20,
        renders: true
    },
    OUTDOOR_27700: {
        name: MapLayer.OUTDOOR_27700,
        displayName: "Outdoor 3857",
        style: "Outdoor",
        projection: "EPSG:3857",
        layerName: "Outdoor_3857",
        tileMatrixSet: "EPSG:3857",
        minZoom: 7,
        maxZoom: 20,
        renders: true
    },
    OUTDOOR_3857: {
        name: MapLayer.OUTDOOR_3857,
        displayName: "Outdoor 3857",
        style: "Outdoor",
        projection: "EPSG:3857",
        layerName: "Outdoor_3857",
        tileMatrixSet: "EPSG:3857",
        minZoom: 7,
        maxZoom: 20,
        renders: true
    },
    ROAD_27700: {
        name: MapLayer.ROAD_27700,
        displayName: "Road 3857",
        style: "Road",
        projection: "EPSG:3857",
        layerName: "Road_3857",
        tileMatrixSet: "EPSG:3857",
        minZoom: 7,
        maxZoom: 20,
        renders: true
    },
    ROAD_3857: {
        name: MapLayer.ROAD_3857,
        displayName: "Outdoor 3857",
        style: "Outdoor",
        projection: "EPSG:3857",
        layerName: "Outdoor_3857",
        tileMatrixSet: "EPSG:3857",
        minZoom: 7,
        maxZoom: 20,
        renders: true
    }
};
