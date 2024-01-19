import { atom, RecoilState } from "recoil";
import { StoredValue } from "../util/ui-stored-values";
import { log } from "../util/logging-config";
import { refreshAccessToken, refreshAccessTokenRaw } from "../data-services/os-maps-data-services";
import { AccessTokenResponse, MapLayer } from "../models/os-maps-models";
import { MappingProvider } from "../models/route-models";
import L from "leaflet";

export const accessTokenState: RecoilState<AccessTokenResponse> = atom({
    key: StoredValue.ACCESS_TOKEN,
    default: null,
    effects: [
        ({setSelf}) => {
            log.info("refreshAccessToken:querying");
            refreshAccessTokenRaw().then(refreshToken => {
                log.info("refreshAccessToken:returned:", refreshToken);
                setSelf(refreshToken);
            }).catch(log.error);
        },
    ]
});

export const mapLayerState: RecoilState<MapLayer> = atom({
    key: StoredValue.MAP_LAYER,
    default: null,
});

export const mapState: RecoilState<L.Map> = atom({
    key: StoredValue.MAR,
    default: null,
});

export const mappingProviderState: RecoilState<MappingProvider> = atom({
    key: StoredValue.MAPPING_PROVIDER,
    default: null,
});

