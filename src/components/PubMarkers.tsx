"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { log } from "@/lib/utils";
import { usePubStore } from "@/stores/pub-store";
import { PUB_ICON_OPTIONS, POI_COLOURS } from "@/stores/poi-icons";
import { usePoiSettingsStore } from "@/stores/poi-settings-store";
import { useCurrentPlayer } from "@/stores/game-store";
import { api } from "@/lib/trpc/client";
import { latLngToGridKey, gridHasABRoad } from "@/lib/road-data";

const MAX_VISIBLE_MARKERS = 200;
const BOUNDS_EXPANSION = 0.3;
const DEBOUNCE_MS = 500;
const ICON_SIZE = 48;
const POI_RADIUS_METRES = 10_000;

function buildIcon(svgTemplate: string): L.DivIcon {
  const coloured = svgTemplate
    .replace(/currentColor/g, POI_COLOURS.pub)
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
  const iconDetailMode = usePoiSettingsStore((s) => s.iconDetailMode);
  const currentPlayer = useCurrentPlayer();

  const icon = useMemo(() => {
    const option = PUB_ICON_OPTIONS.find((o) => o.style === pubIconStyle) ?? PUB_ICON_OPTIONS[0]!;
    const svgSource = iconDetailMode === "simple" ? option.simpleSvg : option.svg;
    return buildIcon(svgSource);
  }, [pubIconStyle, iconDetailMode]);

  const renderMarkers = useCallback(() => {
    if (!layerRef.current || !map) return;

    layerRef.current.clearLayers();

    if (!showPubs) return;

    const playerLatLng = currentPlayer
      ? L.latLng(currentPlayer.position[0], currentPlayer.position[1])
      : null;

    const mapBounds = map.getBounds();
    const visible = pubs
      .filter((pub) => {
        if (!mapBounds.contains([pub.lat, pub.lng])) return false;
        if (!gridHasABRoad(latLngToGridKey(pub.lat, pub.lng))) return false;
        if (playerLatLng) {
          return playerLatLng.distanceTo(L.latLng(pub.lat, pub.lng)) <= POI_RADIUS_METRES;
        }
        return true;
      })
      .slice(0, MAX_VISIBLE_MARKERS);

    for (const pub of visible) {
      const marker = L.marker([pub.lat, pub.lng], { icon });
      if (pub.name) {
        marker.bindTooltip(pub.name);
      }
      layerRef.current.addLayer(marker);
    }

    log.debug("PubMarkers: rendered", visible.length, "of", pubs.length, "pubs");
  }, [map, pubs, showPubs, icon, currentPlayer]);

  const fetchPubs = useCallback(async () => {
    if (!map || fetchingRef.current) return;

    const mapBounds = map.getBounds();
    const expanded = expandBounds(mapBounds, BOUNDS_EXPANSION);

    if (boundsContainedByFetched(expanded)) {
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
  }, [map, trpcUtils, setPubs, setFetchedBounds, boundsContainedByFetched]);

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
