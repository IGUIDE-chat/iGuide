/**
 * @file ./src/components/housing/constants/pricing.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import { type Dorm } from "../types/index"

// Price tier definitions with approximate dollar amounts
export const PRICE_TIERS = {
  $: { value: 1, min: 0, max: 8000, label: "$", display: "Under $8K" },
  $$: { value: 2, min: 8000, max: 11000, label: "$$", display: "$8K - $11K" },
  $$$: {
    value: 3,
    min: 11000,
    max: 14000,
    label: "$$$",
    display: "$11K - $14K",
  },
  $$$$: { value: 4, min: 14000, max: 20000, label: "$$$$", display: "$14K+" },
} as const

export type PriceTier = keyof typeof PRICE_TIERS

// Calculate dynamic min/max from actual data
export const getPriceRangeFromData = (dorms: Dorm[] = []): [number, number] => {
  const prices = dorms
    .map((d) => d.price)
    .filter((p) => p !== null && p !== undefined && p > 0)
  if (prices.length === 0) {
    return [0, 20000]
  }
  return [Math.min(...prices), Math.max(...prices)]
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price)
}
