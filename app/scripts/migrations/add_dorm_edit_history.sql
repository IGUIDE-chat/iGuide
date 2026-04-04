-- Migration: Add dorm_edit_history table for admin audit trail
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS dorm_edit_history (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dorm_id     TEXT        NOT NULL REFERENCES dorms(id) ON DELETE CASCADE,
    dorm_name   TEXT        NOT NULL,
    changed_by  TEXT        NOT NULL,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    summary     TEXT        NOT NULL,
    snapshot    JSONB       NOT NULL
);

ALTER TABLE dorm_edit_history ENABLE ROW LEVEL SECURITY;

-- Admins only (same pattern as dorms table RLS)
CREATE POLICY "admins_all_history" ON dorm_edit_history
    FOR ALL USING (
        (auth.jwt() ->> 'email') IN (
            SELECT email FROM auth.users
            WHERE raw_user_meta_data->>'isAdmin' = 'true'
        )
    );

CREATE INDEX IF NOT EXISTS dorm_edit_history_lookup
    ON dorm_edit_history(dorm_id, changed_at DESC);
