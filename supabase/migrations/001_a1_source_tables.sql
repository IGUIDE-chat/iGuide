-- A1 source-first base tables for iGuide campus assistant database v2.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  school_id text not null,
  source_key text not null unique,
  name text not null,
  source_kind text not null,
  content_domain text,
  authority_level text default 'official',
  default_object_strategy text default 'source_first',
  freshness_class text default 'stable',
  default_retrieval_policy text default 'local_first',
  default_ttl_seconds integer,
  base_url text,
  feed_url text,
  api_endpoint text,
  map_provider_ref text,
  is_active boolean not null default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sources_source_kind_check
    check (source_kind in ('website', 'rss', 'api', 'google_maps', 'manual', 'imported_qmd')),
  constraint sources_freshness_class_check
    check (freshness_class in ('stable', 'semi_volatile', 'volatile')),
  constraint sources_default_retrieval_policy_check
    check (default_retrieval_policy in ('local_first', 'live_first', 'local_with_live_verify', 'archive_only'))
);

comment on table public.sources is 'A1 source registry storing the long-lived identity, default policy, and provenance envelope for each campus data source.';

create table public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id),
  snapshot_key text,
  capture_mode text not null,
  capture_status text default 'success',
  canonical_url text,
  source_last_modified timestamptz,
  captured_at timestamptz not null default now(),
  last_verified_at timestamptz,
  expires_at timestamptz,
  is_current boolean not null default true,
  is_archived boolean not null default false,
  is_outdated boolean not null default false,
  archive_reason text,
  valid_from timestamptz,
  valid_to timestamptz,
  etag text,
  content_hash text,
  raw_metadata jsonb default '{}'::jsonb,
  constraint source_snapshots_capture_mode_check
    check (capture_mode in ('crawl', 'feed_poll', 'api_sync', 'manual_import', 'live_fetch'))
);

comment on table public.source_snapshots is 'A1 snapshot ledger capturing each observed or imported version of a source with freshness, archive, and verification metadata.';

create table public.artifacts (
  id uuid primary key default gen_random_uuid(),
  source_snapshot_id uuid not null references public.source_snapshots(id),
  artifact_type text not null,
  artifact_role text default 'primary',
  mime_type text,
  language text default 'en',
  title text,
  summary text,
  content_text text,
  content_json jsonb,
  storage_uri text,
  canonical_url text,
  is_searchable boolean not null default false,
  is_primary boolean not null default true,
  normalization_status text,
  parser_name text,
  parser_version text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint artifacts_artifact_type_check
    check (artifact_type in ('raw_html', 'clean_markdown', 'normalized_json', 'plain_text', 'feed_entry', 'object_payload', 'map_place', 'api_response')),
  constraint artifacts_artifact_role_check
    check (artifact_role in ('primary', 'derived', 'evidence', 'object_projection', 'retrieval_input'))
);

comment on table public.artifacts is 'A1 multi-format content outputs derived from snapshots, including raw, normalized, evidence, and retrieval-ready representations.';

create table public.chunks (
  id uuid primary key default gen_random_uuid(),
  artifact_id uuid not null references public.artifacts(id),
  chunk_index integer not null,
  chunk_text text not null,
  search_text text,
  token_count integer,
  heading_path text,
  section_label text,
  embedding vector(384),
  chunk_hash text,
  language text default 'en',
  is_active boolean not null default true,
  embedding_model text,
  embedding_version text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  fts_vector tsvector generated always as (
    to_tsvector('english', coalesce(search_text, '') || ' ' || coalesce(chunk_text, ''))
  ) stored
);

comment on table public.chunks is 'A1 retrieval-only text slices derived from searchable artifacts, preserving lineage while supporting lexical and semantic search.';

create trigger sources_set_updated_at
before update on public.sources
for each row
execute function public.set_updated_at();

create index sources_school_id_idx on public.sources (school_id);
create index sources_content_domain_idx on public.sources (content_domain);
create index sources_is_active_idx on public.sources (is_active);

create index source_snapshots_source_id_idx on public.source_snapshots (source_id);
create index source_snapshots_source_id_is_current_idx on public.source_snapshots (source_id, is_current);
create index source_snapshots_captured_at_idx on public.source_snapshots (captured_at);
create index source_snapshots_is_current_is_archived_idx on public.source_snapshots (is_current, is_archived);

create index artifacts_source_snapshot_id_idx on public.artifacts (source_snapshot_id);
create index artifacts_artifact_type_idx on public.artifacts (artifact_type);
create index artifacts_is_searchable_idx on public.artifacts (is_searchable);
create index artifacts_is_primary_idx on public.artifacts (is_primary);

create index chunks_artifact_id_idx on public.chunks (artifact_id);
create unique index chunks_artifact_id_chunk_index_idx on public.chunks (artifact_id, chunk_index);
create index chunks_fts_vector_idx on public.chunks using gin (fts_vector);
create index chunks_embedding_hnsw_idx on public.chunks using hnsw (embedding vector_cosine_ops);

alter table public.sources enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.artifacts enable row level security;
alter table public.chunks enable row level security;

create policy sources_select_anon
on public.sources
for select
to anon
using (true);

create policy sources_select_authenticated
on public.sources
for select
to authenticated
using (true);

create policy source_snapshots_select_anon
on public.source_snapshots
for select
to anon
using (true);

create policy source_snapshots_select_authenticated
on public.source_snapshots
for select
to authenticated
using (true);

create policy artifacts_select_anon
on public.artifacts
for select
to anon
using (true);

create policy artifacts_select_authenticated
on public.artifacts
for select
to authenticated
using (true);

create policy chunks_select_anon
on public.chunks
for select
to anon
using (true);

create policy chunks_select_authenticated
on public.chunks
for select
to authenticated
using (true);

grant select on public.sources to anon, authenticated;
grant select on public.source_snapshots to anon, authenticated;
grant select on public.artifacts to anon, authenticated;
grant select on public.chunks to anon, authenticated;
