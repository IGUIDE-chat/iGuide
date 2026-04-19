# ADR-0008: Model `academic_calendar_item` as a single object level with light scope facets

## Status
Accepted

## Date
2026-04-19

## Context
`academic_calendar_item` is one of the approved object-first domains in the hybrid campus assistant model. It sits close to the already-settled `course` and `course_offering` domain because many academic questions depend on dates, deadlines, and official term boundaries rather than only narrative source retrieval.

At the same time, the product is not trying to become a full registrar workflow or policy-rules engine. The calendar model needs to give the assistant a stable, filterable index of important academic time-and-policy items without expanding into school-specific rule graphs, student-state logic, or deeply normalized scheduling structures.

The object also needs to remain source-grounded under ADR-0006. Calendar records should be explainable through official calendar pages, feeds, or imported source evidence rather than treated as free-floating facts.

## Decision
Model the academic calendar domain with exactly **one first-class object level**:

- **`academic_calendar_item`** for stable official academic timeline items

Do not introduce separate first-class runtime objects or normalized relation tables for:
- calendar scopes
- affected populations
- departments
- colleges
- course links
- workflow rules

Instead, keep scope and applicability as **light searchable facets inside the same object**.

`academic_calendar_item` is responsible for answering:
- what official academic item this is
- when it starts and ends
- whether it is a deadline, window, period, or boundary
- which term/year/population/scope it applies to when that context is known
- what official source evidence explains it

### Must-have fields
Every `academic_calendar_item` should have a stable minimum shape:

- identity and scope root:
  - `id`
  - `school_id`
- item classification:
  - `calendar_type`
  - `item_type`
  - `title`
  - `summary`
- timing:
  - `start_at`
  - `end_at`
  - `all_day`
  - `timezone`
- lifecycle:
  - `status`
- retrieval/supporting text:
  - `canonical_url`
  - `search_text`
- source grounding:
  - `source_id`
  - `source_snapshot_id`
  - `primary_artifact_id`

The must-have fields are intentionally enough to support high-confidence questions like:
- when classes begin
- when registration opens
- when add/drop ends
- when finals happen
- what the official deadline page is

### Optional searchable facets
When available, `academic_calendar_item` may also include optional facets that improve filtering and retrieval quality without creating more object levels:

- term context:
  - `term_code`
  - `academic_year`
- applicability:
  - `applies_to_population`
  - `applies_to_scope`
  - `scope_labels[]`
- optional weak academic links:
  - `related_department_codes[]`
  - `related_college_codes[]`
  - `related_course_codes[]`
- explanation / presentation:
  - `description_text`
  - `notes_text`
  - `action_text`
  - `related_urls`
  - `is_deadline`
  - `is_time_sensitive`
  - `display_priority`

These facets should remain optional. Missing scope data should not prevent a valid calendar item from existing.

### Relationship to `course` and `course_offering`
`academic_calendar_item` should relate to the course domain primarily through **shared academic context**, not through heavy relational binding.

The main shared context is:
- `school_id`
- `term_code`
- `academic_year`
- `applies_to_population`

`related_course_codes[]` may exist as a weak facet when a calendar item truly applies to specific courses, but it is not the primary linking mechanism and should not drive the base schema.

### Explicit non-goals
Do not use `academic_calendar_item` to model:
- real-time student-specific state
- registration transactions
- seat availability or enrollment behavior
- individualized deadline calculation
- prerequisite or curriculum rule evaluation
- complex registrar workflow engines
- a separate graph of scope/population/department rule objects

If future product requirements need that level of workflow or policy logic, they should be handled by a later ADR rather than stretching this object beyond a lightweight calendar index.

## Alternatives Considered
- **Model calendar data as pure source-first retrieval only**  
  Plausible because official academic calendars are often published as pages or PDFs and can be indexed as source content. Rejected because users ask for precise date lookup, filtering, and comparison that benefit from a stable structured index rather than only document retrieval.

- **Split the domain into `academic_calendar_item` plus separate scope/rule/link tables**  
  Plausible because some schools publish nuanced applicability rules by student type, college, or program. Rejected because it would push the product toward a registrar-style rules backend too early and reduce portability across schools.

- **Model calendar data as a richer workflow or policy engine**  
  Plausible because some academic deadlines interact with registration and program processes. Rejected because the assistant currently needs a stable time-and-policy index, not individualized execution logic.

## Consequences
- **Benefits**
  - Gives the assistant a precise structured index for high-value academic date questions.
  - Keeps the object light enough to stay portable across schools with uneven calendar data quality.
  - Preserves alignment with the already-settled `course` / `course_offering` model through shared academic context rather than heavy joins.
  - Keeps official source evidence attached through `source_id`, `source_snapshot_id`, and `primary_artifact_id`.

- **Costs**
  - Some scope semantics remain denormalized inside one object.
  - Richer policy logic may still require reading source evidence in addition to object fields.
  - Query/filter behavior depends on keeping optional facets and rendered search text aligned.

- **Risks**
  - If too many optional scope facets accumulate without discipline, the object can become noisy.
  - If schools express calendar applicability very differently, some filters may become inconsistent.
  - Contributors may try to turn this object into a workflow engine or per-student rules table.

- **Constraints Created**
  - The calendar domain should remain at one first-class object level unless a later ADR justifies expansion.
  - Scope and applicability should stay as light facets before introducing new relation tables.
  - The primary relationship to courses should remain shared term/population context, not hard calendar-to-course graph modeling.

## Revisit Triggers
- Product requirements repeatedly demand student-specific deadline logic or registrar workflow execution.
- Multiple schools provide reliable structured calendar feeds that justify promoting some optional facets into stronger shared objects.
- User behavior shows the single-object model cannot answer important calendar questions accurately enough.
- The tool layer gains strong enough structured filtering that a separate scope model becomes clearly worth the complexity.

## Related
- `docs/adr/ADR-0004-hybrid-data-model.md`
- `docs/adr/ADR-0005-course-domain.md`
- `docs/adr/ADR-0006-source-first-base-layer.md`
- `docs/adr/ADR-0007-supabase-hybrid-retrieval-and-migration.md`
- `README.md`
- `docs/development/db-schema-v1.md`
