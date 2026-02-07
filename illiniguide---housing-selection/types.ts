export interface Dorm {
  id: string;
  name: string;
  location: 'Ikenberry' | 'Urbana' | 'East Campus' | 'West Campus';
  type: 'Traditional' | 'Cluster' | 'Suite' | 'Semi-Suite';
  ac: boolean;
  dining: boolean; // Has dining hall inside or attached
  tags: string[];
  description: string;
  imageUrl: string;
  pros: string[];
  cons: string[];
  priceRange: '$$' | '$$$' | '$$$$';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export enum FilterOption {
  ALL = 'All',
  AC = 'Air Conditioning',
  NEAR_ENGINEERING = 'Near Engineering',
  NEAR_MAIN_QUAD = 'Near Main Quad',
  DINING_IN_BUILDING = 'Dining Hall in Building',
}
