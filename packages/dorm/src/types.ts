/** Superseded by `DormCategorizedTags`; still read by filters that have not migrated. */
export interface DormTags {
  elevator?: boolean
  laundry?: boolean
  studyRooms?: boolean
  kitchen?: boolean
  parking?: boolean
  gymNearby?: boolean
  pool?: boolean

  genderInclusive?: boolean
  quietFloors?: boolean
  substanceFree?: boolean
  petFriendly?: boolean

  llc?: string[] // Living-Learning Community names

  nearMainQuad?: boolean
  nearEngineering?: boolean
  nearBusiness?: boolean
  nearARC?: boolean
  nearGreenStreet?: boolean
  nearIkenberryDining?: boolean
}

export type LivingConditionTag = "noAc" | "newlyRenovated" | "olderBuilding"

export type FacilityTag =
  | "gym"
  | "musicRooms"
  | "convenienceStore"
  | "studyLounge"
  | "laundry"
  | "kitchen"
  | "busStop"
  | "computerLab"
  | "library"

export type LifestyleTag =
  | "quiet"
  | "socialParty"
  | "internationalFriendly"
  | "llc"
  | "artsyCreative"
  | "genderInclusive"

export type DormTag = LivingConditionTag | FacilityTag | LifestyleTag
export type TagCategory = "livingConditions" | "facilities" | "lifestyle"

export interface DormCategorizedTags {
  livingConditions: LivingConditionTag[]
  facilities: FacilityTag[]
  lifestyle: LifestyleTag[]
  llcNames?: string[] // specific LLC names when 'llc' tag is present
}

export type BedSize = "Twin XL" | "Full" | "Queen" | "King"
export type BathroomScope = "communal" | "individual-use" | "semi-private" | "private"
export type BathroomType = BathroomScope | "mixed"
export type DiningType = "inside" | "nearby" | "none"
export type BedCountFilter = 1 | 2 | 3 | 4
export type BathroomCountFilter = 0 | 1 | 2

export interface Dorm {
  id: string
  name: string
  location: string
  ac: boolean
  dining: DiningType
  diningNearbyDetail?: string
  bathroomType: BathroomType
  tags: string[]
  structuredTags?: DormTags
  categorizedTags: DormCategorizedTags
  description: string
  imageUrl: string
  pros: string[]
  cons: string[]
  price: number // Annual price in USD (base/starting price)
  applicationFee?: number // One-time application fee in USD
  priceRange: "$" | "$$" | "$$$" | "$$$$"
  roomTypes: RoomType[]
  roomOptions?: RoomOption[] // Canonical room/bath combinations derived from floor plans
  floorPlans?: FloorPlan[]
  galleryImages?: string[]
  housingType: "URH" | "PCH"
  lat: number
  lng: number
  address?: string // e.g. "1010 W. Illinois St, Urbana, IL 61801"
  address_zh?: string
  website?: string
  name_zh?: string
  description_zh?: string
  pros_zh?: string[]
  cons_zh?: string[]
  location_zh?: string
}

export type RoomType =
  | "Studio"
  | "1B0B"
  | "1B1B"
  | "2B0B"
  | "2B1B"
  | "2B2B"
  | "3B0B"
  | "3B1B"
  | "3B2B"
  | "3B3B"
  | "4B0B"
  | "4B1B"
  | "4B2B"
  | "4B3B"
  | "4B4B"
  | "5B2B"
  | "Suite"
  | "Cluster"

export interface RoomOption {
  bedCount: number | null
  bathroomCount: number | null
  bathroomScope: BathroomScope
  labelCode?: string
}

export interface FloorPlan {
  type?: RoomType // Retained for compatibility; not written by the edit panel
  officialName?: string // Official room/floor-plan name published by the property
  bedCount?: number | null
  bathroomCount?: number | null
  bathroomScope?: BathroomScope
  labelCode?: string
  price?: number // Annual price for this specific floor plan when officially published
  sqft?: number // Square footage (optional)
  bedSize?: BedSize
  imageUrl?: string // Single layout diagram; prefer imageUrls
  photoUrl?: string // Single showcase photo; prefer photoUrls
  imageUrls?: string[]
  photoUrls?: string[]
  description?: string
  available?: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "model"
  text: string
  timestamp: Date
  isThinking?: boolean
}

/** Superseded by the `*Filters` fields on `DormFilterState`; still read by `filterDorms`. */
export const FilterOption = {
  ALL: "All",
  AC: "Air Conditioning",
  NEAR_ENGINEERING: "Near Engineering",
  NEAR_MAIN_QUAD: "Near Main Quad",
  DINING_IN_BUILDING: "Dining Hall in Building",
} as const

export type FilterOption = (typeof FilterOption)[keyof typeof FilterOption]
