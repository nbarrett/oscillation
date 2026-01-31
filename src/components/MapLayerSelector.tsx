'use client';

import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { TextField } from '@mui/material';
import { useMapStore, MapLayer, MapLayers, MappingProvider } from '@/stores/map-store';
import { log } from '@/lib/utils';

const mapLayerOptions = Object.values(MapLayer);

export default function MapLayerSelector() {
  const { mapLayer, mappingProvider, setMapLayer } = useMapStore();

  useEffect(() => {
    if (!mapLayer) {
      log.debug('MapLayerSelector:mapLayer:initialised to:', MapLayer.OUTDOOR_3857);
      setMapLayer(MapLayer.OUTDOOR_3857);
    }
  }, [mapLayer, setMapLayer]);

  useEffect(() => {
    log.debug('MapLayerSelector:mapLayer:', mapLayer);
  }, [mapLayer]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setMapLayer(event.target.value as MapLayer);
  }

  return (
    <TextField
      fullWidth
      disabled={mappingProvider === MappingProvider.OPEN_STREET_MAPS}
      sx={{ minWidth: 220 }}
      select
      size="small"
      label="Map Layer"
      value={mapLayer || ''}
      onChange={handleChange}
    >
      {mapLayerOptions.map((value) => {
        const attribute = MapLayers[value];
        return (
          <MenuItem key={attribute.name} value={attribute.name}>
            {attribute.displayName}
          </MenuItem>
        );
      })}
    </TextField>
  );
}
