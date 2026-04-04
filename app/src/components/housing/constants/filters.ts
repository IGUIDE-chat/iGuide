/**
 * @file ./src/components/housing/constants/filters.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

﻿export const AMENITIES = [
    { id: 'ac', label: { en: 'Air Conditioning', zh: '空调' }, icon: 'Snowflake' },
    { id: 'dining', label: { en: 'Dining Hall', zh: '食堂' }, icon: 'Utensils' },
    { id: 'gym', label: { en: 'Gym Nearby', zh: '附近健身房' }, icon: 'Dumbbell' }
] as const;

export const ROOM_TYPES = [
    { id: '1B1B', label: { en: 'Single (1B1B)', zh: '一居一卫 (1B1B)' } },
    { id: '2B0B', label: { en: 'Double (2B0B)', zh: '两居零卫 (2B0B)' } },
    { id: '2B1B', label: { en: 'Double (2B1B)', zh: '两居一卫 (2B1B)' } },
    { id: '3B0B', label: { en: 'Triple (3B0B)', zh: '三居零卫 (3B0B)' } },
    { id: '3B1B', label: { en: 'Triples (3B1B)', zh: '三居一卫 (3B1B)' } },
    { id: '4B2B', label: { en: 'Quad (4B2B)', zh: '四居两卫 (4B2B)' } },
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


