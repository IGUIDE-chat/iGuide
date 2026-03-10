-- Migration: Add photoUrl to floor_plans JSONB entries and website to dorms table
-- Run manually in Supabase SQL Editor
--
-- NOTE: photoUrl is stored inside the floor_plans JSONB array on each dorm row.
-- No schema change is needed for photoUrl — it's just a new key in the JSON objects.
-- This migration only adds the website column (if not already added).

-- Website column (idempotent)
ALTER TABLE public.dorms
    ADD COLUMN IF NOT EXISTS website TEXT;

-- To verify floor_plans structure supports photoUrl, you can inspect:
-- SELECT id, name, jsonb_array_elements(floor_plans) AS plan FROM public.dorms WHERE floor_plans IS NOT NULL LIMIT 5;
--
-- Example update to add photoUrl to a specific floor plan:
-- UPDATE public.dorms
-- SET floor_plans = jsonb_set(
--     floor_plans,
--     '{0,photoUrl}',
--     '"https://example.com/room-photo.jpg"'
-- )
-- WHERE id = 'your-dorm-id';
