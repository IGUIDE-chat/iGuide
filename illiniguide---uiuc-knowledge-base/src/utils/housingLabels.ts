import { Dorm, RoomType } from '../types/housing';

const ROOM_TYPE_LABELS_ZH: Record<RoomType, string> = {
    Studio: '开间 (Studio)',
    '1B1B': '一居一卫 (1B1B)',
    '2B1B': '两居一卫 (2B1B)',
    '2B2B': '两居两卫 (2B2B)',
    '3B1B': '三居一卫 (3B1B)',
    '3B2B': '三居两卫 (3B2B)',
    '3B3B': '三居三卫 (3B3B)',
    '4B1B': '四居一卫 (4B1B)',
    '4B2B': '四居两卫 (4B2B)',
    '4B3B': '四居三卫 (4B3B)',
    '4B4B': '四居四卫 (4B4B)',
    '5B2B': '五居两卫 (5B2B)',
    Suite: '套间 (Suite)',
    Cluster: '集群式 (Cluster)'
};

const DORM_TYPE_LABELS_ZH: Record<Dorm['type'], string> = {
    Traditional: '传统宿舍',
    Cluster: '集群式',
    Suite: '套间',
    'Semi-Suite': '半套间'
};

export const getRoomTypeLabel = (roomType: RoomType, language: 'en' | 'zh'): string => {
    if (language !== 'zh') return roomType;
    return ROOM_TYPE_LABELS_ZH[roomType] || roomType;
};

export const getDormTypeLabel = (dormType: Dorm['type'], language: 'en' | 'zh'): string => {
    if (language !== 'zh') return dormType;
    return DORM_TYPE_LABELS_ZH[dormType] || dormType;
};

