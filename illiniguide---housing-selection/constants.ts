import { Dorm, ChatMessage } from './types';

export const UIUC_DORMS: Dorm[] = [
  {
    id: 'isr',
    name: 'Illinois Street Residence (ISR)',
    location: 'Urbana',
    type: 'Traditional',
    ac: true,
    dining: true,
    tags: ['Engineering', 'Renovated', 'Modern', 'Stem'],
    description: 'Located conveniently close to the engineering quad, ISR features a newly renovated dining center and modern rooms. It is a hub for STEM majors.',
    imageUrl: 'https://picsum.photos/800/600?random=1',
    pros: ['Right next to Grainger Engineering Library', 'Brand new dining facility', 'Modern amenities'],
    cons: ['Can be competitive to get into', 'Smaller room sizes in older wings'],
    priceRange: '$$$$'
  },
  {
    id: 'ike-north',
    name: 'Ikenberry North (Nugent, Wassaja, etc.)',
    location: 'Ikenberry',
    type: 'Semi-Suite',
    ac: true,
    dining: true,
    tags: ['Social', 'Modern', 'Popular', 'ARC'],
    description: 'The newest halls on campus offering premium amenities. Located near the ARC gym and Memorial Stadium. Known for being very social.',
    imageUrl: 'https://picsum.photos/800/600?random=2',
    pros: ['Very modern rooms', 'Close to the ARC (Gym)', 'Great social atmosphere'],
    cons: ['Most expensive options', 'Far from engineering quad'],
    priceRange: '$$$$'
  },
  {
    id: 'par',
    name: 'Pennsylvania Avenue Residence (PAR)',
    location: 'Urbana',
    type: 'Traditional',
    ac: true,
    dining: true,
    tags: ['Diverse', 'Late Night Dining', 'Bus Routes'],
    description: 'PAR is known for its diversity and the famous late-night dining options. It features "Babcock" and "Carr" halls. A bit further south but well connected by bus.',
    imageUrl: 'https://picsum.photos/800/600?random=3',
    pros: ['Late night dining is a lifesaver', 'Very diverse community', 'Good bus access'],
    cons: ['Far from Green Street', 'Shared community bathrooms'],
    priceRange: '$$$'
  },
  {
    id: 'far',
    name: 'Florida Avenue Residence (FAR)',
    location: 'Urbana',
    type: 'Traditional',
    ac: true,
    dining: true,
    tags: ['Quiet', 'Trellis Dining', 'South Campus'],
    description: 'Located across from PAR, FAR offers air-conditioned rooms and the Oglesby/Trelease halls. Known for a slightly quieter atmosphere than the Ike.',
    imageUrl: 'https://picsum.photos/800/600?random=4',
    pros: ['Air conditioned', 'Weekly soul food night', 'Relaxed vibe'],
    cons: ['Older building style', 'Far from main quad'],
    priceRange: '$$'
  },
  {
    id: 'allen',
    name: 'Allen Hall',
    location: 'Urbana',
    type: 'Traditional',
    ac: false,
    dining: true,
    tags: ['Artsy', 'Unit One', 'Music', 'No AC'],
    description: 'Home to the Unit One LLC, Allen is the hub for creative students. It features music practice rooms, a recording studio, and guest-in-residence programs.',
    imageUrl: 'https://picsum.photos/800/600?random=5',
    pros: ['Incredible community and programs', 'In-house dining hall', 'Creative atmosphere'],
    cons: ['No Air Conditioning (usually)', 'Older facilities'],
    priceRange: '$$'
  },
  {
    id: 'busey-evans',
    name: 'Busey-Evans',
    location: 'Urbana',
    type: 'Traditional',
    ac: false,
    dining: true,
    tags: ['Historic', 'Quiet', 'Female-Identified'],
    description: 'A historic residence hall primarily for female-identified students. Known for its beautiful architecture and quiet, study-focused environment.',
    imageUrl: 'https://picsum.photos/800/600?random=6',
    pros: ['Very quiet and safe', 'Beautiful architecture', 'Close to Krannert Center'],
    cons: ['No AC in many parts', 'Less social party scene'],
    priceRange: '$$'
  },
  {
    id: 'ike-south',
    name: 'Ikenberry South (Snyder, Scott, etc.)',
    location: 'Ikenberry',
    type: 'Traditional',
    ac: true,
    dining: false,
    tags: ['Social', 'Traditional', 'Accessible'],
    description: 'The traditional side of the Six Pack. Snyder is a substance-free hall. Scott is known for being very social. Good balance of price and location.',
    imageUrl: 'https://picsum.photos/800/600?random=7',
    pros: ['Close to Ike Dining Hall', 'Social environment', 'Cheaper than Ike North'],
    cons: ['Older buildings', 'Community bathrooms'],
    priceRange: '$$$'
  }
];

export const INITIAL_CHAT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: "Hi! I'm your Illini Housing Assistant. I can help you find the best dorm based on your major, lifestyle, or budget. Try asking 'Which dorm is best for engineering students?' or 'Where is the best food?'",
  timestamp: new Date()
};