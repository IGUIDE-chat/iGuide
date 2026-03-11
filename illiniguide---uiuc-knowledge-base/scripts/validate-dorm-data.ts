import fs from 'node:fs';
import path from 'node:path';
import { UIUC_DORMS } from '../src/components/housing/constants/dormData';
import { TAGS_BY_CATEGORY, LLC_OPTIONS } from '../src/components/housing/constants/metadata';
import {
    hasPeopleishFilename,
    isLikelyLowQualityMediaUrl,
} from '../src/components/housing/constants/dormOfficialOverrideUtils';
import { getDormPriceRange } from '../src/utils/dormData';

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
].sort();

const VALID_TAGS = new Set([
    ...TAGS_BY_CATEGORY.livingConditions,
    ...TAGS_BY_CATEGORY.facilities,
    ...TAGS_BY_CATEGORY.lifestyle,
]);
const VALID_LLCS = new Set(LLC_OPTIONS);
const REQUIRED_SYNC_FIELDS = [
    'address',
    'address_zh',
    'website',
    'application_fee',
    'dining_nearby_detail',
    'tags',
    'structured_tags',
    'price_range',
];
const LOW_QUALITY_ALLOWLIST = new Set<string>([]);

const errors: string[] = [];

function check(condition: unknown, message: string) {
    if (!condition) {
        errors.push(message);
    }
}

function checkMediaUrl(dormId: string, slot: string, url: string) {
    check(
        LOW_QUALITY_ALLOWLIST.has(url) || !isLikelyLowQualityMediaUrl(url),
        `${dormId} uses a low-quality media URL in ${slot}: ${url}`,
    );
    check(!hasPeopleishFilename(url), `${dormId} uses a likely people-containing media URL in ${slot}: ${url}`);
}

const actualIds = UIUC_DORMS.map((dorm) => dorm.id).sort();
check(UIUC_DORMS.length === 23, `Expected 23 dorms but found ${UIUC_DORMS.length}.`);
check(JSON.stringify(actualIds) === JSON.stringify(EXPECTED_IDS), 'Dorm ID set changed unexpectedly.');

for (const dorm of UIUC_DORMS) {
    check(!dorm.imageUrl.includes('picsum.photos'), `${dorm.id} still uses a placeholder hero image.`);
    checkMediaUrl(dorm.id, 'imageUrl', dorm.imageUrl);
    check((dorm.galleryImages?.length ?? 0) > 0, `${dorm.id} is missing gallery images.`);
    for (const [index, url] of (dorm.galleryImages ?? []).entries()) {
        checkMediaUrl(dorm.id, `galleryImages[${index}]`, url);
    }
    check(Boolean(dorm.address), `${dorm.id} is missing an address.`);
    check(Boolean(dorm.website), `${dorm.id} is missing a website.`);
    check(getDormPriceRange(dorm.price) === dorm.priceRange, `${dorm.id} has an unsynchronized priceRange.`);

    const categorized = dorm.categorizedTags;
    for (const tag of [
        ...(categorized.livingConditions ?? []),
        ...(categorized.facilities ?? []),
        ...(categorized.lifestyle ?? []),
    ]) {
        check(VALID_TAGS.has(tag), `${dorm.id} uses invalid categorized tag "${tag}".`);
    }

    for (const llc of categorized.llcNames ?? []) {
        check(VALID_LLCS.has(llc as (typeof LLC_OPTIONS)[number]), `${dorm.id} uses unknown LLC "${llc}".`);
    }

    check((dorm.floorPlans?.length ?? 0) > 0, `${dorm.id} is missing floor plans.`);
    for (const plan of dorm.floorPlans ?? []) {
        check(!plan.imageUrl, `${dorm.id} still uses legacy floorPlans.imageUrl.`);
        check(!plan.photoUrl, `${dorm.id} still uses legacy floorPlans.photoUrl.`);
        check(plan.bathroomScope != null, `${dorm.id} has a floor plan without bathroomScope.`);
        if (plan.sqft != null) {
            check(Number.isFinite(plan.sqft) && plan.sqft > 0, `${dorm.id} has an invalid floor plan sqft value.`);
        }
        for (const [index, url] of (plan.photoUrls ?? []).entries()) {
            checkMediaUrl(dorm.id, `floorPlans.photoUrls[${index}]`, url);
        }
        for (const [index, url] of (plan.imageUrls ?? []).entries()) {
            checkMediaUrl(dorm.id, `floorPlans.imageUrls[${index}]`, url);
        }
        if (plan.labelCode == null) {
            console.warn(`Warning: ${dorm.id} has a floor plan without labelCode.`);
        }
    }
}

const repoRoot = process.cwd();
const seedScript = fs.readFileSync(path.join(repoRoot, 'scripts', 'seed-dorms-table.ts'), 'utf8');
const adminService = fs.readFileSync(path.join(repoRoot, 'src', 'features', 'housing', 'api', 'dormAdminService.ts'), 'utf8');
const dormService = fs.readFileSync(path.join(repoRoot, 'src', 'features', 'housing', 'api', 'dormService.ts'), 'utf8');
const mediaTab = fs.readFileSync(path.join(repoRoot, 'src', 'features', 'housing', 'components', 'edit-panel', 'MediaTab.tsx'), 'utf8');
const editForm = fs.readFileSync(path.join(repoRoot, 'src', 'features', 'housing', 'components', 'edit-panel', 'useDormEditForm.ts'), 'utf8');

for (const field of REQUIRED_SYNC_FIELDS) {
    check(seedScript.includes(field), `Seed script is missing sync field "${field}".`);
    check(adminService.includes(field), `Admin service is missing sync field "${field}".`);
}

check(seedScript.includes('sanitizeFloorPlansForStorage'), 'Seed script does not sanitize floor_plans.');
check(adminService.includes('sanitizeFloorPlansForStorage'), 'Admin service does not sanitize floor_plans.');
check(dormService.includes('sanitizeFloorPlansForStorage'), 'Dorm service does not sanitize floor_plans from DB rows.');
check(editForm.includes('sanitizeFloorPlansForStorage'), 'Admin edit form does not sanitize floor_plans before save.');
check(mediaTab.includes('officialName'), 'Admin media tab does not expose official room names.');
check(!mediaTab.includes('photoUrl: urls[0]'), 'Admin media tab still writes legacy floorPlans.photoUrl.');
check(!mediaTab.includes('imageUrl: urls[0]'), 'Admin media tab still writes legacy floorPlans.imageUrl.');

if (errors.length > 0) {
    console.error('Dorm data validation failed:\n');
    for (const error of errors) {
        console.error(`- ${error}`);
    }
    process.exit(1);
}

console.log(`Dorm data validation passed for ${UIUC_DORMS.length} dorms.`);
