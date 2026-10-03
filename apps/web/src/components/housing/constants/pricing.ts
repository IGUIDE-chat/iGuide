import { Dorm } from "@iguide/dorm"

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

export const getPriceRangeFromData = (dorms: Dorm[] = []): [number, number] => {
  const prices = dorms.map((d) => d.price).filter((p) => p != null && p > 0)
  if (prices.length === 0) return [0, 20000]
  return [Math.min(...prices), Math.max(...prices)]
}

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price)
}
