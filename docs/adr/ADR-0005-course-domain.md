# ADR-0005: Model the course domain with `course` and `course_offering` plus dual-layer facets

## Status
Accepted

## Date
2026-04-18

## Context
The course domain is one of the few assistant capabilities that requires a precise and complete local index rather than only source retrieval. Users will ask for filtered lists, prerequisite-aware discovery, term-specific offerings, and direct comparisons that are difficult to answer reliably from generic document retrieval alone.

At the same time, the product is not trying to become a real-time student information system. Highly volatile fields such as seat availability, live enrollment counts, and other official-registration-state data would require school-system integrations that are out of scope and too fragile to treat as baseline platform requirements.

The current retrieval stack is still document-first: searchable ranking is driven by `title` and `content`, while metadata is preserved but not exposed as a first-class structured filter interface in the live runtime. That means useful course facets should not exist only as structured payload fields if they need to be discoverable immediately through current hybrid search.

## Decision
Model the course domain with exactly two first-class object levels:

1. **`course`** for stable catalog facts
2. **`course_offering`** for term-specific offering facts

Do not introduce separate first-class runtime objects or highly normalized tables for:
- `department`
- `instructor`
- `prerequisite`
- `section`

These concepts may appear as optional searchable facets inside `course` or `course_offering`, but they are not promoted to required standalone domain objects.

Do not model highly real-time fields such as:
- remaining seats
- live enrollment
- waitlist counts
- other registration-system state that requires official-system integration

Use **dual-layer facets** for searchable course metadata:
- human-readable text fields for retrieval and explanation
- normalized arrays/codes for future structured filtering

Examples include:

For `course`:
- `department_code`
- `department_name`
- `academic_level`
- `prerequisites_text`
- `prerequisite_codes[]`
- `corequisites_text`
- `attribute_codes[]`
- `attribute_labels[]`

For `course_offering`:
- `section_code`
- `class_number` or `crn`
- `instructor_names[]`
- `instruction_method`
- `campus`
- `status`
- `meeting_days[]`
- `meeting_time_text`
- `schedule_text`
- `room_text`

These facets should exist both as structured payload and as rendered searchable text when needed, so the current document-first retrieval path can use them immediately while future structured tools can also filter on normalized values.

## Alternatives Considered
- **Build a fully normalized SIS-style course schema with separate department, instructor, prerequisite, and section entities**  
  Plausible because it looks academically correct and enables rich joins. Rejected because it adds schema weight, raises cross-school onboarding cost, and exceeds what the current tool/runtime model needs for high-quality assistant answers.

- **Keep courses entirely source-first and answer through retrieval only**  
  Plausible because the system already has hybrid search and source ingestion. Rejected because course discovery and filtering require a more complete structured index than generic document retrieval can provide reliably.

- **Merge catalog and term-specific data into one single course object**  
  Plausible because it simplifies the object count. Rejected because stable course facts and term-specific offerings change on different cadences and need different retrieval/use patterns.

## Consequences
- **Benefits**
  - Gives the model a stable structured course index without forcing a full administrative-system schema.
  - Preserves flexibility by keeping many useful fields as optional facets rather than mandatory related objects.
  - Supports both current hybrid retrieval and future structured tools through dual-layer facet representation.
  - Keeps the platform compatible with schools that expose uneven course data quality.

- **Costs**
  - Some semantics that could be normalized more aggressively remain denormalized inside objects.
  - Course search quality depends on keeping rendered searchable text aligned with structured facet fields.
  - Some downstream tooling may need to read both object fields and source evidence for the best answer quality.

- **Risks**
  - If facet naming drifts across schools, structured filtering will become less reliable.
  - If too many optional facets accumulate without discipline, the object payload can become noisy.
  - Contributors may try to reintroduce seat/live-enrollment expectations without the required live integrations.

- **Constraints Created**
  - The course domain should remain capped at `course` and `course_offering` unless a later ADR justifies expansion.
  - Real-time registration-state fields are out of scope for the baseline course object model.
  - Searchable course facets should be represented in both structured payload and retrieval-friendly text where immediate search behavior depends on them.

## Revisit Triggers
- Product requirements expand into true schedule-planning or registration workflows that need stronger section-level modeling.
- Multiple schools provide reliable structured feeds that justify promoting one or more optional facets into standalone objects.
- The live tool/query layer gains robust structured filtering, making the current duplication between facet payload and rendered text no longer worthwhile.
- User behavior shows that important course questions are still too hard to answer accurately with the two-level model.

## Related
- `docs/development/db-schema-v1.md`
- `app/src/pages/courses/CoursesLandingPage.tsx`
- `app/src/data/articles/registration101.ts`
- `api/src/tools/search-knowledge-base.ts`
- `scripts/import-to-supabase.ts`
- `supabase/migrations/001_create_documents.sql`
