export const AMENITIES = [
    { id: 'ac', label: { en: 'Air Conditioning', zh: '空调' }, icon: 'Snowflake' },
    { id: 'dining', label: { en: 'Dining Hall', zh: '食堂' }, icon: 'Utensils' },
    { id: 'gym', label: { en: 'Gym Nearby', zh: '附近健身房' }, icon: 'Dumbbell' }
] as const;

export const ROOM_TYPES = [
    { id: '1B1B', label: { en: 'Single (1B1B)', zh: 'Single (1B1B)' } },
    { id: '2B1B', label: { en: 'Double (2B1B)', zh: 'Double (2B1B)' } },
    { id: '3B1B', label: { en: 'Triples (3B1B)', zh: 'Triples (3B1B)' } },
    { id: '4B2B', label: { en: 'Quad (4B2B)', zh: 'Quad (4B2B)' } },
    { id: 'Suite', label: { en: 'Suite', zh: 'Suite' } },
    { id: 'Cluster', label: { en: 'Cluster', zh: 'Cluster' } }
] as const;

// New filter constants for structured tags
export const AMENITY_OPTIONS = [
    'Elevator', 'Laundry', 'Study Rooms', 'Kitchen', 'Parking', 'Gym Nearby', 'Pool'
] as const;

export const COMMUNITY_OPTIONS = [
    'Gender-Inclusive', 'Quiet Floors', 'Substance-Free', 'Pet-Friendly'
] as const;

export const LLC_OPTIONS = [
    'Engineering LLC', 'Business LLC', 'Honors LLC', 'Global LLC',
    'Innovation LLC', 'LEADS LLC', 'Unit One', 'Sustainability LLC',
    'Scholars LLC', 'Focus LLC', 'Exploration LLC'
] as const;

// Proximity filter options
export const PROXIMITY_OPTIONS = [
    'Near Main Quad',
    'Near Engineering',
    'Near Business',
    'Near ARC/CRCE',
    'Near Green Street',
    'Near Ikenberry Dining'
] as const;


