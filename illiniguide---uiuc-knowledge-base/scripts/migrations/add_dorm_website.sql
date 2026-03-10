-- Migration: Add website field to dorms table
-- Run manually in Supabase SQL Editor

ALTER TABLE public.dorms
    ADD COLUMN IF NOT EXISTS website TEXT;
