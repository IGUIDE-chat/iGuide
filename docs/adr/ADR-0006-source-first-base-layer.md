# ADR-0006: Use a four-layer source-first base model

## Status

Accepted

## Date

2026-04-18

## Context

The campus assistant has already adopted a hybrid product model: a small number of high-value stable domains use object-first indexing, while most campus information remains source-first and volatile information must respect live-first retrieval rules. That higher-level direction is captured in ADR-0004, and the course-domain object boundary is captured in ADR-0005.

The next unresolved decision is the persistence shape underneath that hybrid model. The assistant needs a base layer that can express all of the following without collapsing back into one overloaded "documents" table:

- source identity
- source version over time
- multiple artifact forms derived from one source capture
- retrieval chunks as search-only derivatives
- archive versus current versus live-verified behavior
- source-grounded evidence for object-first records

The source layer also needs to support heterogeneous inputs such as webpages, RSS-like feeds, APIs, Google Maps-derived locations, manual imports, and imported legacy corpora without forcing every domain into one school-specific relational graph.

The main design pressure is not relational elegance. The design standard is that the model must be able to obtain a precise, complete, and explainable index through tools, while the data layer remains portable across schools and robust to uneven source quality.

## Decision

Adopt **a strict four-layer source-first base model** as the canonical persistence shape for source-derived knowledge:

1. **`sources`** — source definition and default retrieval/freshness policy
2. **`source_snapshots`** — time-versioned captures of a source
3. **`artifacts`** — multi-type content outputs derived from a snapshot
4. **`chunks`** — retrieval-only text slices derived from searchable artifacts

The four layers have distinct responsibilities:

- **`sources`** represent a stable source unit, usually equivalent to a crawl configuration or source configuration boundary such as `uiuc_course_catalog`, `uiuc_housing_site`, or `uiuc_calendar_feed`.
- **`source_snapshots`** represent one observed or imported version of a source at a point in time.
- **`artifacts`** represent concrete content carriers produced from a snapshot.
- **`chunks`** represent search slices produced from searchable artifacts.

The base model should follow these field and responsibility boundaries.

### `sources`

`sources` define the long-lived identity and default policy of a source. They should answer:

- what source this is
- which school/domain it belongs to
- how trustworthy it is
- whether it defaults to object-first, source-first, or hybrid treatment
- whether it should default to `local_first`, `live_first`, `local_with_live_verify`, or `archive_only`

Typical fields for `sources` should include:

- stable identity such as `id`, `school_id`, `source_key`, `name`
- source classification such as `source_kind`, `content_domain`, `authority_level`
- default policy such as `default_object_strategy`, `freshness_class`, `default_retrieval_policy`, `default_ttl_seconds`
- source location such as `base_url`, `feed_url`, `api_endpoint`, `map_provider_ref` as applicable
- operational metadata such as `is_active`, `metadata`, timestamps

`sources` should not store authoritative content bodies.

### `source_snapshots`

`source_snapshots` capture one source version or observed state. They should answer:

- what was captured
- when it was captured
- whether it is current, expired, archived, or outdated
- what source-side verification metadata exists

Typical fields for `source_snapshots` should include:

- stable identity such as `id`, `source_id`, `snapshot_key`
- capture metadata such as `capture_mode`, `capture_status`, `captured_at`, `last_verified_at`
- currentness metadata such as `expires_at`, `valid_from`, `valid_to`, `is_current`, `is_archived`, `is_outdated`, `archive_reason`
- source version metadata such as `canonical_url`, `source_last_modified`, `etag`, `content_hash`, `raw_metadata`

Freshness and archive semantics belong here rather than only in tool logic.

### `artifacts`

`artifacts` are explicitly **multi-type**. One snapshot may produce several artifact rows, for example:

- `raw_html`
- `clean_markdown`
- `normalized_json`
- `plain_text`
- `feed_entry`
- `object_payload`
- `map_place`
- `api_response`

Artifacts should carry both semantic role and storage shape. They should answer:

- what content form was produced from the snapshot
- which artifact is primary vs derived vs evidence vs object projection
- which artifacts are searchable
- which parser/normalizer produced them

Typical fields for `artifacts` should include:

- stable identity such as `id`, `source_snapshot_id`
- artifact classification such as `artifact_type`, `artifact_role`, `mime_type`, `language`
- content carriers such as `content_text`, `content_json`, `storage_uri`
- descriptive/search fields such as `title`, `summary`, `canonical_url`, `is_searchable`, `is_primary`
- normalization metadata such as `normalization_status`, `parser_name`, `parser_version`, `metadata`

The model should allow both `content_text` and `content_json` in the same table so that webpages, APIs, feeds, and object projections can coexist without forcing everything into a single serialization strategy.

### `chunks`

`chunks` are **retrieval artifacts, not authoritative records**. They exist to support search and citation, not to replace source or artifact truth.

Typical fields for `chunks` should include:

- stable identity such as `id`, `artifact_id`, `chunk_index`
- retrieval content such as `chunk_text`, `search_text`, `token_count`, `heading_path`, `section_label`
- retrieval/index fields such as `embedding`, `chunk_hash`, `language`, `is_active`
- provenance metadata such as `metadata`, timestamps, and optionally `embedding_model` / `embedding_version`

Chunks must remain derivations of authoritative artifacts. They should never become the only stored truth for a source-derived record.

### Source-grounded object records

Object-first tables such as `course`, `course_offering`, `housing`, `location_or_service`, and `academic_calendar_item` should remain source-grounded by carrying references back to source evidence, typically through `source_id`, `source_snapshot_id`, and/or `primary_artifact_id`.

The source-first base layer therefore remains the grounding substrate even when a domain later receives object-first indexing.

### Policy constraints

- Volatile content must continue to support `live_first`, `local_first`, `local_with_live_verify`, and `archive_only` style retrieval behavior rather than assuming all stored records are equally current.
- `chunks` remain retrieval derivatives; they are not allowed to define freshness policy or canonical currentness on their own.
- Hot retrieval filters that determine routing or truth status should eventually prefer typed columns at the source/snapshot/artifact level over JSON-only conventions.
- New source-derived domains should enter through this four-layer model before introducing special-case persistence.

## Alternatives Considered

- **Collapse the source layer into a simpler `sources -> documents -> chunks` model**  
  Plausible because it looks closer to the current Supabase retrieval schema and would be faster to implement. Rejected because it overloads `documents` with source identity, version history, normalization output, and retrieval responsibilities, making archive/live routing and multi-artifact provenance much harder to model cleanly.

- **Create source-type-specific storage models for feeds, webpages, APIs, maps, and manual data**  
  Plausible because each source family has different shapes. Rejected because it would fragment the ingestion architecture too early, raise cross-school onboarding cost, and make the shared tool-selection model harder to maintain.

## Consequences

- **Benefits**
  - Gives the hybrid assistant a source model that can express provenance, archive state, freshness policy, and multi-artifact normalization explicitly.
  - Supports both object-first domains and source-first domains without forcing a campus-wide ERP schema.
  - Keeps retrieval implementation details separate from the base source/data lineage decision.
  - Makes live-first versus local-first behavior representable in data rather than only in prompt/tool conventions.
  - Gives future object-first tables a stable evidence path back to source material.

- **Costs**
  - The ingestion pipeline becomes more explicit and will require more disciplined capture/normalization metadata.
  - Contributors need to distinguish authoritative source records from derived artifacts and retrieval chunks more carefully.
  - Initial schema and ingestion work will be heavier than keeping a single overloaded `documents` table.

- **Risks**
  - If artifact typing is too loose, `artifacts` can become an unstructured dumping ground.
  - If chunk generation drifts from artifact/source lineage, retrieval evidence will become harder to trust.
  - If `sources` are defined too coarsely, policy and provenance become noisy; if they are defined too finely, onboarding and maintenance become brittle.

- **Constraints Created**
  - New source-derived domains should map into `sources`, `source_snapshots`, `artifacts`, and `chunks` before introducing special-case storage.
  - Retrieval chunks must remain derivations of authoritative artifacts rather than becoming the only stored truth.
  - Freshness and archive behavior must be represented at the source/source-snapshot layer, not improvised only in tool logic.
  - `sources` should usually be modeled as source configuration units, not as one giant platform-wide bucket and not as one row per page.

## Revisit Triggers

- Multiple future domains require artifact or snapshot semantics that the four-layer base model cannot express without repeated exceptions.
- Cross-school ingestion shows that the current source/artifact abstractions are still too rigid or too noisy for practical onboarding.
- The team repeatedly needs policy tables, artifact subtypes, or snapshot rules that cannot be represented cleanly without splitting the model further.
- Object-first domains prove unable to maintain stable evidence links back to source/snapshot/artifact records.

## Related

- `docs/adr/ADR-0004-hybrid-data-model.md`
- `docs/adr/ADR-0005-course-domain.md`
- `docs/adr/ADR-0007-supabase-hybrid-retrieval-and-migration.md`
- `README.md`
- `docs/database/db-schema-v1.md`
