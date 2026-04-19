# ADR-0010: Model `housing` as a single object level with listing-first identity and light option facets

## Status
Accepted

## Date
2026-04-19

## Context
`housing` is one of the approved object-first domains in the hybrid campus assistant model. It supports high-value user tasks such as comparing dorms, finding family or graduate housing, checking whether a residence has singles or doubles, understanding meal-plan requirements, and locating official application pages.

At the same time, the product is not trying to become a full housing assignment platform, a bed inventory system, or a room-by-room facilities database. The model needs to give the assistant a stable, filterable directory of official housing listings without collapsing into a building-only schema on one side or an exploded room-option graph on the other.

The object also needs to remain source-grounded under ADR-0006. Housing records should be explainable through official housing pages, listing pages, PDFs, and related source evidence rather than being treated as free-floating facts.

## Decision
Model the housing domain with exactly **one first-class object level**:

- **`housing`** for independently discoverable official housing listings or destinations

Do not introduce separate first-class runtime objects or normalized relation tables for:
- room options
- contract options
- bathroom variants
- meal-plan variants
- price tiers
- bed inventory
- room-by-room housing graphs

Instead, keep housing attributes and sub-options as **light searchable facets and nested explanatory option facets inside the same object**.

`housing` is responsible for answering:
- what housing listing this is
- what kind of housing it represents
- who it is for when that is known
- what room/configuration patterns it supports when that information is stable enough to store
- what official source evidence and application links explain it

### Identity rule
Use one object row per **independently discoverable official housing listing or destination**.

This means a `housing` record may represent a residence hall, apartment complex, housing community, family housing listing, graduate housing listing, or another official housing destination that users can discover, compare, or apply to independently.

Do **not** promote every internal variation to its own `housing` record. If something is mainly an attribute or configuration of another housing listing—such as single versus double, bathroom style, contract variation, meal-plan variation, or price tier—it should remain a facet or nested option inside that parent housing record.

### Must-have fields
Every `housing` record should have a stable minimum shape:

- identity and scope root:
  - `id`
  - `school_id`
- object classification:
  - `housing_type`
  - `name`
  - `display_name`
  - `summary`
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
- what this dorm or housing listing is
- whether it is residence-hall, apartment, graduate, family, or another housing type
- where the official housing page is
- whether the assistant can ground the answer in a trusted source

### Optional searchable facets
When available, `housing` may also include optional facets that improve filtering and retrieval quality without creating more object levels:

- location and listing context:
  - `address_text`
  - `latitude`
  - `longitude`
  - `campus_zone`
  - `location_hint_text`
- audience and eligibility:
  - `audience_tags[]`
  - `eligibility_text`
  - `gender_policy`
- housing characteristics:
  - `room_type_tags[]`
  - `bathroom_style`
  - `contract_type_tags[]`
  - `meal_plan_required`
  - `amenity_tags[]`
  - `llc_tags[]`
- pricing and application:
  - `price_text`
  - `price_period`
  - `application_url`
  - `availability_cycle_text`
- explanation / comparison support:
  - `comparison_notes`
  - `housing_policy_notes`
  - `image_urls`
  - `related_housing_codes[]`

These facets should remain optional. Missing room-type, pricing, or map precision should not prevent a valid `housing` object from existing.

### Nested option facets
`housing` may also carry nested explanatory option facets when they help answer within-listing comparison questions without creating a second object level.

Examples include:
- `room_options`
- `contract_options`
- `pricing_options`

These nested option fields exist to explain and compare variants **inside one housing listing**, not to create standalone object identity for every internal configuration.

### Explicit non-goals
Do not use `housing` to model:
- realtime vacancy or bed availability
- waitlists or assignment workflow state
- student-specific eligibility or placement outcomes
- room-by-room inventory objects by default
- per-bed pricing matrices as a first-class graph
- internal building/floor/wing graphs unless a later ADR explicitly expands the domain

If future product requirements need that level of housing workflow or inventory logic, they should be handled by a later ADR rather than stretching this object beyond a lightweight assistant-facing housing directory.

## Alternatives Considered
- **Model housing as pure building-level records only**  
  Plausible because residence halls and apartments are easy to understand as physical places. Rejected because some important official housing choices are presented as independent listings or communities rather than a single building, and a building-only identity rule would blur real user-facing housing choices.

- **Split the domain into `housing` plus separate `room_option` or contract-level objects**  
  Plausible because room types, pricing, and contract differences matter to users. Rejected because it would explode the object count, reduce cross-school portability, and push the product toward a housing-management-style schema too early.

- **Flatten every housing option into its own record**  
  Plausible because it makes some comparisons feel more direct. Rejected because it creates many near-duplicate rows, makes assistant reasoning noisier, and treats attribute-like differences as if they were independent housing destinations.

## Consequences
- **Benefits**
  - Gives the assistant a stable structured index for high-value housing comparison and discovery questions.
  - Preserves portability across schools where some housing is building-based and some is listing/community-based.
  - Allows detailed room/configuration questions to be answered through nested option facets without creating a second object identity layer.
  - Keeps official source evidence attached through `source_id`, `source_snapshot_id`, and `primary_artifact_id`.

- **Costs**
  - Some housing semantics remain denormalized inside one object.
  - Search quality depends on keeping searchable facets and nested option summaries aligned with rendered search text.
  - Some detailed housing answers may still need source evidence in addition to object fields.

- **Risks**
  - If listing identity is applied inconsistently, some schools may over-merge or over-split housing records.
  - If too many optional facets accumulate, the object can become noisy.
  - Contributors may try to reintroduce realtime availability or assignment workflow expectations without the required integrations.

- **Constraints Created**
  - The housing domain should remain at one first-class object level unless a later ADR justifies stronger decomposition.
  - Attribute-like options should remain facets or nested option payloads, not standalone default records.
  - Housing records should represent independently discoverable listings or destinations, not every internal configuration.

## Revisit Triggers
- Product requirements repeatedly demand assignment workflows, vacancy tracking, or per-room inventory modeling.
- Multiple schools provide reliable structured housing-option feeds that justify promoting some nested option facets into stronger shared objects.
- User behavior shows the listing-first model cannot answer important housing comparison questions accurately enough.
- The tool layer gains strong enough structured filtering that a stronger second-level housing option model becomes clearly worth the complexity.

## Related
- `docs/adr/ADR-0004-hybrid-data-model.md`
- `docs/adr/ADR-0006-source-first-base-layer.md`
- `docs/adr/ADR-0008-academic-calendar-item.md`
- `docs/adr/ADR-0009-location-or-service.md`
- `README.md`
- `docs/development/db-schema-v1.md`
