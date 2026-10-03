// The package's whole public surface. Hosts import from here, never from deeper paths.

// Worker-side dorm API. The host mounts this sub-app and injects per-request
// dependencies through the `dormDeps` context key.
export { createDormApi } from "./worker/app.ts"
export { asDormSupabase, dormDeps } from "./worker/deps.ts"
export type {
  DormApiDeps,
  DormContext,
  DormDbError,
  DormEnv,
  DormFilterBuilder,
  DormIdentity,
  DormResult,
  DormRow,
  DormStorageBucket,
  DormSupabase,
  DormTableClient,
  IdentityResult,
} from "./worker/deps.ts"
export type { DormApiErrorOptions, DormErrorBody } from "./worker/errors.ts"

// Row and mutation shapes the repositories own. The SPA talks to the API, so
// these are the canonical definitions on its side too: it never sees a
// snake_case database row.
export type { DormComment, DormCommentStats, DormVote } from "./worker/repositories/commentsRepo.ts"
export type { DormFavorite } from "./worker/repositories/favoritesRepo.ts"
export type { DormViewingHistory } from "./worker/repositories/historyRepo.ts"
export type {
  DormImageUploadResult,
  DormMutationResult,
  DormUpdate,
  EditHistoryEntry,
} from "./worker/repositories/dormsRepo.ts"

// The dorm domain's data model and its normalization rules. The worker's
// write path needs both (`dormsRepo` maps rows and re-derives stored values
// through them), so they live here rather than in the SPA; `apps/web` imports
// them from `@iguide/dorm` instead of keeping a second copy.
export type {
  BathroomCountFilter,
  BathroomScope,
  BathroomType,
  BedCountFilter,
  BedSize,
  ChatMessage,
  DiningType,
  Dorm,
  DormCategorizedTags,
  DormTag,
  DormTags,
  FacilityTag,
  FloorPlan,
  LifestyleTag,
  LivingConditionTag,
  RoomOption,
  RoomType,
  TagCategory,
} from "./types.ts"
export { FilterOption } from "./types.ts"
export {
  buildLegacyDormTags,
  finalizeDormRecord,
  getDormPriceRange,
  normalizeCategorizedTags,
  sanitizeFloorPlanForStorage,
  sanitizeFloorPlansForStorage,
} from "./utils/dormData.ts"
export type { RoomOptionLabels, RoomRangeSummary } from "./utils/roomOptions.ts"
export {
  buildRoomLabelCode,
  deriveRoomOptions,
  getBathroomScopeLabel,
  getBathroomTagLabel,
  getBedCountLabel,
  getDormBathroomSummary,
  getDormBathroomTagSummary,
  getPersistedBathroomType,
  getRoomCodeLabel,
  getRoomDetailLabel,
  getRoomDisplayLabel,
  getRoomOptionKey,
  getRoomOptionLabels,
  getRoomRangeSummary,
  getRoomTypeCountLabel,
  getStorageBathroomScope,
  normalizeDorm,
  normalizeFloorPlan,
} from "./utils/roomOptions.ts"
