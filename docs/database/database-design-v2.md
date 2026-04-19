# Campus Assistant Database Design v2

## Purpose

This document integrates the accepted database architecture decisions from `ADR-0004` through `ADR-0010` into one implementation-oriented design reference.

Its goal is not to replace the ADRs. The ADRs remain the durable decision record. This document exists to show how those accepted decisions fit together as one coherent database architecture for the campus assistant.

This design replaces the direction implied by `db-schema-v1.md`, which modeled a more SIS-like or campus-administration-style backend. The v2 design instead targets a **function-call-first campus assistant** that needs:

- a small number of high-accuracy structured object domains
- broad source-first coverage for heterogeneous campus information
- freshness-aware retrieval behavior for volatile content
- a Supabase-native hybrid retrieval path that can eventually replace QMD as the primary production retrieval backend

---

## Design Goals

The database should optimize for the following:

1. **Precise tool-facing indexes for high-value domains**
   - Courses
   - Housing
   - Location / service destinations
   - Academic calendar items

2. **Broad and portable source ingestion across schools**
   - webpages
   - feeds
   - APIs
   - map-derived content
   - manual imports
   - imported legacy corpora

3. **Freshness-aware answer routing**
   - stable information can use local structured/indexed storage by default
   - volatile information must not treat archived database records as default current truth

4. **Explainable provenance**
   - object-first records must remain traceable back to captured sources and artifacts
   - retrieval hits must remain traceable back to authoritative source-derived artifacts

5. **Cross-school portability**
   - avoid turning the schema into a school-specific registrar, housing-assignment, GIS, or administrative ERP backend

---

## Core Architecture

The accepted architecture has three behavior layers:

1. **Object-first for a small set of stable domains**
2. **Source-first for most campus information**
3. **Freshness-aware routing for volatile domains**

These layers sit on top of a strict four-layer source-first base model:

```text
sources -> source_snapshots -> artifacts -> chunks
```

And they are served by a **Supabase-native hybrid retrieval path** that should become the long-term production retrieval backend.

---

## Layer 1: Object-First Domains

Only a small set of domains should receive first-class object modeling.

### Approved object-first domains

- `course`
- `course_offering`
- `housing`
- `location_or_service`
- `academic_calendar_item`

These are object-first because users need complete, filterable, high-confidence indexes for them.

### Object-first design rules

- each approved domain should remain **narrowly scoped**
- avoid promoting optional facets into standalone first-class objects unless a later ADR justifies it
- object records must remain **source-grounded** through:
  - `source_id`
  - `source_snapshot_id`
  - `primary_artifact_id`
- object-first domains do not replace source-first evidence; they provide a stable assistant-facing index on top of it

---

## Layer 2: Source-First Domains

Most campus information remains source-first.

Examples include:

- guides
- FAQs
- department pages
- faculty pages
- student-life content
- organization content
- procedural pages
- general narrative content

These domains do not need first-class object models by default. They should enter through the four-layer source pipeline and become searchable via artifact/chunk indexing.

---

## Layer 3: Freshness-Aware Routing

The system must distinguish not only structure, but also freshness behavior.

### Retrieval modes

- `local_first`
- `live_first`
- `local_with_live_verify`
- `archive_only`

### Freshness classes

- `stable`
- `semi_volatile`
- `volatile`

### Default routing guidance

#### Stable domains
Usually safe for local-first behavior:

- courses
- course offerings
- housing
- location / service destinations
- academic calendar items

#### Volatile domains
Should not default to archived DB copies as current truth:

- news
- announcements
- policy updates
- most events
- emergency or temporary notices

For these domains, local storage acts as:

- archive
- cache
- audit trail
- fallback evidence

not the default first source for “latest/current” answers.

---

## Four-Layer Source-First Base Model

The source layer is the canonical persistence shape for source-derived knowledge.

### 1. `sources`

`sources` define the long-lived identity and default policy of a source.

Typical responsibilities:

- identify the source
- define its school/domain association
- encode authority/trust level
- define default object strategy
- define default freshness and retrieval behavior

Typical fields:

- identity: `id`, `school_id`, `source_key`, `name`
- classification: `source_kind`, `content_domain`, `authority_level`
- default policy: `default_object_strategy`, `freshness_class`, `default_retrieval_policy`, `default_ttl_seconds`
- source location: `base_url`, `feed_url`, `api_endpoint`, `map_provider_ref`
- operations: `is_active`, `metadata`, timestamps

Rule: `sources` do **not** store authoritative content bodies.

### 2. `source_snapshots`

`source_snapshots` capture one observed or imported version of a source at a point in time.

Typical responsibilities:

- record when a version was captured
- record whether it is current, archived, expired, or outdated
- hold source-side verification/currentness metadata

Typical fields:

- identity: `id`, `source_id`, `snapshot_key`
- capture metadata: `capture_mode`, `capture_status`, `captured_at`, `last_verified_at`
- currentness metadata: `expires_at`, `valid_from`, `valid_to`, `is_current`, `is_archived`, `is_outdated`, `archive_reason`
- source version metadata: `canonical_url`, `source_last_modified`, `etag`, `content_hash`, `raw_metadata`

Rule: freshness and archive semantics belong here, not only in tool logic.

### 3. `artifacts`

`artifacts` are the multi-type content outputs derived from a snapshot.

One snapshot may produce multiple artifacts, such as:

- `raw_html`
- `clean_markdown`
- `normalized_json`
- `plain_text`
- `feed_entry`
- `object_payload`
- `map_place`
- `api_response`

Typical responsibilities:

- carry source-derived content in one or more usable forms
- distinguish primary vs derived vs evidence vs object-projection roles
- hold parser/normalizer metadata
- indicate whether an artifact is searchable

Typical fields:

- identity: `id`, `source_snapshot_id`
- artifact classification: `artifact_type`, `artifact_role`, `mime_type`, `language`
- content carriers: `content_text`, `content_json`, `storage_uri`
- descriptive/search fields: `title`, `summary`, `canonical_url`, `is_searchable`, `is_primary`
- normalization metadata: `normalization_status`, `parser_name`, `parser_version`, `metadata`

Rule: the model should support both `content_text` and `content_json` in the same table.

### 4. `chunks`

`chunks` are retrieval-only slices derived from searchable artifacts.

Typical responsibilities:

- support search and citation
- support hybrid lexical + semantic retrieval
- preserve artifact lineage for evidence tracing

Typical fields:

- identity: `id`, `artifact_id`, `chunk_index`
- retrieval content: `chunk_text`, `search_text`, `token_count`, `heading_path`, `section_label`
- retrieval/index fields: `embedding`, `chunk_hash`, `language`, `is_active`
- provenance metadata: `metadata`, timestamps, optional `embedding_model`, `embedding_version`

Rule: chunks are **retrieval artifacts, not authoritative records**.

---

## Object-First Domain Designs

### Course Domain

The course domain has exactly two first-class object levels:

- `course`
- `course_offering`

#### `course`
Represents stable catalog facts.

Typical must-have fields:

- `id`
- `school_id`
- `subject`
- `number`
- `code`
- `title`
- `description`
- `credits`
- `canonical_url`
- `search_text`
- `source_id`
- `source_snapshot_id`
- `primary_artifact_id`

Typical dual-layer facets:

- `department_code`
- `department_name`
- `academic_level`
- `prerequisites_text`
- `prerequisite_codes[]`
- `corequisites_text`
- `attribute_codes[]`
- `attribute_labels[]`

#### `course_offering`
Represents term-specific offering facts.

Typical must-have fields:

- `id`
- `course_id`
- `school_id`
- `term_code`
- `status`
- `canonical_url`
- `search_text`
- `source_id`
- `source_snapshot_id`
- `primary_artifact_id`

Typical dual-layer facets:

- `section_code`
- `class_number` or `crn`
- `instructor_names[]`
- `instruction_method`
- `campus`
- `meeting_days[]`
- `meeting_time_text`
- `schedule_text`
- `room_text`

Explicit non-goals:

- remaining seats
- live enrollment
- waitlist counts
- official registration-system state

### Academic Calendar Domain

The calendar domain has exactly one first-class object level:

- `academic_calendar_item`

Typical must-have fields:

- `id`
- `school_id`
- `calendar_type`
- `item_type`
- `title`
- `summary`
- `start_at`
- `end_at`
- `all_day`
- `timezone`
- `status`
- `canonical_url`
- `search_text`
- `source_id`
- `source_snapshot_id`
- `primary_artifact_id`

Typical optional facets:

- `term_code`
- `academic_year`
- `applies_to_population`
- `applies_to_scope`
- `scope_labels[]`
- `related_department_codes[]`
- `related_college_codes[]`
- `related_course_codes[]`
- `description_text`
- `notes_text`
- `action_text`
- `related_urls`
- `is_deadline`
- `is_time_sensitive`

Explicit non-goals:

- student-specific deadline state
- registration transactions
- enrollment behavior
- workflow/rule engines

### Location / Service Domain

The location/service domain has exactly one first-class object level:

- `location_or_service`

Identity rule:

- one row per user-queryable destination
- a building and a service entry may each exist when they behave as independently searched or navigated destinations

Typical must-have fields:

- `id`
- `school_id`
- `object_type`
- `name`
- `display_name`
- `summary`
- `status`
- `address_text`
- `latitude`
- `longitude`
- `canonical_url`
- `search_text`
- `source_id`
- `source_snapshot_id`
- `primary_artifact_id`

Typical optional facets:

- `map_provider`
- `map_provider_ref`
- `place_id`
- `location_hint_text`
- `service_type`
- `service_tags[]`
- `audience_tags[]`
- `hours_text`
- `hours_structured`
- `contact_text`
- `booking_required`
- `walk_in_supported`
- `access_notes`
- `campus_zone`
- `building_code`
- `parent_location_label`
- `related_department_codes[]`
- `related_service_units[]`

Explicit non-goals:

- indoor navigation graphs
- room inventory
- queue/occupancy state
- full GIS/POI graph
- org chart modeling

### Housing Domain

The housing domain has exactly one first-class object level:

- `housing`

Identity rule:

- one row per independently discoverable official housing listing or destination
- a record may represent a residence hall, apartment complex, housing community, family housing listing, graduate housing listing, or another official housing destination
- internal variations stay as facets or nested option payloads

Typical must-have fields:

- `id`
- `school_id`
- `housing_type`
- `name`
- `display_name`
- `summary`
- `status`
- `canonical_url`
- `search_text`
- `source_id`
- `source_snapshot_id`
- `primary_artifact_id`

Typical optional facets:

- `address_text`
- `latitude`
- `longitude`
- `campus_zone`
- `location_hint_text`
- `audience_tags[]`
- `eligibility_text`
- `gender_policy`
- `room_type_tags[]`
- `bathroom_style`
- `contract_type_tags[]`
- `meal_plan_required`
- `amenity_tags[]`
- `llc_tags[]`
- `price_text`
- `price_period`
- `application_url`
- `availability_cycle_text`
- `comparison_notes`
- `housing_policy_notes`
- `image_urls`
- `related_housing_codes[]`

Nested explanatory option facets may include:

- `room_options`
- `contract_options`
- `pricing_options`

Explicit non-goals:

- realtime vacancy
- waitlists
- assignment workflow state
- per-room inventory graphs
- per-bed pricing graphs

---

## Retrieval Architecture

### Long-term direction

The long-term production retrieval backend should be **Supabase-native hybrid retrieval**.

This means:

- PostgreSQL full-text search for lexical retrieval
- pgvector for semantic retrieval
- reciprocal rank fusion and tuning in SQL/RPC or tool-layer orchestration
- async ingestion/indexing instead of local CLI-first reindexing as the main operational model

### Current transition reality

The repo still contains two retrieval worlds:

- a newer Supabase-native hybrid path
- an older QMD/VPS path

QMD should be treated as **transitional infrastructure**, not the future canonical backend.

### Migration stance

#### Short term
- keep QMD operational as a sidecar
- preserve compatibility and rollback safety
- use it for parity comparison

#### Medium term
- mirror ingestion into the Supabase-native path
- compare retrieval quality and ranking behavior
- tune chunking, weighting, ranking, and fallback behavior

#### Long term
- retire QMD from the primary production retrieval path once parity is acceptable

### Migration principle

Port **QMD’s useful retrieval ideas**, not its implementation.

Good ideas to port:

- chunking behavior and chunk metadata discipline
- fusion/ranking ideas
- provenance-aware retrieval behavior
- context grouping and result shaping ideas

Do not port directly:

- filesystem-first ingestion assumptions
- SQLite/FTS5/sqlite-vec implementation
- local CLI indexing as the primary production workflow

---

## Suggested Implementation Shape in Supabase

### Existing retrieval substrate

The repo already contains:

- `documents`
- `document_chunks`
- `hybrid_search`
- `hybrid_search_chunks`
- `keyword_search`

This means the migration does not require inventing hybrid retrieval from scratch. Instead, the likely path is:

1. keep the current Supabase retrieval substrate active
2. evolve ingestion around the source-first base model
3. map searchable artifacts/chunks into the retrieval substrate
4. gradually improve ranking, filtering, provenance, and parity behavior

### Likely convergence target

Over time, the retrieval path should evolve from today’s flatter `documents/document_chunks` model toward a source-grounded lineage where:

- object-first records point to source evidence
- searchable source artifacts map cleanly into retrieval chunks
- freshness/archive behavior is visible in typed fields
- ranking and filtering can use both retrieval signals and data-policy signals

---

## Freshness and Volatile Data Rules

The system should treat volatile domains differently from stable domains.

### Stable domains
Usually local-first:

- courses
- course offerings
- housing
- location/service destinations
- academic calendar items

### Volatile domains
Usually live-first or local-with-live-verify:

- news
- announcements
- policy updates
- most events
- temporary notices

### Data-model implication

Volatile content stored in the database is usually:

- archive
- cache
- audit evidence
- fallback evidence

not the default first source for current/latest questions.

That policy should be represented in the data model, especially via:

- `freshness_class`
- `default_retrieval_policy`
- `default_ttl_seconds`
- `captured_at`
- `last_verified_at`
- `expires_at`
- `is_current`
- `is_archived`
- `is_outdated`

---

## Why v2 Replaces `db-schema-v1.md`

`db-schema-v1.md` modeled a more complete campus administrative world, with stronger normalization around departments, faculty, course relationships, and similar domain entities.

That direction is no longer the right center of gravity for this product.

The new system is not trying to be:

- a registrar backend
- a housing assignment system
- a GIS/facilities platform
- an event workflow engine

It is trying to be a **tool-call-first campus assistant** that combines:

- a small number of high-confidence structured object indexes
- a broad source-first ingestion and retrieval layer
- freshness-aware routing
- source-grounded evidence

So the v2 design chooses **assistant-oriented structure**, not administrative completeness.

---

## Recommended Next Implementation Order

1. **Preserve ADR-aligned naming and boundaries**
   - do not re-expand object-first domains

2. **Implement source-first base tables first**
   - `sources`
   - `source_snapshots`
   - `artifacts`
   - `chunks`

3. **Bridge current retrieval to source lineage**
   - map searchable artifacts/chunks into Supabase retrieval
   - retain parity checks against QMD while needed

4. **Implement object-first tables against source grounding**
   - `course`
   - `course_offering`
   - `academic_calendar_item`
   - `location_or_service`
   - `housing`

5. **Add freshness-aware routing fields and retrieval policy enforcement**

6. **Tune Supabase-native hybrid retrieval toward QMD parity, then retire QMD from the primary path**

---

## Related ADRs

- `docs/adr/ADR-0004-hybrid-data-model.md`
- `docs/adr/ADR-0005-course-domain.md`
- `docs/adr/ADR-0006-source-first-base-layer.md`
- `docs/adr/ADR-0007-supabase-hybrid-retrieval-and-migration.md`
- `docs/adr/ADR-0008-academic-calendar-item.md`
- `docs/adr/ADR-0009-location-or-service.md`
- `docs/adr/ADR-0010-housing.md`

## Superseded / Historical Context

- `docs/database/db-schema-v1.md` remains useful as historical context, but it is no longer the target architecture for the campus assistant.
