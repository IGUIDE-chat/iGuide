/**
 * @file ./src/components/housing/dorm-map/types.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

export interface DormFeatureProperties {
    id: string;
    price: number;
    name: string;
    isActive: boolean;
}

export interface LandmarkFeatureProperties {
    id: string;
    name: string;
    name_zh?: string;
    type: string;
}
