-- Migration: Add website field to dorms table
-- Run manually in Supabase SQL Editor

ALTER TABLE public.dorms
    ADD COLUMN IF NOT EXISTS website TEXT;

-- NOTE: photoUrl for floor plans is stored inside the floor_plans JSONB column.
-- No schema change needed — it's a new key within each JSON object in the array.
-- The dorm_edit_history table also needs no changes: its snapshot column (JSONB)
-- already captures all fields including website and floor_plans with photoUrl.
