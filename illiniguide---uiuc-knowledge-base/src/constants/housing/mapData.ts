// Campus Landmarks for Map View
export interface Landmark {
    id: string;
    name: string;
    name_zh?: string;
    type: 'school' | 'library' | 'union' | 'gym' | 'store' | 'dining' | 'medical' | 'service';
    lat: number;
    lng: number;
    icon?: string;
}

export const CAMPUS_ZONES = {
    type: 'FeatureCollection' as const,
    features: [
        {
            id: 'VCNb8x6ZORk3AFTiDw51fY5SFyQF4zgm',
            type: 'Feature' as const,
            properties: {
                name: 'Green Street\nCampustown',
                name_zh: 'Green Street\nCampustown',
                description: 'Hub for dining, nightlife, and shopping',
                color: '#FFD600' // Vibrant Yellow
            },
            geometry: {
                coordinates: [
                    [
                        [
                            -88.242,
                            40.1108
                        ],
                        [
                            -88.22895854412525,
                            40.110856038945215
                        ],
                        [
                            -88.22895854412585,
                            40.109878455557684
                        ],
                        [
                            -88.242,
                            40.1098
                        ],
                        [
                            -88.242,
                            40.1108
                        ]
                    ]
                ],
                type: 'Polygon' as const
            }
        },
        {
            id: '0mt7Fb79iPbr49alvNDBPz6cGg7WD5BW',
            type: 'Feature' as const,
            properties: {
                name: 'Downtown\nChampaign',
                name_zh: 'Downtown\nChampaign',
                description: 'Historic district with upscale dining and cafes',
                color: '#00B0FF' // Vibrant Blue
            },
            geometry: {
                coordinates: [
                    [
                        [
                            -88.24511506363498,
                            40.11917960175619
                        ],
                        [
                            -88.23994985985199,
                            40.11815494461963
                        ],
                        [
                            -88.24102787304325,
                            40.11540563868034
                        ],
                        [
                            -88.24508352266375,
                            40.11540291453319
                        ],
                        [
                            -88.24511506363498,
                            40.11917960175619
                        ]
                    ]
                ],
                type: 'Polygon' as const
            }
        },
        {
            id: 'NhQsUa8pLb2hAQ8ry1QT5RkPSixigpD7',
            type: 'Feature' as const,
            properties: {
                name: 'Engineering\n(North)',
                name_zh: 'Engineering\n(North)',
                description: 'Grainger College of Engineering',
                color: '#FF3D00' // Vibrant Deep Orange
            },
            geometry: {
                coordinates: [
                    [
                        [
                            -88.2288700319404,
                            40.11623771862462
                        ],
                        [
                            -88.22579638404298,
                            40.11628021291715
                        ],
                        [
                            -88.22562968049557,
                            40.1105746572685
                        ],
                        [
                            -88.22879594147474,
                            40.11054632497121
                        ],
                        [
                            -88.2288700319404,
                            40.11623771862462
                        ]
                    ]
                ],
                type: 'Polygon' as const
            }
        },
        {
            id: 'Eyd9YawMVPQaCiZXl7L3GOWXOc6SF5BD',
            type: 'Feature' as const,
            properties: {
                name: 'LAS\n(Main Quad)',
                name_zh: 'LAS\n(Main Quad)',
                description: 'College of Liberal Arts & Sciences',
                color: '#00C853' // Vibrant Green
            },
            geometry: {
                coordinates: [
                    [
                        [
                            -88.22881550154113,
                            40.11024361871219
                        ],
                        [
                            -88.22567606885313,
                            40.110390247048514
                        ],
                        [
                            -88.22553657190315,
                            40.105484278220636
                        ],
                        [
                            -88.22869349793923,
                            40.10548355994522
                        ],
                        [
                            -88.22881550154113,
                            40.11024361871219
                        ]
                    ]
                ],
                type: 'Polygon' as const
            }
        },
        {
            id: 'LbmTqVKknl3dveKi8GLJvgG2AgxTRLth',
            type: 'Feature' as const,
            properties: {
                name: 'Business\n(South)',
                name_zh: 'Business\n(South)',
                description: 'Gies College of Business',
                color: '#FF6D00' // Vibrant Orange
            },
            geometry: {
                coordinates: [
                    [
                        [
                            -88.23232602051382,
                            40.10407203695441
                        ],
                        [
                            -88.23037109744133,
                            40.10407858902939
                        ],
                        [
                            -88.23034539882866,
                            40.1031363501231
                        ],
                        [
                            -88.23130957296426,
                            40.10312938018602
                        ],
                        [
                            -88.23231530991266,
                            40.10311998041309
                        ],
                        [
                            -88.23232602051382,
                            40.10407203695441
                        ]
                    ]
                ],
                type: 'Polygon' as const
            }
        },
        {
            id: 'DsijJ48qwdOguu5bzDJuh32KnSCOMax4',
            type: 'Feature' as const,
            properties: {
                name: 'ACES\n(South)',
                name_zh: 'ACES\n(South)',
                description: 'College of ACES',
                color: '#64DD17' // Vibrant Light Green
            },
            geometry: {
                coordinates: [
                    [
                        [
                            -88.23021998168188,
                            40.10404268738745
                        ],
                        [
                            -88.22195201648718,
                            40.10410846599956
                        ],
                        [
                            -88.22188751717356,
                            40.10067425138505
                        ],
                        [
                            -88.23017698213974,
                            40.10060846935449
                        ],
                        [
                            -88.23021998168188,
                            40.10404268738745
                        ]
                    ]
                ],
                type: 'Polygon' as const
            }
        }
    ]
};

export const CAMPUS_LANDMARKS: Landmark[] = [
    {
        id: 'union',
        name: 'Illini Union',
        name_zh: 'Illini Union',
        type: 'union',
        lat: 40.1093,
        lng: -88.2272
    },
    {
        id: 'library',
        name: 'Main Library',
        name_zh: 'Main Library',
        type: 'library',
        lat: 40.1047,
        lng: -88.2284
    },
    {
        id: 'arc',
        name: 'ARC (Gym)',
        name_zh: 'ARC (Gym)',
        type: 'gym',
        lat: 40.1011,
        lng: -88.2343
    },
    {
        id: 'siebel-center',
        name: 'Siebel Center (CS)',
        name_zh: 'Siebel Center (CS)',
        type: 'school',
        lat: 40.1138,
        lng: -88.2259
    },
    {
        id: 'ece-building',
        name: 'ECE Building',
        name_zh: 'ECE Building',
        type: 'school',
        lat: 40.1150,
        lng: -88.2280
    },
    // New Landmarks
    {
        id: 'bookstore',
        name: 'Illini Union Bookstore',
        name_zh: 'Illini Union Bookstore',
        type: 'store',
        lat: 40.1092,
        lng: -88.2294
    },
    {
        id: 'county-market',
        name: 'County Market',
        name_zh: 'County Market',
        type: 'store',
        lat: 40.1130,
        lng: -88.2338
    },
    {
        id: 'target',
        name: 'Target (Green St)',
        name_zh: 'Target (Green St)',
        type: 'store',
        lat: 40.1102,
        lng: -88.2301
    },
    {
        id: 'crce',
        name: 'CRCE (Gym)',
        name_zh: 'CRCE (Gym)',
        type: 'gym',
        lat: 40.1045,
        lng: -88.2220
    },
    {
        id: 'mckinley',
        name: 'McKinley Health',
        name_zh: 'McKinley Health',
        type: 'medical',
        lat: 40.1030,
        lng: -88.2205
    },
    {
        id: 'cif',
        name: 'CIF',
        name_zh: 'CIF',
        type: 'school',
        lat: 40.1125,
        lng: -88.2284
    },
    {
        id: 'hmart',
        name: 'H Mart (Urbana)',
        name_zh: 'H Mart (Urbana)',
        type: 'store',
        lat: 40.1145,
        lng: -88.2068
    },
    {
        id: 'walgreens',
        name: 'Walgreens (Green St)',
        name_zh: 'Walgreens (Green St)',
        type: 'store',
        lat: 40.1104,
        lng: -88.2328
    },
    {
        id: 'cvs',
        name: 'CVS (Green St)',
        name_zh: 'CVS (Green St)',
        type: 'store',
        lat: 40.1103,
        lng: -88.2405
    },
    {
        id: 'usps',
        name: 'USPS (Green St)',
        name_zh: 'USPS (Green St)',
        type: 'service',
        lat: 40.1103,
        lng: -88.2351
    },
    // Dining & Zones
    {
        id: 'mcdonalds',
        name: 'McDonald\'s',
        name_zh: 'McDonald\'s',
        type: 'dining',
        lat: 40.1103,
        lng: -88.2298
    }
];

