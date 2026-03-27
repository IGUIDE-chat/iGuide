-- Migration: Add admin-facing dorm columns and normalize dining to TEXT.
-- Safe to rerun after partial or successful prior runs.

BEGIN;

-- 1. Ensure the newer admin/editor columns exist.
ALTER TABLE public.dorms
  ADD COLUMN IF NOT EXISTS categorized_tags JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bathroom_type TEXT DEFAULT 'communal',
  ADD COLUMN IF NOT EXISTS room_options JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS application_fee NUMERIC,
  ADD COLUMN IF NOT EXISTS dining_nearby_detail TEXT;

-- 2. Normalize dining to TEXT across fresh, partial, and already-migrated schemas.
DO $$
DECLARE
  dining_udt_name text;
  dining_old_udt_name text;
BEGIN
  SELECT c.udt_name
  INTO dining_udt_name
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'dorms'
    AND c.column_name = 'dining';

  SELECT c.udt_name
  INTO dining_old_udt_name
  FROM information_schema.columns AS c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'dorms'
    AND c.column_name = 'dining_old';

  IF dining_old_udt_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.dorms ADD COLUMN IF NOT EXISTS dining TEXT DEFAULT ''nearby''';

    EXECUTE $sql$
      UPDATE public.dorms
      SET dining = CASE
        WHEN dining_old IS TRUE THEN 'inside'
        ELSE 'nearby'
      END
    $sql$;

    EXECUTE 'ALTER TABLE public.dorms DROP COLUMN dining_old';
  ELSIF dining_udt_name IS NULL THEN
    EXECUTE 'ALTER TABLE public.dorms ADD COLUMN dining TEXT DEFAULT ''nearby''';
  ELSIF dining_udt_name = 'bool' THEN
    EXECUTE $sql$
      ALTER TABLE public.dorms
      ALTER COLUMN dining DROP DEFAULT,
      ALTER COLUMN dining TYPE TEXT
      USING CASE
        WHEN dining IS TRUE THEN 'inside'
        ELSE 'nearby'
      END,
      ALTER COLUMN dining SET DEFAULT 'nearby'
    $sql$;
  END IF;
END $$;

UPDATE public.dorms
SET dining = 'nearby'
WHERE dining IS NULL;

ALTER TABLE public.dorms
  ALTER COLUMN categorized_tags SET DEFAULT '{}'::jsonb,
  ALTER COLUMN bathroom_type SET DEFAULT 'communal',
  ALTER COLUMN room_options SET DEFAULT '[]'::jsonb,
  ALTER COLUMN dining SET DEFAULT 'nearby';

-- 3. Add constraints only once so reruns succeed.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.dorms'::regclass
      AND conname = 'chk_dining_type'
  ) THEN
    ALTER TABLE public.dorms
      ADD CONSTRAINT chk_dining_type
      CHECK (dining IN ('inside', 'nearby', 'none'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.dorms'::regclass
      AND conname = 'chk_bathroom_type'
  ) THEN
    ALTER TABLE public.dorms
      ADD CONSTRAINT chk_bathroom_type
      CHECK (bathroom_type IN ('communal', 'semi-private', 'private'));
  END IF;
END $$;

COMMIT;
