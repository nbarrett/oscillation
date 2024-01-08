import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import tileLayerData from "./tileLayerData";
import { Legend } from "./Legend";
import { PolylineWithData } from "./Polyline";

const center: LatLngExpression = [52.22977, 21.01178];

export function MapWithDescription() {

    const [map, setMap] = useState<L.Map>();

    useEffect(() => {
        console.log("MapWrapper:map:", map);
    }, [map]);

    return (
        <MapContainer
            ref={(map: L.Map) => {
                // if (map) {
                setMap(map);
                // }
            }}
            center={center}
            zoom={18}
            scrollWheelZoom={false}>
            <TileLayer {...tileLayerData} />
            <Legend map={map as L.Map}/>
        </MapContainer>
    );
}

