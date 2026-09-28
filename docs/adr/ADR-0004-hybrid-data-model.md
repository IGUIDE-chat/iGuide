# ADR-0004: Use a hybrid data model for the campus assistant

## Status

Accepted

## Date

2026-04-18

## Context

The product is evolving from a single-RAG knowledge system into a function-call-first campus assistant with multiple information paths. The active runtime already centers on an internal tool registry in `api/`, with `search_knowledge_base`, `web_search`, `grep_docs`, and curated skills/tools acting as separate execution paths.

The main design tension is between structure and coverage. A heavily normalized, object-first schema across the whole campus domain would look clean on paper, but it would push the system toward a school-specific SIS-style backend, make ingestion brittle across institutions, and force many joins for tool calls. A pure source-first model would be easier to extend across schools, but it would weaken high-accuracy tasks that need complete, filterable indexes such as course lookup, housing comparison, campus location lookup, and academic calendar queries.

Another tension is freshness. Some information is stable enough to serve from local structured storage by default, while other information such as news, announcements, policy updates, and most events is too time-sensitive to treat a database snapshot as the primary current-truth source.

## Decision

Use a **hybrid campus assistant data model** with three explicit behavior layers:

1. **Object-first for a small set of high-value stable domains**
   - `course`
   - `course_offering`
   - `housing`
   - `location_or_service`
   - `academic_calendar_item`

2. **Source-first for most other campus information**
   - narrative guides
   - FAQ pages
   - faculty and department pages
   - most student-life content
   - most organization and procedural content

3. **Freshness-aware routing for volatile information**
   - news
   - announcements
   - policy updates
   - most events

Volatile information may be stored locally as archive, cache, or audit evidence, but the local database snapshot is not the default primary source for current-answer retrieval. These domains should prefer live or hybrid retrieval paths before archived local records.

The schema and tool layer should therefore distinguish not only object-first versus source-first, but also retrieval intent such as:

- `local_first`
- `live_first`
- `local_with_live_verify`
- `archive_only`

The long-tail fallback remains hybrid retrieval over indexed source content, including QMD/RAG-style search for content that is not explicitly modeled as a first-class object.

## Alternatives Considered

- **Model the whole campus domain as object-first**  
  Plausible because it promises strong structure, filtering, and deterministic tool behavior. Rejected because it would push the system toward a school-specific administrative backend, increase schema coupling, and make cross-school expansion materially harder.

- **Keep everything source-first and rely on retrieval plus RAG fallback**  
  Plausible because it is the easiest way to ingest heterogeneous information across institutions. Rejected because it would not provide reliable complete indexes for high-accuracy domains like courses, housing, locations, and academic calendar items.

- **Split the product into separate structured and unstructured subsystems with no shared routing model**  
  Plausible because it keeps each subsystem conceptually pure. Rejected because the assistant still needs one coherent tool-selection model that can choose among structured objects, archived sources, and live retrieval paths.

## Consequences

- **Benefits**
  - Keeps the schema extensible across schools by limiting object-first modeling to a small number of stable domains.
  - Improves answer quality for high-value tasks by giving the model precise structured indexes where they matter most.
  - Preserves broad coverage through source-first ingestion and RAG fallback for long-tail content.
  - Makes freshness a first-class retrieval concern instead of assuming all stored content is equally current.

- **Costs**
  - The system intentionally uses more than one data access pattern.
  - Tool routing becomes more policy-aware because it must account for both structure and freshness.
  - Some information may exist in both structured object form and source/archive form.

- **Risks**
  - Future contributors may over-expand the object-first layer and recreate a heavy campus ERP-style schema.
  - If freshness rules are weak, archived volatile content may still be mistaken for current facts.
  - If object and source representations drift, answer quality and trust can degrade.

- **Constraints Created**
  - Only the approved stable domains should receive first-class object modeling by default.
  - Volatile domains must not default to archived local records for current-answer retrieval.
  - Source/object records need enough metadata to support explicit retrieval policy and freshness decisions.

## Revisit Triggers

- Cross-school rollout shows that one or more object-first domains cannot be modeled with a stable shared core.
- Product usage shows that additional domains repeatedly need complete structured indexes rather than source-first retrieval.
- A live-ingestion layer becomes mature enough that some currently archived-first or source-first domains should move to stronger structured treatment.
- The tool layer gains enough deterministic filtering and live verification support that the current source/object boundary is no longer the best tradeoff.

## Related

- `README.md`
- `docs/reports/serverless-rag-technical-report.md`
- `docs/deployment/serverless-rag-runbook.md`
- `supabase/migrations/001_create_documents.sql`
- `supabase/migrations/002_chunks_and_rls.sql`
- `supabase/migrations/003_search_functions.sql`
