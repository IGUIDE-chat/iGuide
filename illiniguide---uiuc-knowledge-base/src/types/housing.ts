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

export type LivingConditionTag =
    | 'noAc' | 'newlyRenovated' | 'olderBuilding';

export type FacilityTag =
    | 'gym' | 'musicRooms' | 'convenienceStore'
    | 'studyLounge' | 'laundry' | 'kitchen' | 'busStop';

export type LifestyleTag =
    | 'quiet' | 'socialParty' | 'internationalFriendly'
    | 'llc' | 'artsyCreative';

export type DormTag = LivingConditionTag | FacilityTag | LifestyleTag;
export type TagCategory = 'livingConditions' | 'facilities' | 'lifestyle';

export interface DormCategorizedTags {
    livingConditions: LivingConditionTag[];
    facilities: FacilityTag[];
    lifestyle: LifestyleTag[];
    llcNames?: string[];  // specific LLC names when 'llc' tag is present
}

export type BathroomType = 'communal' | 'semi-private' | 'private';
export type DiningType = 'inside' | 'nearby' | 'none';

export interface Dorm {
    id: string;
    name: string;
    location: 'Ikenberry' | 'Main Quad' | 'PAR/FAR' | 'Campustown' | 'South Campus';
    type: 'Traditional' | 'Cluster' | 'Suite' | 'Semi-Suite';
    ac: boolean;
    dining: DiningType;
    bathroomType: BathroomType;
    tags: string[];
    structuredTags?: DormTags; // Legacy — kept for migration
    categorizedTags: DormCategorizedTags;
    description: string;
    imageUrl: string;
    pros: string[];
    cons: string[];
    price: number; // Annual price in USD (base/starting price)
    priceRange: '$' | '$$' | '$$$' | '$$$$'; // Keep for backwards compatibility
    roomTypes: RoomType[];
    floorPlans?: FloorPlan[]; // Detailed floor plans with specific prices and images
    galleryImages?: string[]; // Array of gallery image URLs
    housingType: 'URH' | 'PCH';
    // Map coordinates
    lat: number;
    lng: number;
    // Localization
    name_zh?: string;
    description_zh?: string;
    pros_zh?: string[];
    cons_zh?: string[];
    location_zh?: string;
    type_zh?: string;
}

export type RoomType =
    | 'Studio'
    | '1B1B'
    | '2B0B'
    | '2B1B'
    | '2B2B'
    | '3B0B'
    | '3B1B'
    | '3B2B'
    | '3B3B'
    | '4B1B'
    | '4B2B'
    | '4B3B'
    | '4B4B'
    | '5B2B'
    | 'Suite'
    | 'Cluster';

// Floor plan with specific pricing and layout image
export interface FloorPlan {
    type: RoomType;           // Room type (e.g., "1B1B", "2B1B")
    price: number;            // Annual price for this specific floor plan
    sqft?: number;            // Square footage (optional)
    imageUrl?: string;        // Floor plan layout image URL
    description?: string;     // Description of this floor plan
    available?: boolean;      // Whether this floor plan is currently available
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
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
    ALL = 'All',
    AC = 'Air Conditioning',
    NEAR_ENGINEERING = 'Near Engineering',
    NEAR_MAIN_QUAD = 'Near Main Quad',
    DINING_IN_BUILDING = 'Dining Hall in Building',
}
