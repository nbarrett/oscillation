'use client';

import { Stack } from '@mui/material';
import { useGameStore } from '@/stores/game-store';
import { formatLatLong } from '@/lib/utils';

export default function MapPositions() {
  const { mapZoom, mapClickPosition, mapCentre } = useGameStore();

  return (
    <Stack direction="row" textAlign="center" alignItems="center" spacing={1}>
      <div>Zoom Level: {mapZoom || 'none'}</div>
      <div>Map click position: {mapClickPosition?.latLng ? formatLatLong(mapClickPosition.latLng) : ''}</div>
      <div>Map centre position: {mapCentre ? formatLatLong(mapCentre) : ''}</div>
    </Stack>
  );
}
