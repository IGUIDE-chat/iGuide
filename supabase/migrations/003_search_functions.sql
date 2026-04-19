-- Search RPCs for iGuide database v2 retrieval tables.

create or replace function public.hybrid_search(
  query_text text,
  query_embedding vector(384),
  match_count int default 10,
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
returns table (
  chunk_id uuid,
  chunk_text text,
  title text,
  url text,
  semantic_rank bigint,
  fts_rank bigint,
  rrf_score double precision
)
language sql
stable
as $$
  with params as (
    select
      websearch_to_tsquery('english', query_text) as query_ts,
      greatest(match_count, 1) as limit_count,
      semantic_weight::double precision as semantic_weight_value,
      full_text_weight::double precision as full_text_weight_value,
      greatest(rrf_k, 1)::double precision as rrf_k_value
  ),
  semantic as (
    select
      c.id,
      row_number() over (order by c.embedding <=> query_embedding) as rank
    from public.chunks c
    cross join params p
    where c.is_active = true
      and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit (select limit_count * 2 from params)
  ),
  fts as (
    select
      c.id,
      row_number() over (
        order by ts_rank_cd(c.fts_vector, p.query_ts) desc
      ) as rank
    from public.chunks c
    cross join params p
    where c.is_active = true
      and c.fts_vector @@ p.query_ts
    order by ts_rank_cd(c.fts_vector, p.query_ts) desc
    limit (select limit_count * 2 from params)
  )
  select
    c.id as chunk_id,
    c.chunk_text,
    a.title,
    coalesce(a.canonical_url, s.base_url) as url,
    semantic.rank as semantic_rank,
    fts.rank as fts_rank,
    coalesce(
      1.0 / (p.rrf_k_value + semantic.rank::double precision),
      0
    ) * p.semantic_weight_value
      + coalesce(
        1.0 / (p.rrf_k_value + fts.rank::double precision),
        0
      ) * p.full_text_weight_value as rrf_score
  from semantic
  full outer join fts on semantic.id = fts.id
  join public.chunks c on c.id = coalesce(semantic.id, fts.id)
  join public.artifacts a on a.id = c.artifact_id
  join public.source_snapshots ss on ss.id = a.source_snapshot_id
  join public.sources s on s.id = ss.source_id
  cross join params p
  order by rrf_score desc
  limit (select limit_count from params);
$$;

create or replace function public.keyword_search(
  query_text text,
  match_count int default 10
)
returns table (
  chunk_id uuid,
  chunk_text text,
  title text,
  url text,
  fts_score double precision
)
language sql
stable
as $$
  with params as (
    select
      websearch_to_tsquery('english', query_text) as query_ts,
      greatest(match_count, 1) as limit_count
  )
  select
    c.id as chunk_id,
    c.chunk_text,
    a.title,
    coalesce(a.canonical_url, s.base_url) as url,
    ts_rank_cd(c.fts_vector, p.query_ts)::double precision as fts_score
  from public.chunks c
  join public.artifacts a on a.id = c.artifact_id
  join public.source_snapshots ss on ss.id = a.source_snapshot_id
  join public.sources s on s.id = ss.source_id
  cross join params p
  where c.is_active = true
    and c.fts_vector @@ p.query_ts
  order by ts_rank_cd(c.fts_vector, p.query_ts) desc
  limit (select limit_count from params);
$$;

create or replace function public.search_objects(
  query_text text,
  school_id text,
  object_types text[] default null,
  match_count int default 10
)
returns table (
  object_id uuid,
  object_type text,
  title text,
  summary text,
  score double precision,
  canonical_url text
)
language sql
stable
as $$
  with params as (
    select
      websearch_to_tsquery('english', query_text) as query_ts,
      school_id as school_id_value,
      object_types as object_types_value,
      greatest(match_count, 1) as limit_count
  )
  select *
  from (
    select
      c.id as object_id,
      'course'::text as object_type,
      c.title,
      c.description as summary,
      ts_rank_cd(c.fts_vector, p.query_ts)::double precision as score,
      c.canonical_url
    from public.course c
    cross join params p
    where c.school_id = p.school_id_value
      and c.fts_vector @@ p.query_ts
      and (
        p.object_types_value is null
        or 'course' = any(p.object_types_value)
      )

    union all

    select
      co.id as object_id,
      'course_offering'::text as object_type,
      trim(co.term_code || ' ' || coalesce(co.section_code, '')) as title,
      co.schedule_text as summary,
      ts_rank_cd(co.fts_vector, p.query_ts)::double precision as score,
      co.canonical_url
    from public.course_offering co
    cross join params p
    where co.school_id = p.school_id_value
      and co.fts_vector @@ p.query_ts
      and (
        p.object_types_value is null
        or 'course_offering' = any(p.object_types_value)
      )

    union all

    select
      aci.id as object_id,
      'academic_calendar_item'::text as object_type,
      aci.title,
      aci.summary,
      ts_rank_cd(aci.fts_vector, p.query_ts)::double precision as score,
      aci.canonical_url
    from public.academic_calendar_item aci
    cross join params p
    where aci.school_id = p.school_id_value
      and aci.fts_vector @@ p.query_ts
      and (
        p.object_types_value is null
        or 'academic_calendar_item' = any(p.object_types_value)
      )

    union all

    select
      los.id as object_id,
      'location_or_service'::text as object_type,
      coalesce(los.display_name, los.name) as title,
      los.summary,
      ts_rank_cd(los.fts_vector, p.query_ts)::double precision as score,
      los.canonical_url
    from public.location_or_service los
    cross join params p
    where los.school_id = p.school_id_value
      and los.fts_vector @@ p.query_ts
      and (
        p.object_types_value is null
        or 'location_or_service' = any(p.object_types_value)
      )

    union all

    select
      h.id as object_id,
      'housing'::text as object_type,
      coalesce(h.display_name, h.name) as title,
      h.summary,
      ts_rank_cd(h.fts_vector, p.query_ts)::double precision as score,
      h.canonical_url
    from public.housing h
    cross join params p
    where h.school_id = p.school_id_value
      and h.fts_vector @@ p.query_ts
      and (
        p.object_types_value is null
        or 'housing' = any(p.object_types_value)
      )
  ) ranked
  order by score desc
  limit (select limit_count from params);
$$;

grant execute on function public.hybrid_search(text, vector(384), int, float, float, int) to anon, authenticated;
grant execute on function public.keyword_search(text, int) to anon, authenticated;
grant execute on function public.search_objects(text, text, text[], int) to anon, authenticated;
