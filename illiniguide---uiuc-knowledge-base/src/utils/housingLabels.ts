import { RoomType } from '../types/housing';
import { getRoomCodeLabel } from './roomOptions';

export const getRoomTypeLabel = (roomType: RoomType, language: 'en' | 'zh'): string => {
    return getRoomCodeLabel(roomType, language);
};
