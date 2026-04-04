import fs from 'node:fs'
import path from 'node:path'
import { UIUC_DORMS } from '../src/components/housing/constants/dormData'
import {
  TAGS_BY_CATEGORY,
  LLC_OPTIONS,
} from '../src/components/housing/constants/metadata'
import {
  hasPeopleishFilename,
  isLikelyLowQualityMediaUrl,
} from '../src/components/housing/constants/dormOfficialOverrideUtils'
import { getDormPriceRange } from '../src/utils/dormData'

const EXPECTED_IDS = [
  'allen',
  'armory',
  'bousefield',
  'bromley',
  'busey-evans',
  'daniels',
  'far',
  'hendrick',
  'hopkins',
  'illini-tower',
  'isr',
  'lar',
  'newman',
  'nugent',
  'par',
  'presby',
  'scott',
  'sherman',
  'snyder',
  'taft',
  'van-doren',
  'wassaja',
  'weston',
].sort()

const VALID_TAGS = new Set([
  ...TAGS_BY_CATEGORY.livingConditions,
  ...TAGS_BY_CATEGORY.facilities,
  ...TAGS_BY_CATEGORY.lifestyle,
])
const VALID_LLCS = new Set(LLC_OPTIONS)
const VALID_BED_SIZES = new Set(['Twin XL', 'Full', 'Queen', 'King'])
const VALID_BATHROOM_SCOPES = new Set([
  'communal',
  'individual-use',
  'semi-private',
  'private',
])
const REQUIRED_SYNC_FIELDS = [
  'address',
  'address_zh',
  'website',
  'application_fee',
  'dining_nearby_detail',
  'tags',
  'structured_tags',
  'price_range',
]
const LOW_QUALITY_ALLOWLIST = new Set<string>([])
const BED_SIZE_REQUIRED_IDS = new Set([
  'allen',
  'bousefield',
  'busey-evans',
  'daniels',
  'far',
  'hopkins',
  'isr',
  'lar',
  'nugent',
  'par',
  'scott',
  'sherman',
  'snyder',
  'taft',
  'van-doren',
  'wassaja',
  'weston',
])
const GENDER_INCLUSIVE_IDS = new Set([
  'allen',
  'bousefield',
  'daniels',
  'far',
  'isr',
  'nugent',
  'par',
  'sherman',
  'snyder',
  'wassaja',
  'weston',
])
const COMPUTER_LAB_IDS = new Set([
  'allen',
  'armory',
  'bousefield',
  'bromley',
  'busey-evans',
  'daniels',
  'far',
  'hendrick',
  'hopkins',
  'illini-tower',
  'isr',
  'lar',
  'newman',
  'nugent',
  'par',
  'scott',
  'sherman',
  'snyder',
  'taft',
  'van-doren',
  'wassaja',
  'weston',
])
const LIBRARY_IDS = new Set([
  'bousefield',
  'hopkins',
  'newman',
  'scott',
  'taft',
  'van-doren',
  'wassaja',
  'weston',
])
const FLOOR_PLAN_SQFT_ALLOWLIST: Record<string, Set<string>> = {
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

const errors: string[] = []

function check(condition: unknown, message: string) {
  if (!condition) {
    errors.push(message)
  }
}

function getDormBathroomScopes(dormId: string) {
  const dorm = UIUC_DORMS.find((item) => item.id === dormId)
  return new Set((dorm?.floorPlans ?? []).map((plan) => plan.bathroomScope))
}

function checkDormBathroomScopes(
  dormId: string,
  expectedScopes: string[],
  message: string
) {
  const actualScopes = Array.from(getDormBathroomScopes(dormId)).sort()
  const expected = [...expectedScopes].sort()
  check(
    JSON.stringify(actualScopes) === JSON.stringify(expected),
    `${message}. Expected ${expected.join(', ')}, got ${actualScopes.join(', ') || 'none'}.`
  )
}

function checkMediaUrl(dormId: string, slot: string, url: string) {
  check(
    LOW_QUALITY_ALLOWLIST.has(url) || !isLikelyLowQualityMediaUrl(url),
    `${dormId} uses a low-quality media URL in ${slot}: ${url}`
  )
  check(
    !hasPeopleishFilename(url),
    `${dormId} uses a likely people-containing media URL in ${slot}: ${url}`
  )
}

const actualIds = UIUC_DORMS.map((dorm) => dorm.id).sort()
check(
  UIUC_DORMS.length === 23,
  `Expected 23 dorms but found ${UIUC_DORMS.length}.`
)
check(
  JSON.stringify(actualIds) === JSON.stringify(EXPECTED_IDS),
  'Dorm ID set changed unexpectedly.'
)

for (const dorm of UIUC_DORMS) {
  check(
    !dorm.imageUrl.includes('picsum.photos'),
    `${dorm.id} still uses a placeholder hero image.`
  )
  checkMediaUrl(dorm.id, 'imageUrl', dorm.imageUrl)
  check(
    (dorm.galleryImages?.length ?? 0) > 0,
    `${dorm.id} is missing gallery images.`
  )
  for (const [index, url] of (dorm.galleryImages ?? []).entries()) {
    checkMediaUrl(dorm.id, `galleryImages[${index}]`, url)
  }
  check(Boolean(dorm.address), `${dorm.id} is missing an address.`)
  check(Boolean(dorm.website), `${dorm.id} is missing a website.`)
  check(
    getDormPriceRange(dorm.price) === dorm.priceRange,
    `${dorm.id} has an unsynchronized priceRange.`
  )

  const categorized = dorm.categorizedTags
  for (const tag of [
    ...(categorized.livingConditions ?? []),
    ...(categorized.facilities ?? []),
    ...(categorized.lifestyle ?? []),
  ]) {
    check(
      VALID_TAGS.has(tag),
      `${dorm.id} uses invalid categorized tag "${tag}".`
    )
  }

  for (const llc of categorized.llcNames ?? []) {
    check(
      VALID_LLCS.has(llc as (typeof LLC_OPTIONS)[number]),
      `${dorm.id} uses unknown LLC "${llc}".`
    )
  }

  const hasGenderInclusive = categorized.lifestyle.includes('genderInclusive')
  const hasComputerLab = categorized.facilities.includes('computerLab')
  const hasLibrary = categorized.facilities.includes('library')
  check(
    hasGenderInclusive === GENDER_INCLUSIVE_IDS.has(dorm.id),
    `${dorm.id} has unexpected genderInclusive tag state.`
  )
  check(
    hasComputerLab === COMPUTER_LAB_IDS.has(dorm.id),
    `${dorm.id} has unexpected computerLab tag state.`
  )
  check(
    hasLibrary === LIBRARY_IDS.has(dorm.id),
    `${dorm.id} has unexpected library tag state.`
  )

  check(
    (dorm.floorPlans?.length ?? 0) > 0,
    `${dorm.id} is missing floor plans.`
  )
  for (const plan of dorm.floorPlans ?? []) {
    check(!plan.imageUrl, `${dorm.id} still uses legacy floorPlans.imageUrl.`)
    check(!plan.photoUrl, `${dorm.id} still uses legacy floorPlans.photoUrl.`)
    check(
      plan.bathroomScope != null,
      `${dorm.id} has a floor plan without bathroomScope.`
    )
    if (plan.bathroomScope != null) {
      check(
        VALID_BATHROOM_SCOPES.has(plan.bathroomScope),
        `${dorm.id} uses invalid bathroomScope "${plan.bathroomScope}".`
      )
    }
    if (plan.price != null) {
      check(
        Number.isFinite(plan.price) && plan.price > 0,
        `${dorm.id} has an invalid floor plan price value.`
      )
    }
    if (plan.sqft != null) {
      check(
        Number.isFinite(plan.sqft) && plan.sqft > 0,
        `${dorm.id} has an invalid floor plan sqft value.`
      )
      const allowedNames =
        FLOOR_PLAN_SQFT_ALLOWLIST[dorm.id] ?? new Set<string>()
      const planName = plan.officialName ?? plan.labelCode ?? plan.type
      check(
        Boolean(planName) && allowedNames.has(planName),
        `${dorm.id} keeps sqft on an unapproved floor plan (${planName ?? 'unknown'}).`
      )
    }
    if (BED_SIZE_REQUIRED_IDS.has(dorm.id)) {
      check(
        Boolean(plan.bedSize),
        `${dorm.id} has a floor plan without bedSize.`
      )
    }
    if (plan.bedSize != null) {
      check(
        VALID_BED_SIZES.has(plan.bedSize),
        `${dorm.id} uses invalid bedSize "${plan.bedSize}".`
      )
    }
    for (const [index, url] of (plan.photoUrls ?? []).entries()) {
      checkMediaUrl(dorm.id, `floorPlans.photoUrls[${index}]`, url)
    }
    for (const [index, url] of (plan.imageUrls ?? []).entries()) {
      checkMediaUrl(dorm.id, `floorPlans.imageUrls[${index}]`, url)
    }
    if (plan.labelCode == null) {
      console.warn(`Warning: ${dorm.id} has a floor plan without labelCode.`)
    }
  }
}

const allen = UIUC_DORMS.find((dorm) => dorm.id === 'allen')
const weston = UIUC_DORMS.find((dorm) => dorm.id === 'weston')
const newman = UIUC_DORMS.find((dorm) => dorm.id === 'newman')
const presby = UIUC_DORMS.find((dorm) => dorm.id === 'presby')

check(Boolean(allen), 'allen dorm is missing from static data.')
check(
  Boolean(allen) &&
    allen!.categorizedTags.lifestyle.includes('genderInclusive') &&
    allen!.categorizedTags.facilities.includes('computerLab') &&
    !allen!.categorizedTags.facilities.includes('library'),
  'allen should have genderInclusive and computerLab, but not library.'
)
check(Boolean(weston), 'weston dorm is missing from static data.')
check(
  Boolean(weston) &&
    weston!.categorizedTags.lifestyle.includes('genderInclusive') &&
    weston!.categorizedTags.facilities.includes('computerLab') &&
    weston!.categorizedTags.facilities.includes('library'),
  'weston should have genderInclusive, computerLab, and library.'
)
check(Boolean(newman), 'newman dorm is missing from static data.')
check(
  Boolean(newman) &&
    !newman!.categorizedTags.lifestyle.includes('genderInclusive') &&
    newman!.categorizedTags.facilities.includes('computerLab') &&
    newman!.categorizedTags.facilities.includes('library'),
  'newman should have computerLab and library, but not genderInclusive.'
)
check(Boolean(presby), 'presby dorm is missing from static data.')
check(
  Boolean(presby) &&
    !presby!.categorizedTags.lifestyle.includes('genderInclusive') &&
    !presby!.categorizedTags.facilities.includes('computerLab') &&
    !presby!.categorizedTags.facilities.includes('library'),
  'presby should not have genderInclusive, computerLab, or library.'
)
checkDormBathroomScopes(
  'isr',
  ['individual-use'],
  'isr should only expose individual-use floor plans'
)
checkDormBathroomScopes(
  'par',
  ['individual-use'],
  'par should only expose individual-use floor plans'
)
checkDormBathroomScopes(
  'wassaja',
  ['individual-use', 'private'],
  'wassaja should expose individual-use and private floor plans'
)
checkDormBathroomScopes(
  'nugent',
  ['communal', 'individual-use', 'private'],
  'nugent should expose communal, individual-use, and private floor plans'
)
checkDormBathroomScopes(
  'daniels',
  ['individual-use', 'semi-private'],
  'daniels should expose individual-use and semi-private floor plans'
)

const repoRoot = process.cwd()
const seedScript = fs.readFileSync(
  path.join(repoRoot, 'scripts', 'seed-dorms-table.ts'),
  'utf8'
)
const adminService = fs.readFileSync(
  path.join(repoRoot, 'src', 'services', 'dormAdminService.ts'),
  'utf8'
)
const dormService = fs.readFileSync(
  path.join(repoRoot, 'src', 'services', 'dormService.ts'),
  'utf8'
)
const mediaTab = fs.readFileSync(
  path.join(
    repoRoot,
    'src',
    'components',
    'housing',
    'edit-panel',
    'MediaTab.tsx'
  ),
  'utf8'
)
const editForm = fs.readFileSync(
  path.join(
    repoRoot,
    'src',
    'components',
    'housing',
    'edit-panel',
    'useDormEditForm.ts'
  ),
  'utf8'
)

for (const field of REQUIRED_SYNC_FIELDS) {
  check(
    seedScript.includes(field),
    `Seed script is missing sync field "${field}".`
  )
  check(
    adminService.includes(field),
    `Admin service is missing sync field "${field}".`
  )
}

check(
  seedScript.includes('sanitizeFloorPlansForStorage'),
  'Seed script does not sanitize floor_plans.'
)
check(
  seedScript.includes('mergeFloorPlans'),
  'Seed script does not preserve admin-managed floor plan media.'
)
check(
  seedScript.includes('getPersistedBathroomType'),
  'Seed script does not persist bathroom_type safely.'
)
check(
  adminService.includes('sanitizeFloorPlansForStorage'),
  'Admin service does not sanitize floor_plans.'
)
check(
  adminService.includes('getPersistedBathroomType'),
  'Admin service does not persist bathroom_type safely.'
)
check(
  dormService.includes('sanitizeFloorPlansForStorage'),
  'Dorm service does not sanitize floor_plans from DB rows.'
)
check(
  editForm.includes('sanitizeFloorPlansForStorage'),
  'Admin edit form does not sanitize floor_plans before save.'
)
check(
  editForm.includes('getPersistedBathroomType'),
  'Admin edit form does not persist bathroom_type safely.'
)
check(
  mediaTab.includes('officialName'),
  'Admin media tab does not expose official room names.'
)
check(
  !mediaTab.includes('photoUrl: urls[0]'),
  'Admin media tab still writes legacy floorPlans.photoUrl.'
)
check(
  !mediaTab.includes('imageUrl: urls[0]'),
  'Admin media tab still writes legacy floorPlans.imageUrl.'
)

if (errors.length > 0) {
  console.error('Dorm data validation failed:\n')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`Dorm data validation passed for ${UIUC_DORMS.length} dorms.`)
