export interface DormFeatureProperties {
    id: string;
    price: number;
    formattedPrice: string;
    name: string;
    isActive: boolean;
}

export interface LandmarkFeatureProperties {
    id: string;
    name: string;
    name_zh?: string;
    type: string;
}
