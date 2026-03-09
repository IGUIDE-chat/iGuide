-- Migration: Add categorized_tags, bathroom_type columns; alter dining from BOOLEAN to TEXT.
-- Run this AFTER backing up the dorms table.

-- 1. Add new columns
ALTER TABLE dorms
  ADD COLUMN IF NOT EXISTS categorized_tags JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS bathroom_type TEXT DEFAULT 'communal',
  ADD COLUMN IF NOT EXISTS room_options JSONB DEFAULT '[]'::jsonb;

-- 2. Alter dining from BOOLEAN to TEXT
--    PostgreSQL cannot directly cast BOOLEAN → TEXT in ALTER COLUMN,
--    so we rename, add new column, migrate data, and drop old.
ALTER TABLE dorms RENAME COLUMN dining TO dining_old;
ALTER TABLE dorms ADD COLUMN dining TEXT DEFAULT 'nearby';

UPDATE dorms
SET dining = CASE
  WHEN dining_old = true THEN 'inside'
  WHEN dining_old = false THEN 'nearby'
  ELSE 'nearby'
END;

ALTER TABLE dorms DROP COLUMN dining_old;

-- 3. Add CHECK constraints
ALTER TABLE dorms
  ADD CONSTRAINT chk_dining_type CHECK (dining IN ('inside', 'nearby', 'none')),
  ADD CONSTRAINT chk_bathroom_type CHECK (bathroom_type IN ('communal', 'semi-private', 'private'));
