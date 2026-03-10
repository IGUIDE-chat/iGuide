import { UIUC_DORMS } from '../src/constants/housing/dormData';
import {
    hasPeopleishFilename,
    isLikelyLowQualityMediaUrl,
    normalizeOfficialMediaUrl,
} from '../src/constants/housing/dormOfficialOverrideUtils';

interface MediaEntry {
    dormId: string;
    slot: string;
    url: string;
}

function collectEntries() {
    const entries: MediaEntry[] = [];

    for (const dorm of UIUC_DORMS) {
        entries.push({ dormId: dorm.id, slot: 'imageUrl', url: dorm.imageUrl });

        for (const [index, url] of (dorm.galleryImages ?? []).entries()) {
            entries.push({ dormId: dorm.id, slot: `galleryImages[${index}]`, url });
        }

        for (const [planIndex, planValue] of (dorm.floorPlans ?? []).entries()) {
            for (const [photoIndex, url] of (planValue.photoUrls ?? []).entries()) {
                entries.push({
                    dormId: dorm.id,
                    slot: `floorPlans[${planIndex}].photoUrls[${photoIndex}]`,
                    url,
                });
            }

            for (const [imageIndex, url] of (planValue.imageUrls ?? []).entries()) {
                entries.push({
                    dormId: dorm.id,
                    slot: `floorPlans[${planIndex}].imageUrls[${imageIndex}]`,
                    url,
                });
            }
        }
    }

    return entries;
}

async function main() {
    const entries = collectEntries();
    const suspicious = entries
        .map((entry) => {
            const candidate = normalizeOfficialMediaUrl(entry.url);
            return {
                ...entry,
                candidate,
                lowQuality: isLikelyLowQualityMediaUrl(entry.url),
                peopleCue: hasPeopleishFilename(entry.url),
            };
        })
        .filter((entry) => entry.lowQuality || entry.peopleCue);

    if (suspicious.length === 0) {
        console.log(`Dorm media audit passed for ${entries.length} media URLs.`);
        return;
    }

    const checked = [];
    for (const entry of suspicious) {
        let headStatus: number | 'ERR' | undefined;
        if (entry.lowQuality && entry.candidate !== entry.url) {
            try {
                const response = await fetch(entry.candidate, { method: 'HEAD', redirect: 'follow' });
                headStatus = response.status;
            } catch {
                headStatus = 'ERR';
            }
        }

        checked.push({
            dormId: entry.dormId,
            slot: entry.slot,
            original: entry.url,
            candidate: entry.candidate !== entry.url ? entry.candidate : undefined,
            headStatus,
            reasons: [
                ...(entry.lowQuality ? ['low-quality-pattern'] : []),
                ...(entry.peopleCue ? ['people-filename-cue'] : []),
            ],
        });
    }

    console.error(JSON.stringify(checked, null, 2));
    process.exit(1);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
