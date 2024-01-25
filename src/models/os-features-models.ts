import { LatLngTuple } from "leaflet";

export enum GeometryType {
    FEATURE = "Feature"
}

export const EMPTY_GEOJSON_OBJECT = {
    type: "FeatureCollection",
    features: []
}

export interface GeoJsonObject {
    type: string;
    features: Feature[]
}

export interface Feature {
    type: string | GeometryType;
    geometry: Geometry;
    properties: Properties;
}

export interface Geometry {
    type: string;
    coordinates: LatLngTuple[][];
}

export interface Properties {
    GmlID: string;
    OBJECTID: number;
    Type: string;
    Name: string;
    Number: string;
    Level: number;
    SHAPE_Length: number;
}


export interface Data {
    data: Feature[];
}

const data: Feature[] = [
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18689445,
                        52.182697
                    ],
                    [
                        0.18651534,
                        52.18272201
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741142",
            "OBJECTID": 2741142,
            "Type": "Minor",
            "Name": "Cambridge Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 26.07680962
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19016963,
                        52.18247394
                    ],
                    [
                        0.19006754,
                        52.18248033
                    ],
                    [
                        0.18993621,
                        52.18248987
                    ],
                    [
                        0.18946135,
                        52.18252224
                    ],
                    [
                        0.18689445,
                        52.182697
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741146",
            "OBJECTID": 2741146,
            "Type": "Minor",
            "Name": "Cambridge Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 225.36451506
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18759992,
                        52.18514778
                    ],
                    [
                        0.18780186,
                        52.1851131
                    ],
                    [
                        0.18810263,
                        52.18491339
                    ],
                    [
                        0.18827601,
                        52.18476504
                    ],
                    [
                        0.18855877,
                        52.18455621
                    ],
                    [
                        0.18886417,
                        52.18444489
                    ],
                    [
                        0.18948277,
                        52.18438108
                    ],
                    [
                        0.19011654,
                        52.18436419
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741148",
            "OBJECTID": 2741148,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 205.732311
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19011654,
                        52.18436419
                    ],
                    [
                        0.19026038,
                        52.18414166
                    ],
                    [
                        0.19023512,
                        52.1840148
                    ],
                    [
                        0.18996061,
                        52.18387044
                    ],
                    [
                        0.18917538,
                        52.18387432
                    ],
                    [
                        0.18905348,
                        52.18361742
                    ],
                    [
                        0.18905282,
                        52.183616
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741149",
            "OBJECTID": 2741149,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 149.20686996
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19018638,
                        52.18300822
                    ],
                    [
                        0.19012696,
                        52.18299574
                    ],
                    [
                        0.18981758,
                        52.18293071
                    ],
                    [
                        0.18952049,
                        52.18293695
                    ],
                    [
                        0.18930825,
                        52.18296121
                    ],
                    [
                        0.18913198,
                        52.18307131
                    ],
                    [
                        0.18913474,
                        52.18334498
                    ],
                    [
                        0.18913485,
                        52.18334723
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741150",
            "OBJECTID": 2741150,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 109.63480682
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19018638,
                        52.18300822
                    ],
                    [
                        0.19014559,
                        52.18280341
                    ],
                    [
                        0.1901485,
                        52.18269896
                    ],
                    [
                        0.19016963,
                        52.18247394
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741156",
            "OBJECTID": 2741156,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 59.65596468
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19052635,
                        52.18396947
                    ],
                    [
                        0.19018638,
                        52.18300822
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741157",
            "OBJECTID": 2741157,
            "Type": "Restricted",
            "Name": "The Drive",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 109.44478105
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19441945,
                        52.18426473
                    ],
                    [
                        0.19420436,
                        52.18424904
                    ],
                    [
                        0.194016,
                        52.18423537
                    ],
                    [
                        0.19376847,
                        52.1842174
                    ],
                    [
                        0.19335798,
                        52.18421738
                    ],
                    [
                        0.19302276,
                        52.18421894
                    ],
                    [
                        0.19280702,
                        52.18421674
                    ],
                    [
                        0.19242058,
                        52.18421493
                    ],
                    [
                        0.19203976,
                        52.18421131
                    ],
                    [
                        0.19177002,
                        52.18420877
                    ],
                    [
                        0.19113138,
                        52.1841593
                    ],
                    [
                        0.19052635,
                        52.18396947
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741159",
            "OBJECTID": 2741159,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 271.98688072
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19107574,
                        52.18548785
                    ],
                    [
                        0.19090985,
                        52.18529472
                    ],
                    [
                        0.19086549,
                        52.18500554
                    ],
                    [
                        0.19081997,
                        52.18470749
                    ],
                    [
                        0.19081546,
                        52.18468725
                    ],
                    [
                        0.19066515,
                        52.18431992
                    ],
                    [
                        0.19065374,
                        52.18429307
                    ],
                    [
                        0.19052635,
                        52.18396947
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2741160",
            "OBJECTID": 2741160,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 174.46459055
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19016963,
                        52.18247394
                    ],
                    [
                        0.19027901,
                        52.18246714
                    ],
                    [
                        0.19890847,
                        52.18197563
                    ],
                    [
                        0.20164171,
                        52.18181173
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742648",
            "OBJECTID": 2742648,
            "Type": "Minor",
            "Name": "Cambridge Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 788.05326341
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18482385,
                        52.1841242
                    ],
                    [
                        0.18457103,
                        52.18415928
                    ],
                    [
                        0.18411627,
                        52.18421418
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742759",
            "OBJECTID": 2742759,
            "Type": "Local",
            "Name": "Teasel Way",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 49.41975494
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18651534,
                        52.18272201
                    ],
                    [
                        0.18621489,
                        52.18274016
                    ],
                    [
                        0.18592756,
                        52.18275763
                    ],
                    [
                        0.18562876,
                        52.18277674
                    ],
                    [
                        0.18512998,
                        52.18281062
                    ],
                    [
                        0.18476417,
                        52.18293384
                    ],
                    [
                        0.1846071,
                        52.18302128
                    ],
                    [
                        0.18448213,
                        52.18307709
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742762",
            "OBJECTID": 2742762,
            "Type": "Minor",
            "Name": "Cambridge Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 148.84431661
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18482385,
                        52.1841242
                    ],
                    [
                        0.18482385,
                        52.18412411
                    ],
                    [
                        0.18481024,
                        52.18408237
                    ],
                    [
                        0.18457929,
                        52.18337609
                    ],
                    [
                        0.18451003,
                        52.18317181
                    ],
                    [
                        0.18448213,
                        52.18307709
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742763",
            "OBJECTID": 2742763,
            "Type": "Minor",
            "Name": "Yarrow Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 118.82249585
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18528609,
                        52.18650333
                    ],
                    [
                        0.18528678,
                        52.18630567
                    ],
                    [
                        0.1851993,
                        52.18541707
                    ],
                    [
                        0.18483946,
                        52.18416815
                    ],
                    [
                        0.18482385,
                        52.1841242
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742765",
            "OBJECTID": 2742765,
            "Type": "Minor",
            "Name": "Yarrow Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 267.15598718
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18689445,
                        52.182697
                    ],
                    [
                        0.1869012,
                        52.18275694
                    ],
                    [
                        0.18694661,
                        52.18316363
                    ],
                    [
                        0.18686914,
                        52.18323349
                    ],
                    [
                        0.18681549,
                        52.18328188
                    ],
                    [
                        0.18573319,
                        52.18425843
                    ],
                    [
                        0.18577967,
                        52.18472291
                    ],
                    [
                        0.18594882,
                        52.18489063
                    ],
                    [
                        0.18617203,
                        52.18496742
                    ],
                    [
                        0.18759992,
                        52.18514778
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742773",
            "OBJECTID": 2742773,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 390.33990701
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18651937,
                        52.18021597
                    ],
                    [
                        0.18647369,
                        52.18020009
                    ],
                    [
                        0.18635597,
                        52.18015911
                    ],
                    [
                        0.18646562,
                        52.18008631
                    ],
                    [
                        0.18651662,
                        52.18005254
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742779",
            "OBJECTID": 2742779,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 29.0069288
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18651534,
                        52.18272201
                    ],
                    [
                        0.18651937,
                        52.18021597
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742780",
            "OBJECTID": 2742780,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 278.8151445
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18651662,
                        52.18005254
                    ],
                    [
                        0.1864817,
                        52.1798327
                    ],
                    [
                        0.18643277,
                        52.17952409
                    ],
                    [
                        0.18639276,
                        52.17927188
                    ],
                    [
                        0.18650454,
                        52.17900714
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742781",
            "OBJECTID": 2742781,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 117.6963035
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18651937,
                        52.18021597
                    ],
                    [
                        0.18651662,
                        52.18005254
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742782",
            "OBJECTID": 2742782,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 18.18356401
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15336682,
                        52.17770221
                    ],
                    [
                        0.1544003,
                        52.17776489
                    ],
                    [
                        0.15545075,
                        52.17770973
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742800",
            "OBJECTID": 2742800,
            "Type": "Local",
            "Name": "Topcliffe Way",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 143.14247911
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15370082,
                        52.17357825
                    ],
                    [
                        0.15426548,
                        52.17439245
                    ],
                    [
                        0.15442195,
                        52.17444336
                    ],
                    [
                        0.15479541,
                        52.17435093
                    ],
                    [
                        0.15497443,
                        52.17437518
                    ],
                    [
                        0.1553813,
                        52.17492581
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742801",
            "OBJECTID": 2742801,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 217.94772556
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15370082,
                        52.17357825
                    ],
                    [
                        0.15545251,
                        52.17333628
                    ],
                    [
                        0.16366747,
                        52.1723311
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742802",
            "OBJECTID": 2742802,
            "Type": "Minor",
            "Name": "Worts' Causeway",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 695.77914641
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15418776,
                        52.17639295
                    ],
                    [
                        0.15470973,
                        52.17616499
                    ],
                    [
                        0.15481143,
                        52.17603886
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742803",
            "OBJECTID": 2742803,
            "Type": "Local",
            "Name": "Almoners' Avenue",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 59.45593353
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15491785,
                        52.1769731
                    ],
                    [
                        0.1545528,
                        52.17668303
                    ],
                    [
                        0.15418776,
                        52.17639295
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742804",
            "OBJECTID": 2742804,
            "Type": "Local",
            "Name": "Almoners' Avenue",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 81.60882305
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15481143,
                        52.17603886
                    ],
                    [
                        0.15490938,
                        52.17595326
                    ],
                    [
                        0.15466998,
                        52.17584784
                    ],
                    [
                        0.15455604,
                        52.1756752
                    ],
                    [
                        0.15476941,
                        52.17554154
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742805",
            "OBJECTID": 2742805,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 73.35037257
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15491785,
                        52.1769731
                    ],
                    [
                        0.15566386,
                        52.17667172
                    ],
                    [
                        0.15658277,
                        52.17661894
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742806",
            "OBJECTID": 2742806,
            "Type": "Local",
            "Name": "Beaumont Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 124.1842065
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15545075,
                        52.17770973
                    ],
                    [
                        0.15530143,
                        52.17734377
                    ],
                    [
                        0.15491785,
                        52.1769731
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742807",
            "OBJECTID": 2742807,
            "Type": "Local",
            "Name": "Almoners' Avenue",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 90.85358136
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15539073,
                        52.17888882
                    ],
                    [
                        0.15532054,
                        52.17982449
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742808",
            "OBJECTID": 2742808,
            "Type": "Local",
            "Name": "Almoners' Avenue",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 104.20911764
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15542443,
                        52.17837564
                    ],
                    [
                        0.15539073,
                        52.17888882
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742809",
            "OBJECTID": 2742809,
            "Type": "Local",
            "Name": "Almoners' Avenue",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 57.14017851
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15542443,
                        52.17837564
                    ],
                    [
                        0.15729502,
                        52.17834143
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742810",
            "OBJECTID": 2742810,
            "Type": "Local",
            "Name": "Netherhall Way",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 128
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15542443,
                        52.17837564
                    ],
                    [
                        0.15545075,
                        52.17770973
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742811",
            "OBJECTID": 2742811,
            "Type": "Local",
            "Name": "Almoners' Avenue",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 74.10802925
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15840814,
                        52.17655857
                    ],
                    [
                        0.15658277,
                        52.17661894
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742812",
            "OBJECTID": 2742812,
            "Type": "Local",
            "Name": "Beaumont Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 125.03599482
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15658277,
                        52.17661894
                    ],
                    [
                        0.15686292,
                        52.17727026
                    ],
                    [
                        0.15702671,
                        52.17733021
                    ],
                    [
                        0.15832471,
                        52.17725251
                    ],
                    [
                        0.1583943,
                        52.17717929
                    ],
                    [
                        0.15840814,
                        52.17655857
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742813",
            "OBJECTID": 2742813,
            "Type": "Local",
            "Name": "Beaumont Crescent",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 255.69290926
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15729502,
                        52.17834143
                    ],
                    [
                        0.15722842,
                        52.17998824
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742814",
            "OBJECTID": 2742814,
            "Type": "Local",
            "Name": "Chalk Grove",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 183.27302038
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16035899,
                        52.17788069
                    ],
                    [
                        0.15818604,
                        52.17831614
                    ],
                    [
                        0.15729502,
                        52.17834143
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742815",
            "OBJECTID": 2742815,
            "Type": "Local",
            "Name": "Netherhall Way",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 217.32838041
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16035899,
                        52.17788069
                    ],
                    [
                        0.16007026,
                        52.17735543
                    ],
                    [
                        0.15968621,
                        52.17697579
                    ],
                    [
                        0.15902799,
                        52.17667312
                    ],
                    [
                        0.15840814,
                        52.17655857
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742816",
            "OBJECTID": 2742816,
            "Type": "Local",
            "Name": "Beaumont Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 211.91866094
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.15878539,
                        52.18012161
                    ],
                    [
                        0.15886441,
                        52.17907382
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742817",
            "OBJECTID": 2742817,
            "Type": "Local",
            "Name": "Heron's Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 116.69758566
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16035899,
                        52.17788069
                    ],
                    [
                        0.16055873,
                        52.1783806
                    ],
                    [
                        0.16064243,
                        52.17890062
                    ],
                    [
                        0.16057794,
                        52.18028661
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742818",
            "OBJECTID": 2742818,
            "Type": "Local",
            "Name": "Beaumont Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 269.67181451
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16276904,
                        52.16906358
                    ],
                    [
                        0.16308469,
                        52.17086885
                    ],
                    [
                        0.163547,
                        52.17213908
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742819",
            "OBJECTID": 2742819,
            "Type": "Minor",
            "Name": "Cherry Hinton Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 346.8190123
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.163547,
                        52.17213908
                    ],
                    [
                        0.16386903,
                        52.17208461
                    ],
                    [
                        0.16510842,
                        52.1721284
                    ],
                    [
                        0.16820359,
                        52.17165788
                    ],
                    [
                        0.17023409,
                        52.17143834
                    ],
                    [
                        0.17235815,
                        52.17120014
                    ],
                    [
                        0.17546296,
                        52.17099003
                    ],
                    [
                        0.17806821,
                        52.17097251
                    ],
                    [
                        0.17878167,
                        52.17078848
                    ],
                    [
                        0.17965655,
                        52.17043599
                    ],
                    [
                        0.18001618,
                        52.17037359
                    ],
                    [
                        0.18167434,
                        52.17054795
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742820",
            "OBJECTID": 2742820,
            "Type": "Minor",
            "Name": "Worts' Causeway",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 1271.64257248
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16366747,
                        52.1723311
                    ],
                    [
                        0.163547,
                        52.17213908
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742821",
            "OBJECTID": 2742821,
            "Type": "Minor",
            "Name": "Limekiln Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 22.89803485
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16366747,
                        52.1723311
                    ],
                    [
                        0.16408129,
                        52.17290262
                    ],
                    [
                        0.16425959,
                        52.17332199
                    ],
                    [
                        0.16470252,
                        52.17675918
                    ],
                    [
                        0.16492049,
                        52.17703997
                    ],
                    [
                        0.16529957,
                        52.17725314
                    ],
                    [
                        0.16603218,
                        52.17757465
                    ],
                    [
                        0.16722312,
                        52.17826729
                    ],
                    [
                        0.16810921,
                        52.17964481
                    ],
                    [
                        0.16947335,
                        52.18152609
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742822",
            "OBJECTID": 2742822,
            "Type": "Minor",
            "Name": "Limekiln Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 1138.8487318
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16661962,
                        52.17947481
                    ],
                    [
                        0.16632708,
                        52.17937264
                    ],
                    [
                        0.16598828,
                        52.17934469
                    ],
                    [
                        0.1657464,
                        52.17917127
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742823",
            "OBJECTID": 2742823,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 71.80891585
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16661962,
                        52.17947481
                    ],
                    [
                        0.1665284,
                        52.17923199
                    ],
                    [
                        0.16643885,
                        52.17908985
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742824",
            "OBJECTID": 2742824,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 44.68575049
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18167434,
                        52.17054795
                    ],
                    [
                        0.18126203,
                        52.16933577
                    ],
                    [
                        0.18130682,
                        52.16920203
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742825",
            "OBJECTID": 2742825,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 152.97227744
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18167434,
                        52.17054795
                    ],
                    [
                        0.18403257,
                        52.1708622
                    ],
                    [
                        0.18667641,
                        52.17151598
                    ],
                    [
                        0.18797143,
                        52.17185571
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742826",
            "OBJECTID": 2742826,
            "Type": "Minor",
            "Name": "Shelford Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 456.32613751
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18797143,
                        52.17185571
                    ],
                    [
                        0.18818759,
                        52.17305991
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742827",
            "OBJECTID": 2742827,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 134.7885648
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18797143,
                        52.17185571
                    ],
                    [
                        0.19487706,
                        52.17364282
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742828",
            "OBJECTID": 2742828,
            "Type": "Minor",
            "Name": "Shelford Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 512.52655434
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.19487706,
                        52.17364282
                    ],
                    [
                        0.19489729,
                        52.17353993
                    ],
                    [
                        0.19528027,
                        52.1732981
                    ],
                    [
                        0.19527643,
                        52.17313092
                    ],
                    [
                        0.193905,
                        52.1713737
                    ],
                    [
                        0.19283247,
                        52.17000657
                    ],
                    [
                        0.19274197,
                        52.16999207
                    ],
                    [
                        0.19244916,
                        52.17003608
                    ],
                    [
                        0.19125916,
                        52.17030044
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2742829",
            "OBJECTID": 2742829,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 566.98440905
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.1753308,
                        52.18434963
                    ],
                    [
                        0.1753368,
                        52.18477215
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2744437",
            "OBJECTID": 2744437,
            "Type": "Local",
            "Name": "Headington Drive",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 47.01063709
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17897116,
                        52.18214864
                    ],
                    [
                        0.17914687,
                        52.18213415
                    ],
                    [
                        0.18006035,
                        52.18208192
                    ],
                    [
                        0.18023637,
                        52.18211266
                    ],
                    [
                        0.18032766,
                        52.18257344
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745398",
            "OBJECTID": 2745398,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 139.0266434
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17897116,
                        52.18214864
                    ],
                    [
                        0.17879469,
                        52.18215064
                    ],
                    [
                        0.17761147,
                        52.18217007
                    ],
                    [
                        0.17500669,
                        52.18236104
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745399",
            "OBJECTID": 2745399,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 272.42634042
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17897116,
                        52.18214864
                    ],
                    [
                        0.17899028,
                        52.18225547
                    ],
                    [
                        0.17909773,
                        52.18292125
                    ],
                    [
                        0.17911744,
                        52.18303734
                    ],
                    [
                        0.17912443,
                        52.18307848
                    ],
                    [
                        0.17913866,
                        52.18316302
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745400",
            "OBJECTID": 2745400,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 113.43741136
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17518958,
                        52.18325519
                    ],
                    [
                        0.17512645,
                        52.18286069
                    ],
                    [
                        0.17542611,
                        52.18284716
                    ],
                    [
                        0.17579788,
                        52.18283032
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745401",
            "OBJECTID": 2745401,
            "Type": "Local",
            "Name": "Tweedale",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 90.14561217
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17658864,
                        52.18332334
                    ],
                    [
                        0.1765589,
                        52.18311266
                    ],
                    [
                        0.17653169,
                        52.18304383
                    ],
                    [
                        0.17632176,
                        52.18302262
                    ],
                    [
                        0.17628397,
                        52.18294967
                    ],
                    [
                        0.17626373,
                        52.18282271
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745402",
            "OBJECTID": 2745402,
            "Type": "Local",
            "Name": "Limedale Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 68.66827447
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17775453,
                        52.18325379
                    ],
                    [
                        0.17774285,
                        52.18317037
                    ],
                    [
                        0.17770488,
                        52.18289933
                    ],
                    [
                        0.17741473,
                        52.18288913
                    ],
                    [
                        0.17694098,
                        52.18292657
                    ],
                    [
                        0.17699114,
                        52.18322265
                    ],
                    [
                        0.17700392,
                        52.18329858
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745403",
            "OBJECTID": 2745403,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 133.73597447
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18448213,
                        52.18307709
                    ],
                    [
                        0.18434023,
                        52.18302936
                    ],
                    [
                        0.1837889,
                        52.18290738
                    ],
                    [
                        0.18260726,
                        52.18295327
                    ],
                    [
                        0.1817687,
                        52.1830062
                    ],
                    [
                        0.18140644,
                        52.18302909
                    ],
                    [
                        0.17961158,
                        52.18313557
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745404",
            "OBJECTID": 2745404,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 337.98476298
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17937161,
                        52.18314945
                    ],
                    [
                        0.17961158,
                        52.18313557
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745405",
            "OBJECTID": 2745405,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 16.48347657
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17961158,
                        52.18313557
                    ],
                    [
                        0.17943924,
                        52.18316816
                    ],
                    [
                        0.17937161,
                        52.18314945
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745406",
            "OBJECTID": 2745406,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 17.40314993
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17518958,
                        52.18325519
                    ],
                    [
                        0.17580428,
                        52.18321606
                    ],
                    [
                        0.17593347,
                        52.18320756
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745407",
            "OBJECTID": 2745407,
            "Type": "Local",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 51.14916807
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17937161,
                        52.18314945
                    ],
                    [
                        0.17913866,
                        52.18316302
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745408",
            "OBJECTID": 2745408,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 16.00318093
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17913866,
                        52.18316302
                    ],
                    [
                        0.17874628,
                        52.18318924
                    ],
                    [
                        0.17796268,
                        52.1832414
                    ],
                    [
                        0.17775453,
                        52.18325379
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745409",
            "OBJECTID": 2745409,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 95.19727806
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17447473,
                        52.18329535
                    ],
                    [
                        0.17518958,
                        52.18325519
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745410",
            "OBJECTID": 2745410,
            "Type": "Local",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 49.09175083
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17775453,
                        52.18325379
                    ],
                    [
                        0.17700392,
                        52.18329858
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745411",
            "OBJECTID": 2745411,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 51.57485046
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17700392,
                        52.18329858
                    ],
                    [
                        0.17658864,
                        52.18332334
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745412",
            "OBJECTID": 2745412,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 28.53332963
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17658864,
                        52.18332334
                    ],
                    [
                        0.17617962,
                        52.18334725
                    ],
                    [
                        0.17607532,
                        52.1833534
                    ],
                    [
                        0.17605694,
                        52.18335446
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745413",
            "OBJECTID": 2745413,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 36.52697157
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17605694,
                        52.18335446
                    ],
                    [
                        0.17615474,
                        52.18353268
                    ],
                    [
                        0.17620551,
                        52.18360467
                    ],
                    [
                        0.17622768,
                        52.18363627
                    ],
                    [
                        0.17632859,
                        52.18377954
                    ],
                    [
                        0.17660502,
                        52.18377228
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745414",
            "OBJECTID": 2745414,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 69.77588922
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17605694,
                        52.18335446
                    ],
                    [
                        0.17588321,
                        52.18336459
                    ],
                    [
                        0.17534276,
                        52.18339624
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745415",
            "OBJECTID": 2745415,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 49.06316407
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17534276,
                        52.18339624
                    ],
                    [
                        0.17449724,
                        52.1834568
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745416",
            "OBJECTID": 2745416,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 58.21511831
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17534276,
                        52.18339624
                    ],
                    [
                        0.17548601,
                        52.18393312
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745417",
            "OBJECTID": 2745417,
            "Type": "Local",
            "Name": "Headington Drive",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 60.5309838
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18411627,
                        52.18421418
                    ],
                    [
                        0.18402249,
                        52.18379329
                    ],
                    [
                        0.18383125,
                        52.18347311
                    ],
                    [
                        0.18332359,
                        52.18342145
                    ],
                    [
                        0.18306833,
                        52.18347536
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745418",
            "OBJECTID": 2745418,
            "Type": "Local",
            "Name": "Coltsfoot Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 138.86288872
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17548601,
                        52.18393312
                    ],
                    [
                        0.17598251,
                        52.18391497
                    ],
                    [
                        0.17620613,
                        52.18400076
                    ],
                    [
                        0.17633434,
                        52.18452893
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745419",
            "OBJECTID": 2745419,
            "Type": "Local",
            "Name": "Headington Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 111.45626219
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18096781,
                        52.18384983
                    ],
                    [
                        0.1803919,
                        52.18384142
                    ],
                    [
                        0.17723188,
                        52.18403578
                    ],
                    [
                        0.17711758,
                        52.18409184
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745420",
            "OBJECTID": 2745420,
            "Type": "Local",
            "Name": "Malletts Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 266.58402823
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17548601,
                        52.18393312
                    ],
                    [
                        0.17549346,
                        52.18408585
                    ],
                    [
                        0.1753308,
                        52.18434963
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745421",
            "OBJECTID": 2745421,
            "Type": "Local",
            "Name": "Headington Drive",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 48.38470965
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18096781,
                        52.18384983
                    ],
                    [
                        0.1809475,
                        52.18450762
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745422",
            "OBJECTID": 2745422,
            "Type": "Local",
            "Name": "Bridewell Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 73.19808877
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18257677,
                        52.18414377
                    ],
                    [
                        0.18247984,
                        52.18395673
                    ],
                    [
                        0.18232633,
                        52.18385715
                    ],
                    [
                        0.18230359,
                        52.18385298
                    ],
                    [
                        0.18213751,
                        52.18383717
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745423",
            "OBJECTID": 2745423,
            "Type": "Local",
            "Name": "Harebell Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 50.21900948
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17711758,
                        52.18409184
                    ],
                    [
                        0.17733965,
                        52.18474417
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745424",
            "OBJECTID": 2745424,
            "Type": "Local",
            "Name": "Leete Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 74.14849965
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18257677,
                        52.18414377
                    ],
                    [
                        0.18297228,
                        52.18410668
                    ],
                    [
                        0.18304073,
                        52.18420478
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745425",
            "OBJECTID": 2745425,
            "Type": "Local",
            "Name": "Harebell Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 39.23634683
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18335159,
                        52.18469431
                    ],
                    [
                        0.18284901,
                        52.1846243
                    ],
                    [
                        0.18257448,
                        52.18439559
                    ],
                    [
                        0.18257677,
                        52.18414377
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745426",
            "OBJECTID": 2745426,
            "Type": "Local",
            "Name": "Harebell Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 94.8821774
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.1753308,
                        52.18434963
                    ],
                    [
                        0.17480925,
                        52.18432229
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745427",
            "OBJECTID": 2745427,
            "Type": "Local",
            "Name": "Headington Drive",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 35.7967275
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.18411627,
                        52.18421418
                    ],
                    [
                        0.18358474,
                        52.18441286
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745428",
            "OBJECTID": 2745428,
            "Type": "Local",
            "Name": "Teasel Way",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 42.54409477
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17428873,
                        52.184364
                    ],
                    [
                        0.17415455,
                        52.18437528
                    ],
                    [
                        0.17365203,
                        52.18445307
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745538",
            "OBJECTID": 2745538,
            "Type": "Local",
            "Name": "The Orchards",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 44.70090446
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16839853,
                        52.1834882
                    ],
                    [
                        0.16807524,
                        52.18345817
                    ],
                    [
                        0.16551034,
                        52.18279492
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745551",
            "OBJECTID": 2745551,
            "Type": "Local",
            "Name": "Greystoke Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 212.66306258
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16637743,
                        52.18374116
                    ],
                    [
                        0.16687218,
                        52.18368711
                    ],
                    [
                        0.16725031,
                        52.18454341
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745552",
            "OBJECTID": 2745552,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 133.08244711
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16694095,
                        52.17981107
                    ],
                    [
                        0.16661962,
                        52.17947481
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745554",
            "OBJECTID": 2745554,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 43.3880744
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16711549,
                        52.18014579
                    ],
                    [
                        0.1666525,
                        52.17990449
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745555",
            "OBJECTID": 2745555,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 41.51446615
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16694095,
                        52.17981107
                    ],
                    [
                        0.1669394,
                        52.17958053
                    ],
                    [
                        0.16687901,
                        52.17936133
                    ],
                    [
                        0.16694555,
                        52.17916542
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745556",
            "OBJECTID": 2745556,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 72.64901122
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16711549,
                        52.18014579
                    ],
                    [
                        0.16694095,
                        52.17981107
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745557",
            "OBJECTID": 2745557,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 39.10663371
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16781402,
                        52.18068265
                    ],
                    [
                        0.16771434,
                        52.18060598
                    ],
                    [
                        0.1675364,
                        52.18046933
                    ],
                    [
                        0.16729464,
                        52.1802835
                    ],
                    [
                        0.16725559,
                        52.18025355
                    ],
                    [
                        0.16711549,
                        52.18014579
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745558",
            "OBJECTID": 2745558,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 76.48606831
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16781402,
                        52.18068265
                    ],
                    [
                        0.16770067,
                        52.18036703
                    ],
                    [
                        0.16737623,
                        52.17989766
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745559",
            "OBJECTID": 2745559,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 92.69912392
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16781402,
                        52.18068265
                    ],
                    [
                        0.16863082,
                        52.18129565
                    ],
                    [
                        0.16872404,
                        52.18136551
                    ],
                    [
                        0.16893371,
                        52.18152298
                    ],
                    [
                        0.16910109,
                        52.18157466
                    ],
                    [
                        0.16932799,
                        52.18154801
                    ],
                    [
                        0.16938617,
                        52.18154118
                    ],
                    [
                        0.16947335,
                        52.18152609
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745560",
            "OBJECTID": 2745560,
            "Type": "Restricted",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 159.7064994
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16849181,
                        52.1845026
                    ],
                    [
                        0.16836663,
                        52.18420015
                    ],
                    [
                        0.16811784,
                        52.18403289
                    ],
                    [
                        0.16802562,
                        52.18386346
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745561",
            "OBJECTID": 2745561,
            "Type": "Local",
            "Name": "null",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 79.81261035
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16839853,
                        52.1834882
                    ],
                    [
                        0.16867515,
                        52.18413081
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745562",
            "OBJECTID": 2745562,
            "Type": "Local",
            "Name": "Glenacre Close",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 73.95643177
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16912707,
                        52.18282735
                    ],
                    [
                        0.16878015,
                        52.18330691
                    ],
                    [
                        0.16874012,
                        52.18335899
                    ],
                    [
                        0.16839853,
                        52.1834882
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745563",
            "OBJECTID": 2745563,
            "Type": "Local",
            "Name": "Greystoke Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 92.22847767
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17151767,
                        52.18391672
                    ],
                    [
                        0.17140439,
                        52.18393356
                    ],
                    [
                        0.17114479,
                        52.18398591
                    ],
                    [
                        0.17066283,
                        52.18409549
                    ],
                    [
                        0.16960409,
                        52.18429599
                    ],
                    [
                        0.16922359,
                        52.18436801
                    ],
                    [
                        0.16915633,
                        52.18438076
                    ],
                    [
                        0.16849181,
                        52.1845026
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745564",
            "OBJECTID": 2745564,
            "Type": "Minor",
            "Name": "Cherry Hinton Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 217.02498438
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17007869,
                        52.18312529
                    ],
                    [
                        0.16912707,
                        52.18282735
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745565",
            "OBJECTID": 2745565,
            "Type": "Minor",
            "Name": "Queen Edith's Way",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 73.03622389
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.16947335,
                        52.18152609
                    ],
                    [
                        0.17019357,
                        52.18279873
                    ],
                    [
                        0.17023024,
                        52.18295093
                    ],
                    [
                        0.17007869,
                        52.18312529
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745568",
            "OBJECTID": 2745568,
            "Type": "Minor",
            "Name": "Limekiln Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 189.02441383
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17151767,
                        52.18391672
                    ],
                    [
                        0.17140787,
                        52.18385796
                    ],
                    [
                        0.17122525,
                        52.18374289
                    ],
                    [
                        0.17097135,
                        52.18359704
                    ],
                    [
                        0.17007869,
                        52.18312529
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745569",
            "OBJECTID": 2745569,
            "Type": "Minor",
            "Name": "Queen Edith's Way",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 132.11627369
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17449724,
                        52.1834568
                    ],
                    [
                        0.17296954,
                        52.18364565
                    ],
                    [
                        0.17254314,
                        52.18371817
                    ],
                    [
                        0.17236348,
                        52.183748
                    ],
                    [
                        0.1718871,
                        52.18385165
                    ],
                    [
                        0.17159436,
                        52.18390533
                    ],
                    [
                        0.17151767,
                        52.18391672
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745571",
            "OBJECTID": 2745571,
            "Type": "Minor",
            "Name": "Fulbourn Road",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 210.39929212
        }
    },
    {
        "type": "Feature",
        "geometry": {
            "type": "MultiLineString",
            "coordinates": [
                [
                    [
                        0.17151767,
                        52.18391672
                    ],
                    [
                        0.17162673,
                        52.18397514
                    ],
                    [
                        0.17183,
                        52.18408479
                    ],
                    [
                        0.17194091,
                        52.18414515
                    ],
                    [
                        0.17233671,
                        52.1844498
                    ],
                    [
                        0.17248271,
                        52.18474385
                    ]
                ]
            ]
        },
        "properties": {
            "GmlID": "Zoomstack_RoadsLocal.2745572",
            "OBJECTID": 2745572,
            "Type": "Minor",
            "Name": "High Street",
            "Number": "null",
            "Level": 0,
            "SHAPE_Length": 116.09975455
        }
    }
];
