/**
 * @file ./src/components/housing/dorm-map/mapConstants.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

export const DEFAULT_CENTER: [number, number] = [40.1078, -88.2305];
export const DEFAULT_ZOOM = 14.5;

export const LANDMARK_ICON_TYPES = [
    'library',
    'gym',
    'dining',
    'store',
    'union',
    'medical',
    'service',
    'transport',
    'school'
];
