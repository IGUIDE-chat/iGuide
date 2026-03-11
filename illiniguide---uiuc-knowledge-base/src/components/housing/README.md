# Housing Module README

This file is the local contract for `src/components/housing/`.

Use this file when changing dorm data, dorm media, floor-plan structure, dorm
filters, admin editing, or Supabase sync behavior.

If this file conflicts with project-level rules, follow:

1. `AGENTS.md`
2. this file
3. `docs/DORM_DATA_AUDIT.md`

## Scope

This module owns:

- dorm list and dorm detail UI
- dorm map and filters
- dorm admin edit panel UI
- housing-specific constants, types, and store code under this directory

This module does not own:

- Supabase client initialization
- shared app auth/session behavior
- generic shared utilities unrelated to housing

## Source of Truth

### Dorm data

The active dorm dataset is exported from:

- `src/components/housing/constants/dormData.ts`

But the current factual refresh layer is applied through:

- `src/components/housing/constants/dormOfficialOverrides.ts`
- `src/components/housing/constants/dormOfficialOverridesUrhNorth.ts`
- `src/components/housing/constants/dormOfficialOverridesUrhSouth.ts`
- `src/components/housing/constants/dormOfficialOverridesPch.ts`

Practical rule:

- Treat `RAW_UIUC_DORMS` as base inventory and fallback scaffolding.
- Treat the official override files as the place for source-backed factual
  corrections, media refreshes, price fixes, room-name fixes, and floor-plan
  fixes.

### Canonical normalization

These functions finalize dorm records and storage-safe floor plans:

- `src/utils/dormData.ts`
- `src/utils/roomOptions.ts`

Never bypass these helpers when changing floor-plan shape or derived room data.

### Audit trail

All uncertain, missing, removed, or source-limited dorm facts MUST be recorded
in:

- `docs/DORM_DATA_AUDIT.md`

## Non-Negotiable Rules

1. ALWAYS use official sources for dorm facts, media, floor plans, prices, and
   room naming.
2. NEVER guess `sqft`, prices, tags, bathroom scope, LLC names, or official
   room names.
3. NEVER keep a stale value just because the UI already supports it.
   If the current value cannot be source-backed, remove it and record the gap in
   `docs/DORM_DATA_AUDIT.md`.
4. ALWAYS keep `tags`, `structuredTags`, and `categorizedTags` synchronized.
   `categorizedTags` is the structured source; legacy `tags` must still be kept
   in sync for the current app and DB.
5. ALWAYS keep `priceRange` synchronized with `price`.
   Do not hand-edit `priceRange` independently.
6. ALWAYS use `officialName`, `imageUrls`, and `photoUrls` for floor plans.
   Legacy `imageUrl` and `photoUrl` are migration-only compatibility fields and
   must not be written back by new code.
7. NEVER add placeholder media such as `picsum.photos`.
8. NEVER add non-official dorm media in this module unless the user explicitly
   changes the sourcing policy.
9. ALWAYS prefer fewer images over people-containing or clearly blurry images.
10. NEVER rename or change the 23 canonical dorm IDs without an explicit product
    decision.

## Data-Shape Rules

### Floor plans

When editing `FloorPlan`:

- `officialName` is the property/site-published room name.
- `labelCode`, `bedCount`, `bathroomCount`, and `bathroomScope` power filtering
  and comparison.
- `price` is annual price in USD.
- `sqft` must exist only if the source explicitly publishes a single square
  footage value for that exact plan.
- `imageUrls` is for layout/floor-plan diagrams.
- `photoUrls` is for room photos.

If the source only gives:

- room dimensions
- a range such as `465-560`
- phrases such as `over 145 square feet`

then DO NOT store that as structured `sqft`.

### Aggregated dorms

These IDs are intentionally aggregated records and MUST stay aggregated unless
product requirements change:

- `isr`
- `busey-evans`
- `par`
- `far`
- `lar`

For these records:

- merge source-backed differences carefully
- record hall-specific caveats in `docs/DORM_DATA_AUDIT.md`
- do not split them into new IDs ad hoc

## Required Sync Chain

If you change dorm data fields, floor-plan shape, media fields, or admin-save
behavior, review all of these together:

- `src/components/housing/constants/dormData.ts`
- `src/components/housing/constants/dormOfficialOverrides*.ts`
- `src/components/housing/types/index.ts`
- `src/utils/dormData.ts`
- `src/utils/roomOptions.ts`
- `src/services/dormService.ts`
- `src/services/dormAdminService.ts`
- `src/components/housing/edit-panel/useDormEditForm.ts`
- `src/components/housing/edit-panel/MediaTab.tsx`
- `scripts/seed-dorms-table.ts`
- `scripts/validate-dorm-data.ts`
- `docs/DORM_DATA_AUDIT.md`

Do not change only the static JSON shape and assume admin or seed will keep up.

## UI and Admin Rules

1. The public UI may display official room names, but comparison logic must
   still rely on normalized structured fields.
2. The admin editor must sanitize floor plans before save.
3. The admin editor must not reintroduce legacy single-image fields.
4. Reset-to-static must restore the same fields that seed writes.
5. Dorm reads from Supabase must preserve the same field contract as static
   fallback data.

## Validation and Checks

When you change housing data or contracts, run:

```bash
npm run validate:dorm-data
```

Run this too when media sourcing or media quality rules changed:

```bash
npm run audit:dorm-media
```

Run this when imports, types, or UI structure changed:

```bash
npm run build
```

## Safe Edit Patterns

### Safe factual correction

- Update the relevant override file.
- Keep or remove the value based on source certainty.
- Record any ambiguity in `docs/DORM_DATA_AUDIT.md`.
- Run validation.

### Safe floor-plan schema change

- Update `src/components/housing/types/index.ts`.
- Update sanitization in `src/utils/dormData.ts`.
- Update DB read/write code in `dormService` and `dormAdminService`.
- Update admin edit UI.
- Update `scripts/seed-dorms-table.ts`.
- Update `scripts/validate-dorm-data.ts`.

## Known Pitfalls

- The repo still contains older scaffold data inside `RAW_UIUC_DORMS`.
  Do not assume the first visible literal is the current truth; overrides may
  replace it later in the pipeline.
- Old DB/storage compatibility paths still exist.
  If you do not update both read and write paths, admin edits can silently
  regress data shape.
- `docs/DORM_DATA_AUDIT.md` is part of the contract, not optional narrative.
  If information is uncertain or unavailable, write that down there instead of
  inventing a value.
