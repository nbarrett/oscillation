'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { log } from '@/lib/utils';

interface LegendProps {
  map: L.Map | null;
}

export default function Legend({ map }: LegendProps) {
  useEffect(() => {
    if (!map) return;

    const legend = new L.Control({ position: 'bottomleft' });

    legend.onAdd = () => {
      const div = L.DomUtil.create('div', 'description');
      L.DomEvent.disableClickPropagation(div);
      div.innerHTML = `
        <b>Map Instructions</b>
        <div>Roll the dice, then drag your car to move across the grid squares.</div>
      `;
      div.style.cssText = 'background: white; padding: 10px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
      return div;
    };

    legend.addTo(map);
    log.debug('legend:added to map');

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}
