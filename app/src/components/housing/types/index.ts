/**
 * @file ./src/components/housing/types/index.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// ── Legacy structured tags (kept temporarily for migration) ──────────────────
export interface DormTags {
  // Amenities
  elevator?: boolean;
  laundry?: boolean;
  studyRooms?: boolean;
  kitchen?: boolean;
  parking?: boolean;
  gymNearby?: boolean;
  pool?: boolean;

  // Communities
  genderInclusive?: boolean;
  quietFloors?: boolean;
  substanceFree?: boolean;
  petFriendly?: boolean;

  // LLC (Living-Learning Communities)
  llc?: string[]; // Array of LLC names

  // Proximity
  nearMainQuad?: boolean;
  nearEngineering?: boolean;
  nearBusiness?: boolean;
  nearARC?: boolean;
  nearGreenStreet?: boolean;
  nearIkenberryDining?: boolean;
}

// ── New Categorized Tag System ──────────────────────────────────────────────

export type LivingConditionTag = "noAc" | "newlyRenovated" | "olderBuilding";

export type FacilityTag =
  | "gym"
  | "musicRooms"
  | "convenienceStore"
  | "studyLounge"
  | "laundry"
  | "kitchen"
  | "busStop"
  | "computerLab"
  | "library";

export type LifestyleTag =
  | "quiet"
  | "socialParty"
  | "internationalFriendly"
  | "llc"
  | "artsyCreative"
  | "genderInclusive";

export type DormTag = LivingConditionTag | FacilityTag | LifestyleTag;
export type TagCategory = "livingConditions" | "facilities" | "lifestyle";

export interface DormCategorizedTags {
  livingConditions: LivingConditionTag[];
  facilities: FacilityTag[];
  lifestyle: LifestyleTag[];
  llcNames?: string[]; // specific LLC names when 'llc' tag is present
}

export type BedSize = "Twin XL" | "Full" | "Queen" | "King";
export type BathroomScope =
  | "communal"
  | "individual-use"
  | "semi-private"
  | "private";
export type BathroomType = BathroomScope | "mixed";
export type DiningType = "inside" | "nearby" | "none";
export type BedCountFilter = 1 | 2 | 3 | 4;
export type BathroomCountFilter = 0 | 1 | 2;

export interface Dorm {
  id: string;
  name: string;
  location: string;
  ac: boolean;
  dining: DiningType;
  diningNearbyDetail?: string; // Free text for nearby dining info
  bathroomType: BathroomType;
  tags: string[];
  structuredTags?: DormTags; // Legacy — kept for migration
  categorizedTags: DormCategorizedTags;
  description: string;
  imageUrl: string;
  pros: string[];
  cons: string[];
  price: number; // Annual price in USD (base/starting price)
  applicationFee?: number; // One-time application fee in USD
  priceRange: "$" | "$$" | "$$$" | "$$$$"; // Keep for backwards compatibility
  roomTypes: RoomType[];
  roomOptions?: RoomOption[]; // Canonical room/bath combinations derived from floor plans
  floorPlans?: FloorPlan[]; // Detailed floor plans with specific prices and images
  galleryImages?: string[]; // Array of gallery image URLs
  housingType: "URH" | "PCH";
  // Map coordinates
  lat: number;
  lng: number;
  // Address
  address?: string; // Street address (e.g. "1010 W. Illinois St, Urbana, IL 61801")
  address_zh?: string; // Address in Chinese (optional)
  website?: string; // Official website URL
  // Localization
  name_zh?: string;
  description_zh?: string;
  pros_zh?: string[];
  cons_zh?: string[];
  location_zh?: string;
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
  | "Cluster";

export interface RoomOption {
  bedCount: number | null;
  bathroomCount: number | null;
  bathroomScope: BathroomScope;
  labelCode?: string;
}

// Floor plan with specific pricing and layout image
export interface FloorPlan {
  type?: RoomType; // Legacy room type code kept for compatibility
  officialName?: string; // Official room/floor-plan name published by the property
  bedCount?: number | null;
  bathroomCount?: number | null;
  bathroomScope?: BathroomScope;
  labelCode?: string;
  price?: number; // Annual price for this specific floor plan when officially published
  sqft?: number; // Square footage (optional)
  bedSize?: BedSize; // Bed size provided in this floor plan
  imageUrl?: string; // Floor plan layout diagram URL (legacy single)
  photoUrl?: string; // Room showcase photo URL (legacy single)
  imageUrls?: string[]; // Floor plan layout diagram URLs (multiple)
  photoUrls?: string[]; // Room showcase photo URLs (multiple)
  description?: string; // Description of this floor plan
  available?: boolean; // Whether this floor plan is currently available
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

// Dorm viewing history item
export interface DormViewingHistory {
  id: string;
  user_id: string;
  dorm_id: string;
  dorm_name: string;
  dorm_name_zh?: string;
  view_count: number;
  last_viewed_at: string;
}

// Dorm favorite item
export interface DormFavorite {
  id: string;
  user_id: string;
  dorm_id: string;
  dorm_name: string;
  dorm_name_zh?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Legacy FilterOption — kept temporarily for migration
export enum FilterOption {
  ALL = "All",
  AC = "Air Conditioning",
  NEAR_ENGINEERING = "Near Engineering",
  NEAR_MAIN_QUAD = "Near Main Quad",
  DINING_IN_BUILDING = "Dining Hall in Building",
}
