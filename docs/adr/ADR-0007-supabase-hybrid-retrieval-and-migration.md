# ADR-0007: Move hybrid retrieval toward a Supabase-native path and retire QMD from the primary production path

## Status

Accepted

## Date

2026-04-19

## Context

The repo currently carries two retrieval worlds:

- a newer Supabase-native hybrid retrieval path in `api/src/tools/search-knowledge-base.ts`, backed by `documents`, `document_chunks`, pgvector, and PostgreSQL full-text search
- an older QMD-based search path, still deployed as a standalone service/VPS boundary and fed by generated markdown plus QMD CLI indexing

That split is operationally awkward and inconsistent with the repo's serverless-first direction. It also preserves different storage and indexing assumptions at the same time:

- QMD is filesystem-first, SQLite/FTS5/sqlite-vec based, and tightly coupled to local indexing/runtime behavior.
- The active runtime direction is Worker + Supabase, where retrieval should live behind server-side tools and managed data infrastructure.

Research during this decision showed that QMD is valuable as a retrieval design reference, especially for chunking, fusion, and ranking ideas, but its implementation is not a clean fit for the Supabase-centered runtime.

## Decision

Adopt a **Supabase-native hybrid retrieval path** as the long-term production retrieval backend and treat QMD as transitional infrastructure during migration.

The migration stance is:

- **Short term:** keep QMD operational as a temporary sidecar for compatibility, result comparison, and rollback safety.
- **Medium term:** mirror ingestion and compare retrieval quality while Supabase-native hybrid retrieval is tuned toward acceptable parity.
- **Long term:** retire QMD from the primary production retrieval path after parity is demonstrated.

The migration rule is:

- port QMD's useful retrieval ideas and ranking behavior where they remain valuable
- do **not** lift-and-shift QMD's filesystem-first SQLite implementation into the new stack

Supabase-native hybrid retrieval should remain grounded in:

- PostgreSQL full-text search for lexical retrieval
- pgvector for semantic retrieval
- reciprocal rank fusion and ranking tuning in SQL/RPC or tool-layer orchestration
- async ingestion/indexing rather than local CLI reindexing as the primary operational model

## Alternatives Considered

- **Keep QMD as a permanent primary retrieval subsystem alongside Supabase**  
  Plausible because QMD already works, supports hybrid retrieval, and remains wired into legacy flows. Rejected because it preserves a second operational stack, keeps the architecture split across incompatible storage models, and conflicts with the repo's serverless-first direction.

- **Lift QMD's SQLite/filesystem design directly into Supabase**  
  Plausible because QMD already implements hybrid retrieval concepts such as chunking, fusion, and ranking. Rejected because QMD is tightly coupled to filesystem collection scanning, SQLite FTS5, sqlite-vec, and local model/runtime assumptions that do not map cleanly onto the Worker + Supabase stack.

- **Replace QMD immediately with a big-bang cutover**  
  Plausible because the repo already has `documents`, `document_chunks`, and hybrid search RPCs. Rejected because ranking parity, ingestion parity, and legacy-flow compatibility still need staged validation.

## Consequences

- **Benefits**
  - Aligns retrieval with the active Worker + Supabase production architecture.
  - Reduces long-term operational complexity by converging on one primary retrieval substrate.
  - Preserves the useful parts of QMD as ideas and evaluation targets without inheriting its filesystem/SQLite deployment model.
  - Supports a safer migration through mirror, shadow, and canary patterns rather than an abrupt cutover.

- **Costs**
  - Retrieval parity work is required, including chunking, weighting, ranking, and fallback tuning.
  - Some content will temporarily exist in both the old QMD path and the new Supabase-native path.
  - Legacy client/search flows that currently assume QMD result shapes will need migration or retirement.

- **Risks**
  - If ranking and relevance evaluation are weak, the Supabase-native path may regress answer quality.
  - If migration takes too long, the system may carry two partially overlapping retrieval stacks longer than intended.
  - If the Supabase-native path reproduces only storage but not the important retrieval behaviors, parity may look better on paper than in user experience.

- **Constraints Created**
  - QMD should be treated as a temporary compatibility layer, not as the future canonical backend.
  - Migration should prefer mirror/shadow/canary cutover over immediate full replacement.
  - Retrieval tuning work must be treated as part of the migration, not as optional polish after cutover.

## Revisit Triggers

- Supabase-native hybrid retrieval fails to reach acceptable ranking and coverage parity even after shadow comparison and tuning.
- The product proves to need QMD-only capabilities that PostgreSQL/pgvector cannot reasonably reproduce without unacceptable complexity.
- Operational constraints show that a dedicated retrieval sidecar remains materially safer or cheaper than unifying on Supabase.
- The legacy browser-side QMD path is fully retired and a later ADR wants to narrow or supersede the migration stance.

## Related

- `docs/adr/ADR-0004-hybrid-data-model.md`
- `docs/adr/ADR-0006-source-first-base-layer.md`
- `README.md`
- `api/src/index.ts`
- `api/src/tools/search-knowledge-base.ts`
- `app/src/services/searchService.ts`
- `app/src/services/chatRagService.ts`
- `app/scripts/generate-qmd-markdown.ts`
- `app/scripts/sync-qmd-index.ts`
- `app/scripts/qmd-server.mjs`
- `scripts/import-to-supabase.ts`
- `supabase/migrations/001_create_documents.sql`
- `supabase/migrations/002_chunks_and_rls.sql`
- `supabase/migrations/003_search_functions.sql`
