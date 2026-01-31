import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export enum MapLayer {
  LEISURE_27700 = 'LEISURE_27700',
  LIGHT_27700 = 'LIGHT_27700',
  LIGHT_3857 = 'LIGHT_3857',
  OUTDOOR_27700 = 'OUTDOOR_27700',
  OUTDOOR_3857 = 'OUTDOOR_3857',
  ROAD_27700 = 'ROAD_27700',
  ROAD_3857 = 'ROAD_3857',
}

export enum MappingProvider {
  OPEN_STREET_MAPS = 'OPEN_STREET_MAPS',
  OS_MAPS_ZXY = 'OS_MAPS_ZXY',
  OS_MAPS_WMTS = 'OS_MAPS_WMTS',
}

export enum ProjectionValue {
  ESPG_27700 = 'EPSG:27700',
  ESPG_3857 = 'EPSG:3857',
}

export interface AccessTokenResponse {
  access_token: string;
  expires_in: string;
  issued_at: string;
  token_type: string;
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

export interface MapLayerAttributes {
  name: string;
  displayName: string;
  style: string;
  renders: boolean;
  minZoom: number;
  maxZoom: number;
  layerParameters: LayerParameters;
}

export const MapLayers: Record<MapLayer, MapLayerAttributes> = {
  LEISURE_27700: {
    name: MapLayer.LEISURE_27700,
    displayName: 'Leisure 27700',
    style: 'Leisure',
    minZoom: 0,
    maxZoom: 8,
    renders: false,
    layerParameters: {
      service: 'WMTS',
      request: 'GetTile',
      version: '2.0.0',
      height: 256,
      width: 256,
      outputFormat: 'image/png',
      style: 'default',
      layer: 'Leisure_27700',
      tileMatrixSet: ProjectionValue.ESPG_27700,
      tileMatrix: '{z}',
      tileRow: '{y}',
      tileCol: '{x}',
    },
  },
  LIGHT_27700: {
    name: MapLayer.LIGHT_27700,
    displayName: 'Light 27700',
    style: 'Light',
    minZoom: 0,
    maxZoom: 8,
    renders: false,
    layerParameters: {
      service: 'WMTS',
      request: 'GetTile',
      version: '2.0.0',
      height: 256,
      width: 256,
      outputFormat: 'image/png',
      style: 'default',
      layer: 'Light_27700',
      tileMatrixSet: ProjectionValue.ESPG_27700,
      tileMatrix: '{z}',
      tileRow: '{y}',
      tileCol: '{x}',
    },
  },
  LIGHT_3857: {
    name: MapLayer.LIGHT_3857,
    displayName: 'Light 3857',
    style: 'Light',
    minZoom: 7,
    maxZoom: 20,
    renders: true,
    layerParameters: {
      service: 'WMTS',
      request: 'GetTile',
      version: '2.0.0',
      height: 256,
      width: 256,
      outputFormat: 'image/png',
      style: 'default',
      layer: 'Light_3857',
      tileMatrixSet: ProjectionValue.ESPG_3857,
      tileMatrix: '{z}',
      tileRow: '{y}',
      tileCol: '{x}',
    },
  },
  OUTDOOR_27700: {
    name: MapLayer.OUTDOOR_27700,
    displayName: 'Outdoor 27700',
    style: 'Outdoor',
    minZoom: 0,
    maxZoom: 8,
    renders: true,
    layerParameters: {
      service: 'WMTS',
      request: 'GetTile',
      version: '2.0.0',
      height: 256,
      width: 256,
      outputFormat: 'image/png',
      style: 'default',
      layer: 'Outdoor_27700',
      tileMatrixSet: ProjectionValue.ESPG_27700,
      tileMatrix: '{z}',
      tileRow: '{y}',
      tileCol: '{x}',
    },
  },
  OUTDOOR_3857: {
    name: MapLayer.OUTDOOR_3857,
    displayName: 'Outdoor 3857',
    style: 'Outdoor',
    minZoom: 7,
    maxZoom: 20,
    renders: true,
    layerParameters: {
      service: 'WMTS',
      request: 'GetTile',
      version: '2.0.0',
      height: 256,
      width: 256,
      outputFormat: 'image/png',
      style: 'default',
      layer: 'Outdoor_3857',
      tileMatrixSet: ProjectionValue.ESPG_3857,
      tileMatrix: '{z}',
      tileRow: '{y}',
      tileCol: '{x}',
    },
  },
  ROAD_27700: {
    name: MapLayer.ROAD_27700,
    displayName: 'Road 27700',
    style: 'Road',
    minZoom: 0,
    maxZoom: 8,
    renders: true,
    layerParameters: {
      service: 'WMTS',
      request: 'GetTile',
      version: '2.0.0',
      height: 256,
      width: 256,
      outputFormat: 'image/png',
      style: 'default',
      layer: 'Road_27700',
      tileMatrixSet: ProjectionValue.ESPG_27700,
      tileMatrix: '{z}',
      tileRow: '{y}',
      tileCol: '{x}',
    },
  },
  ROAD_3857: {
    name: MapLayer.ROAD_3857,
    displayName: 'Road 3857',
    style: 'Road',
    minZoom: 7,
    maxZoom: 20,
    renders: true,
    layerParameters: {
      service: 'WMTS',
      request: 'GetTile',
      version: '2.0.0',
      height: 256,
      width: 256,
      outputFormat: 'image/png',
      style: 'default',
      layer: 'Road_3857',
      tileMatrixSet: ProjectionValue.ESPG_3857,
      tileMatrix: '{z}',
      tileRow: '{y}',
      tileCol: '{x}',
    },
  },
};

interface MapState {
  accessToken: AccessTokenResponse | null;
  mapLayer: MapLayer;
  mappingProvider: MappingProvider;
  customTileSelected: boolean;

  setAccessToken: (token: AccessTokenResponse | null) => void;
  setMapLayer: (layer: MapLayer) => void;
  setMappingProvider: (provider: MappingProvider) => void;
  setCustomTileSelected: (selected: boolean) => void;
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      accessToken: null,
      mapLayer: MapLayer.OUTDOOR_3857,
      mappingProvider: MappingProvider.OS_MAPS_WMTS,
      customTileSelected: true,

      setAccessToken: (accessToken) => set({ accessToken }),
      setMapLayer: (mapLayer) => set({ mapLayer }),
      setMappingProvider: (mappingProvider) => set({ mappingProvider }),
      setCustomTileSelected: (customTileSelected) => set({ customTileSelected }),
    }),
    {
      name: 'oscillation-map',
      partialize: (state) => ({
        mapLayer: state.mapLayer,
        mappingProvider: state.mappingProvider,
      }),
    }
  )
);
