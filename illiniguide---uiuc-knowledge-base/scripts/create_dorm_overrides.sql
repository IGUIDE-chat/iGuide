-- Migration: Create dorm_overrides table for admin-editable dorm content
-- Run this in the Supabase SQL editor.
--
-- This table stores admin overrides for static dorm data defined in dormData.ts.
-- The frontend merges these overrides with the static dataset at runtime.

CREATE TABLE IF NOT EXISTS public.dorm_overrides (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    dorm_id text NOT NULL UNIQUE, -- matches Dorm.id in dormData.ts
    -- Basic info overrides
    name text,
    name_zh text,
    description text,
    description_zh text,
    image_url text,
    -- Pricing
    price integer,
    location text,
    location_zh text,
    type text,
    type_zh text,
    housing_type text,
    room_types text [],
    tags text [],
    -- Pros/cons arrays
    pros text [],
    pros_zh text [],
    cons text [],
    cons_zh text [],
    -- Boolean amenity flags
    ac boolean,
    dining boolean,
    -- Audit fields
    updated_at timestamptz DEFAULT now () NOT NULL,
    updated_by uuid REFERENCES auth.users (id)
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
CREATE POLICY "dorm_overrides_select_all" ON public.dorm_overrides FOR
SELECT USING (true);

-- Replace write policy with a robust admin check:
-- allow admin flag from app_metadata or user_metadata.
DROP POLICY IF EXISTS "dorm_overrides_write_admin" ON public.dorm_overrides;
CREATE POLICY "dorm_overrides_write_admin"
    ON public.dorm_overrides
    FOR ALL
    USING (
        COALESCE(
            NULLIF(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')::boolean,
            NULLIF(auth.jwt() -> 'user_metadata' ->> 'is_admin', '')::boolean,
            false
        ) = true
    )
    WITH CHECK (
        COALESCE(
            NULLIF(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')::boolean,
            NULLIF(auth.jwt() -> 'user_metadata' ->> 'is_admin', '')::boolean,
            false
        ) = true
    );

GRANT SELECT ON public.dorm_overrides TO anon, authenticated;

GRANT INSERT,
UPDATE,
DELETE ON public.dorm_overrides TO authenticated;

-- ==============================================================================
-- Supabase Storage: 'dorm-images' Bucket Setup
-- ==============================================================================

-- Create the bucket if it doesn't exist (publicly accessible)
INSERT INTO
    storage.buckets (id, name, public)
VALUES (
        'dorm-images',
        'dorm-images',
        true
    )
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Note: 'storage.objects' table uses RLS

DROP POLICY IF EXISTS "Public Access to Dorm Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Dorm Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Dorm Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Dorm Images" ON storage.objects;

-- 1. Anyone can view/read images
CREATE POLICY "Public Access to Dorm Images" ON storage.objects FOR
SELECT USING (bucket_id = 'dorm-images');

-- 2. Only admins can upload new images
CREATE POLICY "Admin Upload Dorm Images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'dorm-images'
        AND COALESCE(
            NULLIF(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')::boolean,
            NULLIF(auth.jwt() -> 'user_metadata' ->> 'is_admin', '')::boolean,
            false
        ) = true
    );

-- 3. Only admins can update images
CREATE POLICY "Admin Update Dorm Images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'dorm-images'
        AND COALESCE(
            NULLIF(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')::boolean,
            NULLIF(auth.jwt() -> 'user_metadata' ->> 'is_admin', '')::boolean,
            false
        ) = true
    )
    WITH CHECK (
        bucket_id = 'dorm-images'
        AND COALESCE(
            NULLIF(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')::boolean,
            NULLIF(auth.jwt() -> 'user_metadata' ->> 'is_admin', '')::boolean,
            false
        ) = true
    );

-- 4. Only admins can delete images
CREATE POLICY "Admin Delete Dorm Images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'dorm-images'
        AND COALESCE(
            NULLIF(auth.jwt() -> 'app_metadata' ->> 'is_admin', '')::boolean,
            NULLIF(auth.jwt() -> 'user_metadata' ->> 'is_admin', '')::boolean,
            false
        ) = true
    );
