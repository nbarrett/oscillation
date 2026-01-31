"use client";

import { useState, useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useGameStore } from "@/stores/game-store";
import { formatLatLong, colours, log } from "@/lib/utils";

const clickIcon = new L.DivIcon({
  className: "click-marker",
  html: `<div style="
    width: 20px;
    height: 20px;
    background: ${colours.osMapsPurple};
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  );
  const data = await response.json();

  if (data.address) {
    const { road, hamlet, village, town, city, suburb, county } = data.address;
    const parts: string[] = [];

    if (road) parts.push(road);
    if (hamlet) parts.push(hamlet);
    if (village) parts.push(village);
    if (suburb) parts.push(suburb);
    if (town) parts.push(town);
    if (city) parts.push(city);

    if (parts.length === 0 && county) {
      parts.push(county);
    }

    return parts.slice(0, 3).join(", ") || "Unknown Location";
  }
  return "Unknown Location";
}

export default function ClickPositionMarker() {
  const { mapClickPosition } = useGameStore();
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (mapClickPosition?.latLng) {
      setIsLoading(true);
      setLocationName(null);
      reverseGeocode(mapClickPosition.latLng.lat, mapClickPosition.latLng.lng)
        .then((name) => {
          setLocationName(name);
          setIsLoading(false);
        })
        .catch((error) => {
          log.error("Failed to reverse geocode:", error);
          setLocationName("Unknown Location");
          setIsLoading(false);
        });
    }
  }, [mapClickPosition?.latLng?.lat, mapClickPosition?.latLng?.lng]);

  if (!mapClickPosition?.latLng) {
    return null;
  }

  return (
    <Marker position={[mapClickPosition.latLng.lat, mapClickPosition.latLng.lng]} icon={clickIcon}>
      <Popup>
        <div style={{ textAlign: "center", minWidth: "150px" }}>
          <strong>{isLoading ? "Loading..." : locationName}</strong>
          <br />
          <span style={{ fontSize: "0.85em", color: "#666" }}>
            {formatLatLong(mapClickPosition.latLng)}
          </span>
          <br />
          <span style={{ fontSize: "0.75em", color: "#999", marginTop: "4px", display: "block" }}>
            Right-click to add as starting point
          </span>
        </div>
      </Popup>
    </Marker>
  );
}
