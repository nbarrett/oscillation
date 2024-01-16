import { HasAuditTimestamps } from "./common-models";
import { MapLayerAttributes } from "./route-models";

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

const data: AccessTokenResponse = {"access_token":"U0Yxps6hkrhFcGIBeOELvgH0TnKy","expires_in":"299","issued_at":"1705361308761","token_type":"Bearer"}

export enum MapLayer {
    LEISURE_27700 = "LEISURE_27700",
    LIGHT_27700 = "LIGHT_27700",
    LIGHT_3857 = "LIGHT_3857",
    OUTDOOR_27700 = "OUTDOOR_27700",
    OUTDOOR_3857 = "OUTDOOR_3857",
    ROAD_27700 = "ROAD_27700",
    ROAD_3857 = "ROAD_3857",
}

export const MapLayers: { [key in MapLayer]: MapLayerAttributes } = {
    LEISURE_27700: {
        name: MapLayer.LEISURE_27700,
        displayName: "Leisure 27700",
        urlPath: "Leisure_27700",
        renders: false
    },
    LIGHT_27700: {name: MapLayer.LIGHT_27700, displayName: "Light 27700", urlPath: "Light_27700", renders: false},
    LIGHT_3857: {name: MapLayer.LIGHT_3857, displayName: "Light 3857", urlPath: "Light_3857", renders: true},
    OUTDOOR_27700: {
        name: MapLayer.OUTDOOR_27700,
        displayName: "Outdoor 27700",
        urlPath: "Outdoor_27700",
        renders: false
    },
    OUTDOOR_3857: {name: MapLayer.OUTDOOR_3857, displayName: "Outdoor 3857", urlPath: "Outdoor_3857", renders: true},
    ROAD_27700: {name: MapLayer.ROAD_27700, displayName: "Road 27700", urlPath: "Road_27700", renders: false},
    ROAD_3857: {name: MapLayer.ROAD_3857, displayName: "Road 3857", urlPath: "Road_3857", renders: true},
};
