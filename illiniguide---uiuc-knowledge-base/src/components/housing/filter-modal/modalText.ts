import { Snowflake, Utensils, GraduationCap, MapPin } from 'lucide-react';
import { FilterOption } from '../../../types/housing';

export type FilterLanguage = 'en' | 'zh';

export interface ModalText {
    filters: string;
    priceRange: string;
    typeOfPlace: string;
    amenities: string;
    roomType: string;
    clearAll: string;
    showPlaces: string;
    minPrice: string;
    maxPrice: string;
    urh: string;
    pch: string;
    avgPrice: string;
    urhDesc: string;
    pchDesc: string;
    location: string;
    buildingType: string;
    livingConditions: string;
    facilities: string;
    lifestyle: string;
    bathroomType: string;
    airConditioning: string;
    communalBath: string;
    semiPrivateBath: string;
    privateBath: string;
}

export const HISTOGRAM_DATA = [4, 8, 12, 25, 35, 42, 45, 30, 20, 15, 10, 5, 2, 1];

export const DISPLAY_AMENITIES = [
    { id: FilterOption.AC, label: { en: 'Air Conditioning', zh: '空调' }, icon: Snowflake },
    { id: FilterOption.DINING_IN_BUILDING, label: { en: 'Dining Hall', zh: '食堂' }, icon: Utensils },
    { id: FilterOption.NEAR_ENGINEERING, label: { en: 'Near Engineering', zh: '靠近工学院' }, icon: GraduationCap },
    { id: FilterOption.NEAR_MAIN_QUAD, label: { en: 'Near Main Quad', zh: '靠近主广场' }, icon: MapPin }
] as const;

export const MODAL_TEXT: Record<FilterLanguage, ModalText> = {
    en: {
        filters: 'Filters',
        priceRange: 'Price Range',
        typeOfPlace: 'Type of Place',
        amenities: 'Amenities',
        roomType: 'Room Type',
        clearAll: 'Clear all',
        showPlaces: 'Show places',
        minPrice: 'Min Price',
        maxPrice: 'Max Price',
        urh: 'University Housing',
        pch: 'Private Certified',
        avgPrice: 'The average yearly price is around $11,500.',
        urhDesc: 'Official university residence halls',
        pchDesc: 'Private certified housing',
        location: 'Location',
        buildingType: 'Building Type',
        livingConditions: 'Living Conditions',
        facilities: 'Facilities',
        lifestyle: 'Lifestyle',
        bathroomType: 'Bathroom Type',
        airConditioning: 'Air Conditioning',
        communalBath: 'Communal',
        semiPrivateBath: 'Semi-Private',
        privateBath: 'Private'
    },
    zh: {
        filters: '筛选',
        priceRange: '价格范围',
        typeOfPlace: '住宿类型',
        amenities: '设施',
        roomType: '房型',
        clearAll: '清空全部',
        showPlaces: '显示房源',
        minPrice: '最低价格',
        maxPrice: '最高价格',
        urh: 'URH',
        pch: 'PCH',
        avgPrice: '平均年租金约为 $11,500。',
        urhDesc: '学校官方宿舍',
        pchDesc: '经认证的校外住宿',
        location: '位置',
        buildingType: '建筑类型',
        livingConditions: '居住条件',
        facilities: '配套设施',
        lifestyle: '生活方式',
        bathroomType: '卫浴类型',
        airConditioning: '有空调',
        communalBath: '公共卫浴',
        semiPrivateBath: '半独立卫浴',
        privateBath: '独立卫浴'
    }
};
