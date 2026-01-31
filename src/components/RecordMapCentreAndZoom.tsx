'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { useGameStore } from '@/stores/game-store';
import { log, formatLatLong } from '@/lib/utils';

export default function RecordMapCentreAndZoom() {
  const map = useMap();
  const { setMapZoom, setMapCentre } = useGameStore();

  useEffect(() => {
    if (!map) {
      log.debug('map not yet initialised');
      return;
    }

    const handleMoveEnd = () => {
      const zoom = map.getZoom();
      const center = map.getCenter();
      log.debug(`map centre is ${formatLatLong({ lat: center.lat, lng: center.lng })} setting zoom to: ${zoom}`);
      setMapZoom(zoom);
      setMapCentre([center.lat, center.lng]);
    };

    map.on('dragend zoomend', handleMoveEnd);

    return () => {
      map.off('dragend zoomend', handleMoveEnd);
    };
  }, [map, setMapZoom, setMapCentre]);

  return null;
}
