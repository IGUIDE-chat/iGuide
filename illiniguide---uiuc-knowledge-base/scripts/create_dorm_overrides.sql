-- Migration: Create dorm_overrides table for admin-editable dorm content
-- Run this in the Supabase SQL editor.
--
-- This table stores admin overrides for static dorm data defined in dormData.ts.
-- The frontend merges these overrides with the static dataset at runtime.

CREATE TABLE IF NOT EXISTS public.dorm_overrides (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    dorm_id     text        NOT NULL UNIQUE,          -- matches Dorm.id in dormData.ts
    -- Basic info overrides
    name        text,
    name_zh     text,
    description text,
    description_zh text,
    image_url   text,
    -- Pricing
    price       integer,
    -- Pros/cons arrays
    pros        text[],
    pros_zh     text[],
    cons        text[],
    cons_zh     text[],
    -- Boolean amenity flags
    ac          boolean,
    dining      boolean,
    -- Audit fields
    updated_at  timestamptz DEFAULT now() NOT NULL,
    updated_by  uuid        REFERENCES auth.users(id)
);

-- Trigger: keep updated_at current on every update
CREATE OR REPLACE FUNCTION public.set_dorm_overrides_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_dorm_overrides_updated_at
    BEFORE UPDATE ON public.dorm_overrides
    FOR EACH ROW EXECUTE FUNCTION public.set_dorm_overrides_updated_at();

-- Row Level Security
ALTER TABLE public.dorm_overrides ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can read overrides
CREATE POLICY "dorm_overrides_select_all"
    ON public.dorm_overrides
    FOR SELECT
    USING (true);

-- Only users whose Supabase user_metadata.is_admin = true may write
CREATE POLICY "dorm_overrides_write_admin"
    ON public.dorm_overrides
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

-- Grant table-level privileges to the anon and authenticated roles
GRANT SELECT ON public.dorm_overrides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dorm_overrides TO authenticated;
