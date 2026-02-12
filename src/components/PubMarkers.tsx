"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { colours, log } from "@/lib/utils";
import { usePubStore, PUB_ICON_OPTIONS } from "@/stores/pub-store";
import { api } from "@/lib/trpc/client";

const MAX_VISIBLE_MARKERS = 200;
const BOUNDS_EXPANSION = 0.3;
const DEBOUNCE_MS = 500;
const ICON_SIZE = 24;

function buildIcon(svgTemplate: string): L.DivIcon {
  const coloured = svgTemplate
    .replace(/currentColor/g, colours.osMapsPurple)
    .replace(/<svg /, `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" `);

  return L.divIcon({
    html: coloured,
    className: "pub-marker-icon",
    iconSize: [ICON_SIZE, ICON_SIZE],
    iconAnchor: [ICON_SIZE / 2, ICON_SIZE / 2],
  });
}

function expandBounds(bounds: L.LatLngBounds, factor: number) {
  const latSpan = bounds.getNorth() - bounds.getSouth();
  const lngSpan = bounds.getEast() - bounds.getWest();
  const latPad = latSpan * factor;
  const lngPad = lngSpan * factor;
  return {
    south: bounds.getSouth() - latPad,
    west: bounds.getWest() - lngPad,
    north: bounds.getNorth() + latPad,
    east: bounds.getEast() + lngPad,
  };
}

export default function PubMarkers() {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);
  const trpcUtils = api.useUtils();

  const { pubs, showPubs, pubIconStyle, setPubs, setFetchedBounds, boundsContainedByFetched } = usePubStore();

  const icon = useMemo(() => {
    const option = PUB_ICON_OPTIONS.find((o) => o.style === pubIconStyle) ?? PUB_ICON_OPTIONS[0]!;
    return buildIcon(option.svg);
  }, [pubIconStyle]);

  const renderMarkers = useCallback(() => {
    if (!layerRef.current || !map) return;

    layerRef.current.clearLayers();

    if (!showPubs) return;

    const mapBounds = map.getBounds();
    const visible = pubs
      .filter((pub) => mapBounds.contains([pub.lat, pub.lng]))
      .slice(0, MAX_VISIBLE_MARKERS);

    for (const pub of visible) {
      const marker = L.marker([pub.lat, pub.lng], { icon });
      if (pub.name) {
        marker.bindTooltip(pub.name);
      }
      layerRef.current.addLayer(marker);
    }

    log.debug("PubMarkers: rendered", visible.length, "of", pubs.length, "pubs");
  }, [map, pubs, showPubs, icon]);

  const fetchPubs = useCallback(async () => {
    if (!map || fetchingRef.current) return;

    const mapBounds = map.getBounds();
    const expanded = expandBounds(mapBounds, BOUNDS_EXPANSION);

    if (boundsContainedByFetched(expanded)) {
      renderMarkers();
      return;
    }

    fetchingRef.current = true;
    try {
      const result = await trpcUtils.pubs.inBounds.fetch(expanded);
      setPubs(result);
      setFetchedBounds(expanded);
      log.debug("PubMarkers: fetched", result.length, "pubs");
    } catch (err) {
      log.error("PubMarkers: failed to fetch pubs", err);
    } finally {
      fetchingRef.current = false;
    }
  }, [map, trpcUtils, setPubs, setFetchedBounds, boundsContainedByFetched, renderMarkers]);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchPubs();
    }, DEBOUNCE_MS);
  }, [fetchPubs]);

  useEffect(() => {
    if (!map) return;

    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }

    void fetchPubs();

    map.on("moveend", debouncedFetch);
    map.on("zoomend", debouncedFetch);

    return () => {
      map.off("moveend", debouncedFetch);
      map.off("zoomend", debouncedFetch);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (layerRef.current) {
        layerRef.current.clearLayers();
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, debouncedFetch, fetchPubs]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  return null;
}
