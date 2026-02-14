"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { log } from "@/lib/utils";
import { useErrorStore } from "@/stores/error-store";
import { usePoiSettingsStore } from "@/stores/poi-settings-store";
import { useCurrentPlayer } from "@/stores/game-store";
import { type PoiItem, type PoiIconOption, type FetchedBounds } from "@/stores/poi-types";
import { latLngToGridKey, gridHasRoad } from "@/lib/road-data";

const MAX_VISIBLE_MARKERS = 200;
const BOUNDS_EXPANSION = 0.3;
const DEBOUNCE_MS = 500;
const ICON_SIZE = 48;
const POI_RADIUS_METRES = 10_000;

function buildIcon(svgTemplate: string, colour: string): L.DivIcon {
  const coloured = svgTemplate
    .replace(/currentColor/g, colour)
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

interface PoiMarkersProps<T extends string> {
  label: string;
  colour: string;
  items: PoiItem[];
  show: boolean;
  iconStyle: T;
  iconOptions: PoiIconOption<T>[];
  fetchedBounds: FetchedBounds | null;
  boundsContainedByFetched: (bounds: FetchedBounds) => boolean;
  setItems: (items: PoiItem[]) => void;
  setFetchedBounds: (bounds: FetchedBounds) => void;
  fetchItems: (bounds: FetchedBounds) => Promise<PoiItem[]>;
}

export default function PoiMarkers<T extends string>({
  label,
  colour,
  items,
  show,
  iconStyle,
  iconOptions,
  boundsContainedByFetched,
  setItems,
  setFetchedBounds,
  fetchItems,
}: PoiMarkersProps<T>) {
  const map = useMap();
  const layerRef = useRef<L.LayerGroup | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);
  const addError = useErrorStore((s) => s.addError);
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode);
  const currentPlayer = useCurrentPlayer();

  const icon = useMemo(() => {
    const option = iconOptions.find((o) => o.style === iconStyle) ?? iconOptions[0]!;
    const svgSource = iconDetailMode === "simple" ? option.simpleSvg : option.svg;
    return buildIcon(svgSource, colour);
  }, [iconStyle, iconOptions, colour, iconDetailMode]);

  const renderMarkers = useCallback(() => {
    if (!layerRef.current || !map) return;

    layerRef.current.clearLayers();

    if (!show) return;

    const playerLatLng = currentPlayer
      ? L.latLng(currentPlayer.position[0], currentPlayer.position[1])
      : null;

    const mapBounds = map.getBounds();
    const visible = items
      .filter((item) => {
        if (!mapBounds.contains([item.lat, item.lng])) return false;
        if (!gridHasRoad(latLngToGridKey(item.lat, item.lng))) return false;
        if (playerLatLng) {
          return playerLatLng.distanceTo(L.latLng(item.lat, item.lng)) <= POI_RADIUS_METRES;
        }
        return true;
      })
      .slice(0, MAX_VISIBLE_MARKERS);

    for (const item of visible) {
      const marker = L.marker([item.lat, item.lng], { icon });
      if (item.name) {
        marker.bindTooltip(item.name);
      }
      layerRef.current.addLayer(marker);
    }

    log.debug(`${label}: rendered`, visible.length, "of", items.length);
  }, [map, items, show, icon, label, currentPlayer]);

  const fetchData = useCallback(async () => {
    if (!map || fetchingRef.current) return;

    const mapBounds = map.getBounds();
    const expanded = expandBounds(mapBounds, BOUNDS_EXPANSION);

    if (boundsContainedByFetched(expanded)) {
      return;
    }

    fetchingRef.current = true;
    try {
      const result = await fetchItems(expanded);
      setItems(result);
      setFetchedBounds(expanded);
      log.debug(`${label}: fetched`, result.length);
    } catch (err) {
      log.error(`${label}: failed to fetch`, err);
      addError(`Failed to load ${label.toLowerCase()} — the Overpass API may be busy. Try panning or zooming to retry.`);
    } finally {
      fetchingRef.current = false;
    }
  }, [map, fetchItems, setItems, setFetchedBounds, boundsContainedByFetched, addError, label]);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      void fetchData();
    }, DEBOUNCE_MS);
  }, [fetchData]);

  useEffect(() => {
    if (!map) return;

    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }

    void fetchData();

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
  }, [map, debouncedFetch, fetchData]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers]);

  useEffect(() => {
    if (!map) return;
    const onMove = () => renderMarkers();
    map.on("moveend", onMove);
    map.on("zoomend", onMove);
    return () => {
      map.off("moveend", onMove);
      map.off("zoomend", onMove);
    };
  }, [map, renderMarkers]);

  return null;
}
