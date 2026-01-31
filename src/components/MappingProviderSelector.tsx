'use client';

import { useEffect } from 'react';
import MenuItem from '@mui/material/MenuItem';
import { TextField } from '@mui/material';
import { useMapStore, MappingProvider } from '@/stores/map-store';
import { asTitle, log } from '@/lib/utils';

const providerOptions = Object.values(MappingProvider);

export default function MappingProviderSelector() {
  const { mappingProvider, setMappingProvider } = useMapStore();

  useEffect(() => {
    log.debug('MappingProviderSelector:mappingProvider:', mappingProvider);
  }, [mappingProvider]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setMappingProvider(event.target.value as MappingProvider);
  }

  return (
    <TextField
      fullWidth
      sx={{ minWidth: 220 }}
      select
      size="small"
      label="Mapping Provider"
      value={mappingProvider || ''}
      onChange={handleChange}
    >
      {providerOptions.map((value) => (
        <MenuItem key={value} value={value}>
          {asTitle(value)}
        </MenuItem>
      ))}
    </TextField>
  );
}
