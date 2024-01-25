import { atom, RecoilState } from "recoil";
import { StoredValue } from "../util/ui-stored-values";
import { GeoJsonObject } from "../models/os-features-models";
import { LayerGroup } from "leaflet";

export const geoJsonFeaturesState: RecoilState<GeoJsonObject> = atom<GeoJsonObject>({
    key: StoredValue.GEOJSON_FEATURES,
    default: null,
});

export const layerGroupState: RecoilState<LayerGroup> = atom<LayerGroup>({
    key: StoredValue.LAYER_GROUP,
    default: null,
});

export const geoJsonFeaturesCapturedState: RecoilState<boolean> = atom<boolean>({
    key: StoredValue.GEOJSON_FEATURES_CAPTURED,
    default: false,
});

export const featuresRequestIndexState: RecoilState<number> = atom<number>({
    key: StoredValue.FEATURE_REQUEST_INDEX,
    default: 0,
});
