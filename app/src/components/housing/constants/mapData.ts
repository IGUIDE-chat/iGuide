/**
 * @file ./src/components/housing/constants/mapData.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// Campus Landmarks for Map View
export interface Landmark {
  id: string
  name: string
  name_zh?: string
  type:
    | "school"
    | "library"
    | "union"
    | "gym"
    | "store"
    | "dining"
    | "medical"
    | "service"
    | "transport"
  lat: number
  lng: number
  icon?: string
}

export const CAMPUS_ZONES = {
  type: "FeatureCollection" as const,
  features: [
    {
      id: "VCNb8x6ZORk3AFTiDw51fY5SFyQF4zgm",
      type: "Feature" as const,
      properties: {
        name: "Green Street\nCampustown",
        name_zh: "绿街\nCampustown",
        description: "Hub for dining, nightlife, and shopping",
        color: "#FFD600", // Vibrant Yellow
      },
      geometry: {
        coordinates: [
          [
            [-88.242, 40.1108],
            [-88.22895854412525, 40.110856038945215],
            [-88.22895854412585, 40.109878455557684],
            [-88.242, 40.1098],
            [-88.242, 40.1108],
          ],
        ],
        type: "Polygon" as const,
      },
    },
    {
      id: "0mt7Fb79iPbr49alvNDBPz6cGg7WD5BW",
      type: "Feature" as const,
      properties: {
        name: "Downtown\nChampaign",
        name_zh: "Downtown\nChampaign",
        description: "Historic district with upscale dining and cafes",
        color: "#00B0FF", // Vibrant Blue
      },
      geometry: {
        coordinates: [
          [
            [-88.24511506363498, 40.11917960175619],
            [-88.23994985985199, 40.11815494461963],
            [-88.24102787304325, 40.11540563868034],
            [-88.24508352266375, 40.11540291453319],
            [-88.24511506363498, 40.11917960175619],
          ],
        ],
        type: "Polygon" as const,
      },
    },
    {
      id: "NhQsUa8pLb2hAQ8ry1QT5RkPSixigpD7",
      type: "Feature" as const,
      properties: {
        name: "Engineering\n(North)",
        name_zh: "Engineering\n(North)",
        description: "Grainger College of Engineering",
        color: "#FF3D00", // Vibrant Deep Orange
      },
      geometry: {
        coordinates: [
          [
            [-88.2288700319404, 40.11623771862462],
            [-88.22579638404298, 40.11628021291715],
            [-88.22562968049557, 40.1105746572685],
            [-88.22879594147474, 40.11054632497121],
            [-88.2288700319404, 40.11623771862462],
          ],
        ],
        type: "Polygon" as const,
      },
    },
    {
      id: "Eyd9YawMVPQaCiZXl7L3GOWXOc6SF5BD",
      type: "Feature" as const,
      properties: {
        name: "LAS\n(Main Quad)",
        name_zh: "LAS\n(Main Quad)",
        description: "College of Liberal Arts & Sciences",
        color: "#00C853", // Vibrant Green
      },
      geometry: {
        coordinates: [
          [
            [-88.22881550154113, 40.11024361871219],
            [-88.22567606885313, 40.110390247048514],
            [-88.22553657190315, 40.105484278220636],
            [-88.22869349793923, 40.10548355994522],
            [-88.22881550154113, 40.11024361871219],
          ],
        ],
        type: "Polygon" as const,
      },
    },
    {
      id: "LbmTqVKknl3dveKi8GLJvgG2AgxTRLth",
      type: "Feature" as const,
      properties: {
        name: "Business\n(South)",
        name_zh: "Business\n(South)",
        description: "Gies College of Business",
        color: "#FF6D00", // Vibrant Orange
      },
      geometry: {
        coordinates: [
          [
            [-88.23232602051382, 40.10407203695441],
            [-88.23037109744133, 40.10407858902939],
            [-88.23034539882866, 40.1031363501231],
            [-88.23130957296426, 40.10312938018602],
            [-88.23231530991266, 40.10311998041309],
            [-88.23232602051382, 40.10407203695441],
          ],
        ],
        type: "Polygon" as const,
      },
    },
    {
      id: "DsijJ48qwdOguu5bzDJuh32KnSCOMax4",
      type: "Feature" as const,
      properties: {
        name: "ACES\n(South)",
        name_zh: "ACES\n(South)",
        description: "College of ACES",
        color: "#64DD17", // Vibrant Light Green
      },
      geometry: {
        coordinates: [
          [
            [-88.23021998168188, 40.10404268738745],
            [-88.22195201648718, 40.10410846599956],
            [-88.22188751717356, 40.10067425138505],
            [-88.23017698213974, 40.10060846935449],
            [-88.23021998168188, 40.10404268738745],
          ],
        ],
        type: "Polygon" as const,
      },
    },
  ],
}

export const CAMPUS_LANDMARKS: Landmark[] = [
  {
    id: "union",
    name: "Illini Union",
    name_zh: "Illini Union",
    type: "union",
    lat: 40.1092252342299,
    lng: -88.22722170704449,
  },
  {
    id: "library",
    name: "Main Library",
    name_zh: "Main Library",
    type: "library",
    lat: 40.10471119668479,
    lng: -88.22902417993053,
  },
  {
    id: "arc",
    name: "ARC (Gym)",
    name_zh: "ARC (Gym)",
    type: "gym",
    lat: 40.100684888169084,
    lng: -88.23601776145921,
  },
  {
    id: "siebel-center",
    name: "Siebel Center (CS)",
    name_zh: "Siebel Center (CS)",
    type: "school",
    lat: 40.113801471402596,
    lng: -88.2249041352866,
  },
  {
    id: "ece-building",
    name: "ECE Building",
    name_zh: "ECE Building",
    type: "school",
    lat: 40.11492760887548,
    lng: -88.22802989519542,
  },
  // New Landmarks
  {
    id: "bookstore",
    name: "Illini Union Bookstore",
    name_zh: "Illini Union Bookstore",
    type: "store",
    lat: 40.10829322991013,
    lng: -88.22922027529316,
  },
  {
    id: "county-market",
    name: "County Market",
    name_zh: "County Market(超市)",
    type: "store",
    lat: 40.11301977423581,
    lng: -88.23394405183204,
  },
  {
    id: "target",
    name: "Target",
    name_zh: "Target(超市)",
    type: "store",
    lat: 40.110109087389475,
    lng: -88.23017080569798,
  },
  {
    id: "crce",
    name: "CRCE (Gym)",
    name_zh: "CRCE (Gym)",
    type: "gym",
    lat: 40.10476961777321,
    lng: -88.22191495533255,
  },
  {
    id: "mckinley",
    name: "McKinley Health",
    name_zh: "McKinley Health",
    type: "medical",
    lat: 40.10280859957014,
    lng: -88.21980282686037,
  },
  {
    id: "cif",
    name: "CIF",
    name_zh: "CIF",
    type: "school",
    lat: 40.11247604751845,
    lng: -88.22832596821532,
  },
  {
    id: "hmart",
    name: "H Mart",
    name_zh: "H Mart(超市)",
    type: "store",
    lat: 40.11444384417658,
    lng: -88.20588947215093,
  },
  {
    id: "walgreens",
    name: "Walgreens",
    name_zh: "Walgreens",
    type: "store",
    lat: 40.10999291447267,
    lng: -88.23273543546361,
  },
  {
    id: "cvs",
    name: "CVS",
    name_zh: "CVS",
    type: "store",
    lat: 40.10955228408728,
    lng: -88.24430430485087,
  },
  {
    id: "usps",
    name: "USPS",
    name_zh: "USPS",
    type: "service",
    lat: 40.11049753904377,
    lng: -88.23511197584901,
  },
  {
    id: "illini-terminal",
    name: "Illini Terminal",
    name_zh: "Illini Terminal",
    type: "transport",
    lat: 40.11576349139271,
    lng: -88.24114625734319,
  },
  // Dining & Zones
  {
    id: "mcdonalds",
    name: "McDonald's",
    name_zh: "McDonald's",
    type: "dining",
    lat: 40.11043290801958,
    lng: -88.229839506289,
  },
]
