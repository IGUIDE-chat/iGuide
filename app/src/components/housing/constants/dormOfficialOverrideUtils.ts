/**
 * @file ./src/components/housing/constants/dormOfficialOverrideUtils.ts
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import {
  type Dorm,
  type DormCategorizedTags,
  type FloorPlan,
} from "../types/index"

type DormOverride = Partial<
  Omit<
    Dorm,
    "structuredTags" | "categorizedTags" | "floorPlans" | "galleryImages"
  >
> & {
  structuredTags?: Partial<NonNullable<Dorm["structuredTags"]>>
  categorizedTags?: DormCategorizedTags
  floorPlans?: FloorPlan[]
  galleryImages?: string[]
}

const urhPage = (slug: string) =>
  `https://www.housing.illinois.edu/living-communities/halls/${slug}`
const WP_SIZE_SUFFIX_RE = /([_-])\d{2,4}x\d{2,4}(?=(?:-\d+)?\.[a-z0-9]+$)/i
const DOUBLED_EXTENSION_RE = /\.(png|jpe?g)\.jpg(?=$|\?)/i
const DRUPAL_STYLE_RE = /\/sites\/default\/files\/styles\/[^/]+\/public\//
const PEOPLE_FILENAME_RE = /(students?|group|parent|famil)/i

function normalizeOfficialMediaUrl(url: string) {
  let next = url.replaceAll("&amp;", "&").trim()

  if (DRUPAL_STYLE_RE.test(next)) {
    next = next.replace(DRUPAL_STYLE_RE, "/sites/default/files/")
  }

  next = next.replace(WP_SIZE_SUFFIX_RE, "")
  next = next.replace(DOUBLED_EXTENSION_RE, ".$1")
  next = next.replace(/\?.*$/, "")

  return next
}

function isLikelyLowQualityMediaUrl(url: string) {
  const trimmed = url.replaceAll("&amp;", "&").trim()
  return normalizeOfficialMediaUrl(trimmed) !== trimmed
}

function hasPeopleishFilename(url: string) {
  return PEOPLE_FILENAME_RE.test(url)
}

function normalizeFloorPlanMedia(planValue: FloorPlan): FloorPlan {
  return {
    ...planValue,
    imageUrl: planValue.imageUrl
      ? normalizeOfficialMediaUrl(planValue.imageUrl)
      : undefined,
    photoUrl: planValue.photoUrl
      ? normalizeOfficialMediaUrl(planValue.photoUrl)
      : undefined,
    imageUrls: planValue.imageUrls?.map((u) => normalizeOfficialMediaUrl(u)),
    photoUrls: planValue.photoUrls?.map((u) => normalizeOfficialMediaUrl(u)),
  }
}

function normalizeOverrideMedia<T extends DormOverride>(override: T): T {
  return {
    ...override,
    imageUrl: override.imageUrl
      ? normalizeOfficialMediaUrl(override.imageUrl)
      : override.imageUrl,
    galleryImages: override.galleryImages?.map((u) =>
      normalizeOfficialMediaUrl(u)
    ),
    floorPlans: override.floorPlans?.map((p) => normalizeFloorPlanMedia(p)),
  }
}

const clean = normalizeOfficialMediaUrl
const urls = (...values: string[]) =>
  values.map((v) => normalizeOfficialMediaUrl(v))
const plan = (value: FloorPlan): FloorPlan => ({
  available: true,
  ...value,
})

export type { DormOverride }
export {
  urhPage,
  normalizeOfficialMediaUrl,
  isLikelyLowQualityMediaUrl,
  hasPeopleishFilename,
  normalizeOverrideMedia,
  clean,
  urls,
  plan,
}
