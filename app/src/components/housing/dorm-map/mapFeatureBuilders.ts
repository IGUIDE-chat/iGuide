/**
 * @file ./src/components/housing/dorm-map/mapFeatureBuilders.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type Dorm } from "../types/index"
import { type Landmark } from "../constants/mapData"
import {
  type DormFeatureProperties,
  type LandmarkFeatureProperties,
} from "./types"

export const buildLandmarkFeatureCollection = (landmarks: Landmark[]) => ({
  type: "FeatureCollection" as const,
  features: landmarks.map((landmark) => ({
    type: "Feature" as const,
    properties: {
      id: landmark.id,
      name: landmark.name,
      name_zh: landmark.name_zh,
      type: landmark.type,
    } satisfies LandmarkFeatureProperties,
    geometry: {
      type: "Point" as const,
      coordinates: [landmark.lng, landmark.lat] as [number, number],
    },
  })),
})

export const buildDormFeatureCollection = (
  dorms: Dorm[],
  hoveredDormId: string | null | undefined,
  highlightedDormId: string | null | undefined
) => ({
  type: "FeatureCollection" as const,
  features: dorms.map((dorm) => ({
    type: "Feature" as const,
    properties: {
      id: dorm.id,
      price: dorm.price,
      name: dorm.name,
      isActive: hoveredDormId === dorm.id || highlightedDormId === dorm.id,
    } satisfies DormFeatureProperties,
    geometry: {
      type: "Point" as const,
      coordinates: [dorm.lng, dorm.lat] as [number, number],
    },
  })),
})
