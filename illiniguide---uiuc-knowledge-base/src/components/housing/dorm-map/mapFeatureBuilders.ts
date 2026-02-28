import { Dorm } from '../../../types/housing';
import { Landmark } from '../../../constants/housing/mapData';
import { DormFeatureProperties, LandmarkFeatureProperties } from './types';

export const buildLandmarkFeatureCollection = (landmarks: Landmark[]) => ({
    type: 'FeatureCollection' as const,
    features: landmarks.map((landmark) => ({
        type: 'Feature' as const,
        properties: {
            id: landmark.id,
            name: landmark.name,
            name_zh: landmark.name_zh,
            type: landmark.type
        } satisfies LandmarkFeatureProperties,
        geometry: {
            type: 'Point' as const,
            coordinates: [landmark.lng, landmark.lat] as [number, number]
        }
    }))
});

export const buildDormFeatureCollection = (
    dorms: Dorm[],
    hoveredDormId: string | null | undefined,
    highlightedDormId: string | null | undefined
) => ({
    type: 'FeatureCollection' as const,
    features: dorms.map((dorm) => ({
        type: 'Feature' as const,
        properties: {
            id: dorm.id,
            price: dorm.price,
            name: dorm.name,
            isActive: hoveredDormId === dorm.id || highlightedDormId === dorm.id
        } satisfies DormFeatureProperties,
        geometry: {
            type: 'Point' as const,
            coordinates: [dorm.lng, dorm.lat] as [number, number]
        }
    }))
});
