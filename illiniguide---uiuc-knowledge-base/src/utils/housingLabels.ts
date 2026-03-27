/**
 * @file ./src/utils/housingLabels.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { RoomType } from '../components/housing/types/index';
import { getRoomCodeLabel } from './roomOptions';

export const getRoomTypeLabel = (roomType: RoomType, language: 'en' | 'zh'): string => {
    return getRoomCodeLabel(roomType, language);
};
