import { LatLngTuple } from "leaflet";

export const defaultZoom = 7;

export enum Profile {
    DRIVING_CAR = "driving-car",
    DRIVING_HGV = "driving-hgv",
    CYCLING_REGULAR = "cycling-regular",
    CYCLING_ROAD = "cycling-road",
    CYCLING_MOUNTAIN = "cycling-mountain",
    CYCLING_ELECTRIC = "cycling-electric",
    FOOT_WALKING = "foot-walking",
    FOOT_HIKING = "foot-hiking",
    WHEELCHAIR = "wheelchair",
}

export enum MappingProvider {
    OPEN_STREET_MAPS = "OPEN_STREET_MAPS",
    OS_MAPS_ZXY = "OS_MAPS_ZXY",
    OS_MAPS_WMTS = "OS_MAPS_WMTS",

}


export interface RouteDirectionsRequest {
    profile: Profile;
    start: LatLngTuple;
    end: LatLngTuple;
}


export interface SerializableRouteDirectionsRequest extends RouteDirectionsRequest {
    toJSON: () => string;
}

export interface Step {
    duration: number;
    distance: number;
    instruction: string;
    name: string;
    type: number;
    way_points: number[];
}


export interface DirectionsResponse {
    type: string;
    metadata: {
        engine: { build_date: string; graph_date: string; version: string };
        service: string;
        query: { profile: string; coordinates: number[][]; format: string };
        attribution: string;
        timestamp: number
    };
    bbox: number[];
    features: {
        bbox: number[];
        geometry: {
            coordinates: number[][];
            type: string;
        };
        type: string;
        properties: {
            summary: { duration: number; distance: number };
            fare: number;
            transfers: number;
            segments: {
                duration: number;
                distance: number;
                steps: Step[];
            }[];
            way_points: number[]
        }
    }[];
}

const response: DirectionsResponse = {
    "type": "FeatureCollection",
    "metadata": {
        "attribution": "openrouteservice.org | OpenStreetMap contributors",
        "service": "routing",
        "timestamp": 1704677223771,
        "query": {
            "coordinates": [
                [
                    8.681495,
                    49.41461
                ],
                [
                    8.687872,
                    49.420318
                ]
            ],
            "profile": "driving-car",
            "format": "json"
        },
        "engine": {
            "version": "7.1.0",
            "build_date": "2023-12-10T05:30:50Z",
            "graph_date": "2024-01-07T13:38:10Z"
        }
    },
    "bbox": [
        8.681423,
        49.414599,
        8.690123,
        49.420514
    ],
    "features": [
        {
            "bbox": [
                8.681423,
                49.414599,
                8.690123,
                49.420514
            ],
            "type": "Feature",
            "properties": {
                "transfers": 0,
                "fare": 0,
                "segments": [
                    {
                        "distance": 1408.8,
                        "duration": 281.9,
                        "steps": [
                            {
                                "distance": 1.8,
                                "duration": 0.4,
                                "type": 11,
                                "instruction": "Head west on Gerhart-Hauptmann-Straße",
                                "name": "Gerhart-Hauptmann-Straße",
                                "way_points": [
                                    0,
                                    1
                                ]
                            },
                            {
                                "distance": 313.8,
                                "duration": 75.3,
                                "type": 1,
                                "instruction": "Turn right onto Wielandtstraße",
                                "name": "Wielandtstraße",
                                "way_points": [
                                    1,
                                    6
                                ]
                            },
                            {
                                "distance": 500.8,
                                "duration": 76.4,
                                "type": 1,
                                "instruction": "Turn right onto Mönchhofstraße",
                                "name": "Mönchhofstraße",
                                "way_points": [
                                    6,
                                    15
                                ]
                            },
                            {
                                "distance": 251.9,
                                "duration": 60.5,
                                "type": 0,
                                "instruction": "Turn left onto Erwin-Rohde-Straße",
                                "name": "Erwin-Rohde-Straße",
                                "way_points": [
                                    15,
                                    19
                                ]
                            },
                            {
                                "distance": 126.8,
                                "duration": 30.4,
                                "type": 1,
                                "instruction": "Turn right onto Moltkestraße",
                                "name": "Moltkestraße",
                                "way_points": [
                                    19,
                                    20
                                ]
                            },
                            {
                                "distance": 83,
                                "duration": 7.5,
                                "type": 2,
                                "instruction": "Turn sharp left onto Handschuhsheimer Landstraße, B 3",
                                "name": "Handschuhsheimer Landstraße, B 3",
                                "way_points": [
                                    20,
                                    22
                                ]
                            },
                            {
                                "distance": 130.6,
                                "duration": 31.4,
                                "type": 0,
                                "instruction": "Turn left onto Roonstraße",
                                "name": "Roonstraße",
                                "way_points": [
                                    22,
                                    23
                                ]
                            },
                            {
                                "distance": 0,
                                "duration": 0,
                                "type": 10,
                                "instruction": "Arrive at Roonstraße, straight ahead",
                                "name": "-",
                                "way_points": [
                                    23,
                                    23
                                ]
                            }
                        ]
                    }
                ],
                "way_points": [
                    0,
                    23
                ],
                "summary": {
                    "distance": 1408.8,
                    "duration": 281.9
                }
            },
            "geometry": {
                "coordinates": [
                    [
                        8.681495,
                        49.414599
                    ],
                    [
                        8.68147,
                        49.414599
                    ],
                    [
                        8.681488,
                        49.41465
                    ],
                    [
                        8.681423,
                        49.415746
                    ],
                    [
                        8.681656,
                        49.41659
                    ],
                    [
                        8.681826,
                        49.417081
                    ],
                    [
                        8.681881,
                        49.417392
                    ],
                    [
                        8.682461,
                        49.417389
                    ],
                    [
                        8.682676,
                        49.417387
                    ],
                    [
                        8.683595,
                        49.417372
                    ],
                    [
                        8.68536,
                        49.417365
                    ],
                    [
                        8.686407,
                        49.417365
                    ],
                    [
                        8.68703,
                        49.41736
                    ],
                    [
                        8.687467,
                        49.417351
                    ],
                    [
                        8.688212,
                        49.417358
                    ],
                    [
                        8.688802,
                        49.417381
                    ],
                    [
                        8.68871,
                        49.418194
                    ],
                    [
                        8.688647,
                        49.418465
                    ],
                    [
                        8.688539,
                        49.418964
                    ],
                    [
                        8.688398,
                        49.41963
                    ],
                    [
                        8.690123,
                        49.419833
                    ],
                    [
                        8.689854,
                        49.420217
                    ],
                    [
                        8.689653,
                        49.420514
                    ],
                    [
                        8.687871,
                        49.420322
                    ]
                ],
                "type": "LineString"
            }
        }
    ]
};
