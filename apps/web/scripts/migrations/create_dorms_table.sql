-- Migration: Create `dorms` table as the single source of truth for dorm data.
-- Replaces the previous override-based approach (dorm_overrides table).
-- Run this in the Supabase SQL Editor or via `psql`.

-- 1. Create the dorms table
CREATE TABLE IF NOT EXISTS public.dorms (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    name_zh         TEXT,
    description     TEXT NOT NULL DEFAULT '',
    description_zh  TEXT,
    image_url       TEXT,
    price           NUMERIC,
    price_range     TEXT,
    location        TEXT,
    location_zh     TEXT,
    type            TEXT,
    type_zh         TEXT,
    housing_type    TEXT,
    ac              BOOLEAN DEFAULT false,
    dining          BOOLEAN DEFAULT false,
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    tags            TEXT[] DEFAULT '{}',
    structured_tags JSONB DEFAULT '{}',
    room_types      TEXT[] DEFAULT '{}',
    room_options    JSONB DEFAULT '[]',
    floor_plans     JSONB DEFAULT '[]',
    gallery_images  TEXT[] DEFAULT '{}',
    pros            TEXT[] DEFAULT '{}',
    pros_zh         TEXT[] DEFAULT '{}',
    cons            TEXT[] DEFAULT '{}',
    cons_zh         TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Auto-update `updated_at` on row change
CREATE OR REPLACE FUNCTION public.update_dorms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dorms_updated_at ON public.dorms;
CREATE TRIGGER trg_dorms_updated_at
    BEFORE UPDATE ON public.dorms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_dorms_updated_at();

-- 3. Enable RLS
ALTER TABLE public.dorms ENABLE ROW LEVEL SECURITY;

-- 4. Public read access (anyone can browse dorms)
CREATE POLICY "dorms_public_read"
    ON public.dorms
    FOR SELECT
    USING (true);

-- 5. Admin-only write access (insert/update/delete)
-- Uses the same is_admin metadata check pattern as dorm_overrides.
CREATE POLICY "dorms_admin_write"
    ON public.dorms
    FOR ALL
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    )
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
    );

-- 6. Archive the old dorm_overrides table
COMMENT ON TABLE public.dorm_overrides IS 'ARCHIVED: Data migrated to dorms table. Kept for reference only.';
