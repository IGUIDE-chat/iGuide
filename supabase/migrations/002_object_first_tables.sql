-- Object-first domain tables for iGuide campus assistant database v2.

create table public.course (
  id uuid primary key default gen_random_uuid(),
  school_id text not null,
  subject text not null,
  number text not null,
  code text not null,
  title text not null,
  description text,
  credits text,
  status text not null default 'active',
  canonical_url text,
  search_text text,
  source_id uuid references public.sources(id),
  source_snapshot_id uuid references public.source_snapshots(id),
  primary_artifact_id uuid references public.artifacts(id),
  department_code text,
  department_name text,
  academic_level text,
  prerequisites_text text,
  prerequisite_codes text[],
  corequisites_text text,
  attribute_codes text[],
  attribute_labels text[],
  fts_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(code, '') || ' ' || coalesce(description, '') || ' ' || coalesce(search_text, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

comment on table public.course is 'Stable catalog-level course records with dual-layer prerequisite, attribute, and department facets grounded to source-first evidence.';

create table public.course_offering (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.course(id),
  school_id text not null,
  term_code text not null,
  status text not null default 'active',
  canonical_url text,
  search_text text,
  source_id uuid references public.sources(id),
  source_snapshot_id uuid references public.source_snapshots(id),
  primary_artifact_id uuid references public.artifacts(id),
  section_code text,
  class_number text,
  instructor_names text[],
  instruction_method text,
  campus text,
  meeting_days text[],
  meeting_time_text text,
  schedule_text text,
  room_text text,
  fts_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(term_code, '') || ' ' || coalesce(search_text, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

comment on table public.course_offering is 'Term-specific course offering records that keep scheduling and instructional facets lightweight while deferring real-time registration state.';

create table public.academic_calendar_item (
  id uuid primary key default gen_random_uuid(),
  school_id text not null,
  calendar_type text not null,
  item_type text not null,
  title text not null,
  summary text,
  start_at timestamptz,
  end_at timestamptz,
  all_day boolean not null default false,
  timezone text default 'America/Chicago',
  status text not null default 'active',
  canonical_url text,
  search_text text,
  source_id uuid references public.sources(id),
  source_snapshot_id uuid references public.source_snapshots(id),
  primary_artifact_id uuid references public.artifacts(id),
  term_code text,
  academic_year text,
  applies_to_population text,
  applies_to_scope text,
  scope_labels text[],
  related_department_codes text[],
  related_college_codes text[],
  related_course_codes text[],
  description_text text,
  notes_text text,
  action_text text,
  related_urls text[],
  is_deadline boolean not null default false,
  is_time_sensitive boolean not null default false,
  fts_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(search_text, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

comment on table public.academic_calendar_item is 'Official academic timeline items with lightweight scope facets, explicit deadline markers, and source-grounded calendar evidence.';

create table public.location_or_service (
  id uuid primary key default gen_random_uuid(),
  school_id text not null,
  object_type text not null,
  name text not null,
  display_name text,
  summary text,
  status text not null default 'active',
  address_text text,
  latitude double precision,
  longitude double precision,
  canonical_url text,
  search_text text,
  source_id uuid references public.sources(id),
  source_snapshot_id uuid references public.source_snapshots(id),
  primary_artifact_id uuid references public.artifacts(id),
  map_provider text,
  map_provider_ref text,
  place_id text,
  location_hint_text text,
  service_type text,
  service_tags text[],
  audience_tags text[],
  hours_text text,
  hours_structured jsonb,
  contact_text text,
  booking_required boolean,
  walk_in_supported boolean,
  access_notes text,
  campus_zone text,
  building_code text,
  parent_location_label text,
  related_department_codes text[],
  related_service_units text[],
  fts_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' || coalesce(display_name, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(search_text, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

comment on table public.location_or_service is 'User-queryable campus destinations representing places, services, or both, with optional provider, access, and service metadata.';

create table public.housing (
  id uuid primary key default gen_random_uuid(),
  school_id text not null,
  housing_type text not null,
  name text not null,
  display_name text,
  summary text,
  status text not null default 'active',
  canonical_url text,
  search_text text,
  source_id uuid references public.sources(id),
  source_snapshot_id uuid references public.source_snapshots(id),
  primary_artifact_id uuid references public.artifacts(id),
  address_text text,
  latitude double precision,
  longitude double precision,
  campus_zone text,
  location_hint_text text,
  audience_tags text[],
  eligibility_text text,
  gender_policy text,
  room_type_tags text[],
  bathroom_style text,
  contract_type_tags text[],
  meal_plan_required boolean,
  amenity_tags text[],
  llc_tags text[],
  price_text text,
  price_period text,
  application_url text,
  availability_cycle_text text,
  comparison_notes text,
  housing_policy_notes text,
  image_urls text[],
  related_housing_codes text[],
  room_options jsonb,
  contract_options jsonb,
  pricing_options jsonb,
  fts_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(name, '') || ' ' || coalesce(display_name, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(search_text, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb default '{}'::jsonb
);

comment on table public.housing is 'Listing-first housing directory records with optional audience, amenity, pricing, and nested option facets grounded to official housing evidence.';

create unique index course_school_id_code_uidx on public.course (school_id, code);
create unique index course_school_id_subject_number_uidx on public.course (school_id, subject, number);
create index course_department_code_idx on public.course (department_code);
create index course_prerequisite_codes_idx on public.course using gin (prerequisite_codes);
create index course_fts_vector_idx on public.course using gin (fts_vector);

create index course_offering_course_id_idx on public.course_offering (course_id);
create index course_offering_school_id_term_code_idx on public.course_offering (school_id, term_code);
create index course_offering_instructor_names_idx on public.course_offering using gin (instructor_names);
create index course_offering_fts_vector_idx on public.course_offering using gin (fts_vector);

create index academic_calendar_item_school_id_term_code_idx on public.academic_calendar_item (school_id, term_code);
create index academic_calendar_item_school_id_start_at_idx on public.academic_calendar_item (school_id, start_at);
create index academic_calendar_item_is_deadline_idx on public.academic_calendar_item (is_deadline);
create index academic_calendar_item_scope_labels_idx on public.academic_calendar_item using gin (scope_labels);
create index academic_calendar_item_fts_vector_idx on public.academic_calendar_item using gin (fts_vector);

create index location_or_service_school_id_object_type_idx on public.location_or_service (school_id, object_type);
create index location_or_service_school_id_service_type_idx on public.location_or_service (school_id, service_type);
create index location_or_service_place_id_idx on public.location_or_service (place_id);
create index location_or_service_service_tags_idx on public.location_or_service using gin (service_tags);
create index location_or_service_fts_vector_idx on public.location_or_service using gin (fts_vector);

create index housing_school_id_housing_type_idx on public.housing (school_id, housing_type);
create index housing_room_type_tags_idx on public.housing using gin (room_type_tags);
create index housing_amenity_tags_idx on public.housing using gin (amenity_tags);
create index housing_audience_tags_idx on public.housing using gin (audience_tags);
create index housing_fts_vector_idx on public.housing using gin (fts_vector);

create trigger course_set_updated_at
before update on public.course
for each row
execute function public.set_updated_at();

create trigger course_offering_set_updated_at
before update on public.course_offering
for each row
execute function public.set_updated_at();

create trigger academic_calendar_item_set_updated_at
before update on public.academic_calendar_item
for each row
execute function public.set_updated_at();

create trigger location_or_service_set_updated_at
before update on public.location_or_service
for each row
execute function public.set_updated_at();

create trigger housing_set_updated_at
before update on public.housing
for each row
execute function public.set_updated_at();

alter table public.course enable row level security;
alter table public.course_offering enable row level security;
alter table public.academic_calendar_item enable row level security;
alter table public.location_or_service enable row level security;
alter table public.housing enable row level security;

create policy course_select_anon
on public.course
for select
to anon
using (true);

create policy course_select_authenticated
on public.course
for select
to authenticated
using (true);

create policy course_offering_select_anon
on public.course_offering
for select
to anon
using (true);

create policy course_offering_select_authenticated
on public.course_offering
for select
to authenticated
using (true);

create policy academic_calendar_item_select_anon
on public.academic_calendar_item
for select
to anon
using (true);

create policy academic_calendar_item_select_authenticated
on public.academic_calendar_item
for select
to authenticated
using (true);

create policy location_or_service_select_anon
on public.location_or_service
for select
to anon
using (true);

create policy location_or_service_select_authenticated
on public.location_or_service
for select
to authenticated
using (true);

create policy housing_select_anon
on public.housing
for select
to anon
using (true);

create policy housing_select_authenticated
on public.housing
for select
to authenticated
using (true);

grant select on public.course to anon, authenticated;
grant select on public.course_offering to anon, authenticated;
grant select on public.academic_calendar_item to anon, authenticated;
grant select on public.location_or_service to anon, authenticated;
grant select on public.housing to anon, authenticated;
