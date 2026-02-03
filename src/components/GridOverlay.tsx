'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import proj4 from 'proj4';
import { colours, log } from '@/lib/utils';

// Define the British National Grid projection
const BNG_PROJ = '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 +units=m +no_defs';
const WGS84 = 'EPSG:4326';

// Convert lat/lng to OS Grid coordinates
function latLngToOSGrid(lat: number, lng: number): { easting: number; northing: number } {
  const [easting, northing] = proj4(WGS84, BNG_PROJ, [lng, lat]);
  return { easting, northing };
}

// Convert OS Grid coordinates to lat/lng
function osGridToLatLng(easting: number, northing: number): { lat: number; lng: number } {
  const [lng, lat] = proj4(BNG_PROJ, WGS84, [easting, northing]);
  return { lat, lng };
}

export default function GridOverlay() {
  const map = useMap();
  const gridLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create a layer group to hold grid lines
    if (!gridLayerRef.current) {
      gridLayerRef.current = L.layerGroup().addTo(map);
    }

    const drawGrid = () => {
      if (!gridLayerRef.current) return;

      // Clear existing grid lines
      gridLayerRef.current.clearLayers();

      const bounds = map.getBounds();

      // Convert map bounds to OS Grid coordinates
      const sw = latLngToOSGrid(bounds.getSouth(), bounds.getWest());
      const ne = latLngToOSGrid(bounds.getNorth(), bounds.getEast());

      // Grid spacing: 1km (1000m) for 6-figure grid refs
      const gridSpacing = 1000;

      // Calculate grid line positions (rounded to nearest km)
      const startX = Math.floor(sw.easting / gridSpacing) * gridSpacing;
      const endX = Math.ceil(ne.easting / gridSpacing) * gridSpacing;
      const startY = Math.floor(sw.northing / gridSpacing) * gridSpacing;
      const endY = Math.ceil(ne.northing / gridSpacing) * gridSpacing;

      const gridLineStyle: L.PolylineOptions = {
        color: colours.osMapsPurple,
        weight: 1,
        opacity: 0.6,
        interactive: false,
      };

      // Draw vertical lines (constant easting)
      for (let x = startX; x <= endX; x += gridSpacing) {
        const southPoint = osGridToLatLng(x, sw.northing);
        const northPoint = osGridToLatLng(x, ne.northing);

        const line = L.polyline(
          [[southPoint.lat, southPoint.lng], [northPoint.lat, northPoint.lng]],
          gridLineStyle
        );
        gridLayerRef.current.addLayer(line);
      }

      // Draw horizontal lines (constant northing)
      for (let y = startY; y <= endY; y += gridSpacing) {
        const westPoint = osGridToLatLng(sw.easting, y);
        const eastPoint = osGridToLatLng(ne.easting, y);

        const line = L.polyline(
          [[westPoint.lat, westPoint.lng], [eastPoint.lat, eastPoint.lng]],
          gridLineStyle
        );
        gridLayerRef.current.addLayer(line);
      }

      log.debug('Grid drawn:', Math.ceil((endX - startX) / gridSpacing), 'vertical x', Math.ceil((endY - startY) / gridSpacing), 'horizontal lines');
    };

    // Draw grid initially and on map move/zoom
    drawGrid();
    map.on('moveend', drawGrid);
    map.on('zoomend', drawGrid);

    return () => {
      map.off('moveend', drawGrid);
      map.off('zoomend', drawGrid);
      if (gridLayerRef.current) {
        gridLayerRef.current.clearLayers();
        map.removeLayer(gridLayerRef.current);
        gridLayerRef.current = null;
      }
    };
  }, [map]);

  return null;
}
