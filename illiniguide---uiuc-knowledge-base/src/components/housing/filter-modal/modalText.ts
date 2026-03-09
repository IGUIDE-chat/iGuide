export type FilterLanguage = 'en' | 'zh';

export interface ModalText {
    filters: string;
    priceRange: string;
    typeOfPlace: string;
    amenities: string;
    roomType?: string;
    bedCount: string;
    bathroomCount: string;
    clearAll: string;
    showPlaces: string;
    minPrice: string;
    maxPrice: string;
    avgPrice: string;
    location: string;
    livingConditions: string;
    facilities: string;
    lifestyle: string;
    bathroomType: string;
    airConditioning: string;
    zeroBathrooms: string;
    onePlusBathrooms: string;
    twoPlusBathrooms: string;
}

export const HISTOGRAM_DATA = [4, 8, 12, 25, 35, 42, 45, 30, 20, 15, 10, 5, 2, 1];

export const MODAL_TEXT: Record<FilterLanguage, ModalText> = {
    en: {
        filters: 'Filters',
        priceRange: 'Price Range',
        typeOfPlace: 'Type of Place',
        amenities: 'Amenities',
        bedCount: 'Bed Count',
        bathroomCount: 'Bathroom Count',
        clearAll: 'Clear all',
        showPlaces: 'Show places',
        minPrice: 'Min Price',
        maxPrice: 'Max Price',
        avgPrice: 'The average yearly price is around $11,500.',
        location: 'Location',
        livingConditions: 'Living Conditions',
        facilities: 'Facilities',
        lifestyle: 'Lifestyle',
        bathroomType: 'Bathroom Type',
        airConditioning: 'Air Conditioning',
        zeroBathrooms: '0',
        onePlusBathrooms: '1+',
        twoPlusBathrooms: '2+',
    },
    zh: {
        filters: '筛选',
        priceRange: '价格范围',
        typeOfPlace: '住宿类型',
        amenities: '设施',
        bedCount: '床位数量',
        bathroomCount: '卫浴数量',
        clearAll: '清空全部',
        showPlaces: '显示结果',
        minPrice: '最低价格',
        maxPrice: '最高价格',
        avgPrice: '平均年费用约为 $11,500。',
        location: '位置',
        livingConditions: '居住条件',
        facilities: '配套设施',
        lifestyle: '生活方式',
        bathroomType: '卫浴类型',
        airConditioning: '空调',
        zeroBathrooms: '0',
        onePlusBathrooms: '1+',
        twoPlusBathrooms: '2+',
    },
};
