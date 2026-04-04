/**
 * @file ./src/utils/dormData.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import {
  Dorm,
  DormCategorizedTags,
  DormTags,
  FacilityTag,
  FloorPlan,
  LifestyleTag,
  LivingConditionTag,
} from '../components/housing/types/index'
import { deriveRoomOptions } from './roomOptions'

const LIVING_CONDITION_LABELS: Record<LivingConditionTag, string> = {
  noAc: 'No AC',
  newlyRenovated: 'Renovated',
  olderBuilding: 'Older Building',
}

const FACILITY_LABELS: Record<FacilityTag, string> = {
  gym: 'Gym Nearby',
  musicRooms: 'Music Rooms',
  computerLab: 'Computer Lab',
  library: 'Library',
  convenienceStore: 'Convenience Store',
  studyLounge: 'Study Rooms',
  laundry: 'Laundry',
  kitchen: 'Kitchen',
  busStop: 'Bus Routes',
}

const LIFESTYLE_LABELS: Record<LifestyleTag, string> = {
  quiet: 'Quiet',
  socialParty: 'Social',
  internationalFriendly: 'International Friendly',
  llc: 'LLC',
  artsyCreative: 'Artsy',
  genderInclusive: 'Gender-Inclusive',
}

const PROXIMITY_LABELS: Array<[keyof DormTags, string]> = [
  ['nearMainQuad', 'Near Main Quad'],
  ['nearEngineering', 'Near Engineering'],
  ['nearBusiness', 'Near Business'],
  ['nearARC', 'Near ARC/CRCE'],
  ['nearGreenStreet', 'Near Green Street'],
  ['nearIkenberryDining', 'Near Ikenberry Dining'],
]

const STRUCTURED_AMENITY_LABELS: Array<[keyof DormTags, string]> = [
  ['elevator', 'Elevator'],
  ['laundry', 'Laundry'],
  ['studyRooms', 'Study Rooms'],
  ['kitchen', 'Kitchen'],
  ['parking', 'Parking'],
  ['gymNearby', 'Gym Nearby'],
  ['pool', 'Pool'],
  ['genderInclusive', 'Gender-Inclusive'],
  ['quietFloors', 'Quiet Floors'],
  ['substanceFree', 'Substance-Free'],
  ['petFriendly', 'Pet-Friendly'],
]

const OFFICIAL_SQFT_ALLOWLIST: Record<string, Set<string>> = {
  bromley: new Set(['Standard Double', 'Triple', 'Quad']),
  'illini-tower': new Set([
    'S1',
    'S2',
    'B1 Shared',
    'B2 Shared',
    'B2 Private',
    'C1',
    'D1',
  ]),
}

function uniqueStrings<T extends string>(
  items: Array<T | undefined | null>
): T[] {
  return Array.from(
    new Set(items.filter((value): value is T => Boolean(value)))
  )
}

function sanitizeOptionalString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function sanitizeUrlList(urls: Array<string | undefined | null>) {
  return uniqueStrings(urls.map((url) => sanitizeOptionalString(url)))
}

export function getDormPriceRange(price: number): Dorm['priceRange'] {
  if (price < 9000) return '$'
  if (price < 14500) return '$$'
  if (price < 17500) return '$$$'
  return '$$$$'
}

export function normalizeCategorizedTags(
  categorizedTags: DormCategorizedTags
): DormCategorizedTags {
  const lifestyle = uniqueStrings(categorizedTags.lifestyle)
  const llcNames = lifestyle.includes('llc')
    ? uniqueStrings(categorizedTags.llcNames ?? [])
    : undefined

  return {
    livingConditions: uniqueStrings(categorizedTags.livingConditions),
    facilities: uniqueStrings(categorizedTags.facilities),
    lifestyle,
    ...(llcNames && llcNames.length > 0 ? { llcNames } : {}),
  }
}

function syncStructuredTags(
  structuredTags: Dorm['structuredTags'],
  categorizedTags: DormCategorizedTags
): Dorm['structuredTags'] {
  if (!structuredTags) {
    return structuredTags
  }

  return {
    ...structuredTags,
    laundry:
      structuredTags.laundry || categorizedTags.facilities.includes('laundry'),
    studyRooms:
      structuredTags.studyRooms ||
      categorizedTags.facilities.includes('studyLounge'),
    kitchen:
      structuredTags.kitchen || categorizedTags.facilities.includes('kitchen'),
    gymNearby:
      structuredTags.gymNearby || categorizedTags.facilities.includes('gym'),
    genderInclusive:
      structuredTags.genderInclusive ||
      categorizedTags.lifestyle.includes('genderInclusive'),
    llc: categorizedTags.lifestyle.includes('llc')
      ? [...(categorizedTags.llcNames ?? [])]
      : [],
  }
}

export function buildLegacyDormTags(
  dorm: Pick<
    Dorm,
    | 'housingType'
    | 'dining'
    | 'bathroomType'
    | 'categorizedTags'
    | 'structuredTags'
    | 'floorPlans'
    | 'roomOptions'
  >
): string[] {
  const categorizedTags = normalizeCategorizedTags(dorm.categorizedTags)
  const tags: string[] = []

  for (const tag of categorizedTags.lifestyle) {
    if (tag === 'llc') {
      tags.push(...(categorizedTags.llcNames ?? []))
      continue
    }
    tags.push(LIFESTYLE_LABELS[tag])
  }

  for (const tag of categorizedTags.livingConditions) {
    tags.push(LIVING_CONDITION_LABELS[tag])
  }

  for (const tag of categorizedTags.facilities) {
    tags.push(FACILITY_LABELS[tag])
  }

  if (dorm.housingType === 'PCH') {
    tags.push('PCH')
  }

  if (dorm.dining === 'inside') {
    tags.push('Dining Hall')
  }
  const bathroomScopes = new Set(
    (
      dorm.roomOptions ??
      deriveRoomOptions(dorm.floorPlans, dorm.bathroomType).roomOptions
    ).map((option) => option.bathroomScope)
  )
  if (bathroomScopes.has('private') || dorm.bathroomType === 'private') {
    tags.push('Private Bath')
  }
  if (
    bathroomScopes.has('individual-use') ||
    dorm.bathroomType === 'individual-use'
  ) {
    tags.push('Communal Single-Use Bath')
  }
  if (
    bathroomScopes.has('semi-private') ||
    dorm.bathroomType === 'semi-private'
  ) {
    tags.push('Semi-Private Bath')
  }

  const structuredTags = syncStructuredTags(
    dorm.structuredTags,
    categorizedTags
  )
  if (structuredTags) {
    for (const [key, label] of PROXIMITY_LABELS) {
      if (structuredTags[key]) {
        tags.push(label)
      }
    }

    for (const [key, label] of STRUCTURED_AMENITY_LABELS) {
      if (structuredTags[key]) {
        tags.push(label)
      }
    }
  }

  return uniqueStrings(tags)
}

export function finalizeDormRecord(dorm: Dorm): Dorm {
  const categorizedTags = normalizeCategorizedTags(dorm.categorizedTags)
  const structuredTags = syncStructuredTags(
    dorm.structuredTags,
    categorizedTags
  )
  const allowedSqftPlans = OFFICIAL_SQFT_ALLOWLIST[dorm.id] ?? new Set<string>()
  const floorPlans = dorm.floorPlans?.map((plan) => {
    if (plan.sqft == null) {
      return plan
    }

    const planName = plan.officialName ?? plan.labelCode ?? plan.type
    if (!planName || !allowedSqftPlans.has(planName)) {
      const { sqft, ...rest } = plan
      return rest
    }

    return plan
  })

  return {
    ...dorm,
    categorizedTags,
    structuredTags,
    floorPlans,
    tags: buildLegacyDormTags({
      housingType: dorm.housingType,
      dining: dorm.dining,
      bathroomType: dorm.bathroomType,
      categorizedTags,
      structuredTags,
      floorPlans,
      roomOptions: dorm.roomOptions,
    }),
    priceRange: getDormPriceRange(dorm.price),
  }
}

export function sanitizeFloorPlanForStorage(plan: FloorPlan): FloorPlan {
  const {
    imageUrl: legacyImageUrl,
    photoUrl: legacyPhotoUrl,
    imageUrls,
    photoUrls,
    officialName,
    description,
    price,
    sqft,
    ...rest
  } = plan
  const normalizedImageUrls = sanitizeUrlList([
    ...(imageUrls ?? []),
    legacyImageUrl,
  ])
  const normalizedPhotoUrls = sanitizeUrlList([
    ...(photoUrls ?? []),
    legacyPhotoUrl,
  ])

  return {
    ...rest,
    ...(typeof price === 'number' && Number.isFinite(price) && price > 0
      ? { price }
      : {}),
    ...(typeof sqft === 'number' && Number.isFinite(sqft) && sqft > 0
      ? { sqft }
      : {}),
    ...(sanitizeOptionalString(officialName)
      ? { officialName: sanitizeOptionalString(officialName) }
      : {}),
    ...(sanitizeOptionalString(description)
      ? { description: sanitizeOptionalString(description) }
      : {}),
    ...(normalizedImageUrls.length ? { imageUrls: normalizedImageUrls } : {}),
    ...(normalizedPhotoUrls.length ? { photoUrls: normalizedPhotoUrls } : {}),
  }
}

export function sanitizeFloorPlansForStorage(
  floorPlans?: FloorPlan[] | null
): FloorPlan[] | undefined {
  if (!floorPlans?.length) {
    return undefined
  }

  return floorPlans.map((plan) => sanitizeFloorPlanForStorage(plan))
}
