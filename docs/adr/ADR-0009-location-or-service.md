# ADR-0009: Model `location_or_service` as a single object level with light place and service facets

## Status

Accepted

## Date

2026-04-19

## Context

`location_or_service` is one of the approved object-first domains in the hybrid campus assistant model. It sits at the intersection of navigation, facility lookup, service discovery, and map-aware question answering. Users do not only ask where a building is. They also ask where they can print, where advising is, where to pick up an ID, where to get help, and whether a destination is open or usable.

At the same time, the product is not trying to become a full campus GIS, indoor navigation system, room inventory database, or institutional org chart. The model needs to give the assistant a stable, filterable index of user-queryable campus destinations without expanding into deeply normalized facility, room, service-unit, and map graph structures.

The object also needs to remain source-grounded under ADR-0006. Place and service records should remain explainable through official location pages, directory entries, map-derived source artifacts, and related source evidence rather than being treated as free-floating facts.

## Decision

Model the place-and-service domain with exactly **one first-class object level**:

- **`location_or_service`** for user-queryable campus destinations that represent either a place, a service entry point, or both.

Do not introduce separate first-class runtime objects or normalized relation tables for:

- buildings versus service points
- room inventory
- indoor map nodes
- service unit hierarchies
- department ownership graphs
- desk / counter / suite-level service graphs

Instead, keep place and service expression as **light searchable facets inside the same object**.

`location_or_service` is responsible for answering:

- what this place or service entry is
- where it is
- what users can do there
- whether it is open, available, or seasonal when that information is stable enough to store
- what official source evidence, map reference, or contact information explains it

### Identity rule

Use one object row per **user-queryable destination**.

That means a building and a service entry may become separate `location_or_service` records when they are genuinely distinct destinations users search for, navigate to, or compare independently. Do not force every service into its parent building object if that service behaves like its own practical destination.

### Must-have fields

Every `location_or_service` should have a stable minimum shape:

- identity and scope root:
  - `id`
  - `school_id`
- object classification:
  - `object_type`
  - `name`
  - `display_name`
  - `summary`
- lifecycle:
  - `status`
- map/location basics:
  - `address_text`
  - `latitude`
  - `longitude`
- retrieval/supporting text:
  - `canonical_url`
  - `search_text`
- source grounding:
  - `source_id`
  - `source_snapshot_id`
  - `primary_artifact_id`

The must-have fields are intentionally enough to support high-confidence questions like:

- where the main library is
- where to find advising
- where students can print
- what building a service is in
- what official page or map entry describes a destination

### Optional searchable facets

When available, `location_or_service` may also include optional facets that improve filtering and retrieval quality without creating more object levels:

- map/provider facets:
  - `map_provider`
  - `map_provider_ref`
  - `place_id`
  - `location_hint_text`
- service-expression facets:
  - `service_type`
  - `service_tags[]`
  - `audience_tags[]`
  - `hours_text`
  - `hours_structured`
  - `contact_text`
  - `booking_required`
  - `walk_in_supported`
  - `access_notes`
- weak grouping facets:
  - `campus_zone`
  - `building_code`
  - `parent_location_label`
  - `related_department_codes[]`
  - `related_service_units[]`

These facets should remain optional. Missing map precision or missing service metadata should not prevent a valid `location_or_service` object from existing.

### Relationship to map data and source artifacts

Map providers such as Google Maps should be treated as source/artifact inputs rather than as a separate object model. For example, a map-derived record may enter the source-first base layer as a source snapshot plus a `map_place` artifact, then project into `location_or_service` when it represents a stable user-facing destination.

### Explicit non-goals

Do not use `location_or_service` to model:

- full indoor navigation
- room-by-room inventory
- desk / counter / office-suite level graphs by default
- fine-grained real-time occupancy or queue state
- temporary alerts as authoritative long-lived truth
- complete organizational reporting lines or ownership hierarchies
- a full GIS / POI system with separate map node and edge objects

If future product requirements need that level of map or facility modeling, they should be handled by a later ADR rather than stretching this object beyond a lightweight assistant-facing destination index.

## Alternatives Considered

- **Model only pure locations and keep all service expression in source retrieval**  
  Plausible because buildings and map points are easier to normalize than services. Rejected because many real user questions are about service destinations such as advising, printing, dining, and help centers rather than just buildings, and a pure-location object would be too weak for assistant use.

- **Split the domain into `location` and `service_point` as separate first-class object types**  
  Plausible because it offers a cleaner semantic distinction and more room for normalization. Rejected because it would push the system toward a heavier service graph too early and reduce portability across schools with uneven directory quality.

- **Model a richer campus GIS / facility / org graph**  
  Plausible because some campuses expose detailed map, service, and building metadata. Rejected because the assistant currently needs a practical destination index, not a complete map/facility platform.

## Consequences

- **Benefits**
  - Gives the assistant a stable structured index for high-value location and service-destination questions.
  - Keeps place and service lookup inside one object level, which aligns better with assistant Q&A and navigation behavior.
  - Preserves portability across schools with uneven map and directory quality.
  - Keeps official source evidence attached through `source_id`, `source_snapshot_id`, and `primary_artifact_id`.

- **Costs**
  - Some place-versus-service semantics remain denormalized inside one object.
  - Search quality depends on keeping service facets and rendered search text aligned.
  - Some edge cases may still require reading source evidence alongside object fields.

- **Risks**
  - If too many optional service and map facets accumulate, the object can become noisy.
  - If identity rules are applied inconsistently, some schools may over-merge or over-split destinations.
  - Contributors may try to stretch the object into a room inventory, org chart, or full GIS layer.

- **Constraints Created**
  - The place/service domain should remain at one first-class object level unless a later ADR justifies stronger decomposition.
  - Buildings and service points may both exist as records, but only when they behave as independently queryable destinations.
  - Map/provider data should enter through the source-first base layer before projection into `location_or_service`.

## Revisit Triggers

- Product requirements repeatedly demand indoor navigation, room-level routing, or occupancy-aware answers.
- Multiple schools provide reliable structured service/location feeds that justify splitting place and service into stronger shared objects.
- User behavior shows that the single-object model cannot answer important destination questions accurately enough.
- Tooling gains strong enough structured spatial and service filtering that a separate graph-like model becomes clearly worth the complexity.

## Related

- `docs/adr/ADR-0004-hybrid-data-model.md`
- `docs/adr/ADR-0005-course-domain.md`
- `docs/adr/ADR-0006-source-first-base-layer.md`
- `docs/adr/ADR-0008-academic-calendar-item.md`
- `README.md`
- `docs/database/db-schema-v1.md`
