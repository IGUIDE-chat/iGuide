-- Migration: Add address fields to dorms table
-- Run manually in Supabase SQL Editor

ALTER TABLE public.dorms
    ADD COLUMN IF NOT EXISTS address    TEXT,
    ADD COLUMN IF NOT EXISTS address_zh TEXT;
