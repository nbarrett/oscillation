import { useRecoilValue } from "recoil";
import { mapLayerState, mappingProviderState } from "../atoms/os-maps-atoms";
import { MapLayer, MapLayerAttributes, MapLayers, ProjectionValue } from "../models/os-maps-models";
import { MappingProvider } from "../models/route-models";

export function useMapLayers() {

    const mapLayer: MapLayer = useRecoilValue<MapLayer>(mapLayerState);
    const mappingProvider: MappingProvider = useRecoilValue<MappingProvider>(mappingProviderState);
    const mapLayerAttributes: MapLayerAttributes = MapLayers[mapLayer];
    const useCustomTileLayer: boolean = mappingProvider !== MappingProvider.OPEN_STREET_MAPS && mapLayerAttributes?.layerParameters?.tileMatrixSet === ProjectionValue.ESPG_27700;

    return {mapLayerAttributes, useCustomTileLayer, mapLayer, mappingProvider};
}

