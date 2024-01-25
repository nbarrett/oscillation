import { atom, RecoilState } from "recoil";
import { initialValueFor, saveValueFor, StoredValue } from "../util/ui-stored-values";
import { log } from "../util/logging-config";
import { refreshAccessTokenRaw } from "../data-services/os-maps-data-services";
import { AccessTokenResponse, MapLayer } from "../models/os-maps-models";
import { MappingProvider } from "../models/route-models";
import { enumForKey } from "../util/enums";

export const accessTokenState: RecoilState<AccessTokenResponse> = atom({
    key: StoredValue.ACCESS_TOKEN,
    default: null,
    effects: [
        ({setSelf}) => {
            log.debug("refreshAccessToken:querying");
            refreshAccessTokenRaw().then(refreshToken => {
                log.debug("refreshAccessToken:returned:", refreshToken);
                setSelf(refreshToken);
            }).catch(log.error);
        },
    ]
});

export const mapLayerState: RecoilState<MapLayer> = atom({
    key: StoredValue.MAP_LAYER,
    default: enumForKey(MapLayer, initialValueFor(StoredValue.MAP_LAYER)),
    effects: [
        ({onSet}) => {
            onSet(mapLayer => {
                log.debug(StoredValue.MAP_LAYER, "set to:", mapLayer);
                saveValueFor(StoredValue.MAP_LAYER, mapLayer);
            });
        },
    ],
});

export const mappingProviderState: RecoilState<MappingProvider> = atom({
    key: StoredValue.MAPPING_PROVIDER,
    default: enumForKey(MappingProvider, initialValueFor(StoredValue.MAPPING_PROVIDER, MappingProvider.OS_MAPS_WMTS)),
    effects: [
        ({onSet}) => {
            onSet(mappingProvider => {
                log.info(StoredValue.MAPPING_PROVIDER, "set to:", mappingProvider);
                saveValueFor(StoredValue.MAPPING_PROVIDER, mappingProvider);
            });
        },
    ],
});

export const customTileSelectedState = atom({
    key: StoredValue.CUSTOM_TILE_SELECTION,
    default: true,
});
