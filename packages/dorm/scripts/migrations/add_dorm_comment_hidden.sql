-- Migration: Moderation flag for dorm comments (hide without deleting)
-- Run manually in Supabase SQL Editor (Dashboard → SQL Editor)
--
-- Adds dorm_comments.hidden. A hidden comment stays in the table but is
-- invisible to everyone except admins, who can toggle it back.
-- Admin check uses the same JWT metadata pattern as the dorms /
-- dorm_edit_history policies (supports both `is_admin` and `isAdmin`).

ALTER TABLE dorm_comments
    ADD COLUMN IF NOT EXISTS hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- Keep the dorm page query cheap: only non-hidden rows are ever listed.
CREATE INDEX IF NOT EXISTS dorm_comments_visible_lookup
    ON dorm_comments(dorm_id, created_at DESC)
    WHERE hidden = FALSE;

-- ── Read: hidden rows never leave the database, except for admins ────────
DROP POLICY IF EXISTS "comments_read" ON dorm_comments;
CREATE POLICY "comments_read" ON dorm_comments
    FOR SELECT USING (
        hidden = FALSE
        OR coalesce(
            auth.jwt() -> 'user_metadata' ->> 'is_admin',
            auth.jwt() -> 'user_metadata' ->> 'isAdmin'
        ) = 'true'
    );

-- ── Update: authors keep editing their own visible comments only ─────────
-- USING is evaluated against the existing row, so an author can never edit
-- (or un-hide) a comment that an admin has already hidden.
DROP POLICY IF EXISTS "comments_update" ON dorm_comments;
CREATE POLICY "comments_update" ON dorm_comments
    FOR UPDATE USING (auth.uid() = user_id AND hidden = FALSE);

-- ── Update: admins may hide / un-hide any comment ────────────────────────
DROP POLICY IF EXISTS "comments_admin_update" ON dorm_comments;
CREATE POLICY "comments_admin_update" ON dorm_comments
    FOR UPDATE USING (
        coalesce(
            auth.jwt() -> 'user_metadata' ->> 'is_admin',
            auth.jwt() -> 'user_metadata' ->> 'isAdmin'
        ) = 'true'
    ) WITH CHECK (
        coalesce(
            auth.jwt() -> 'user_metadata' ->> 'is_admin',
            auth.jwt() -> 'user_metadata' ->> 'isAdmin'
        ) = 'true'
    );

-- ── Hide the two reported comments ───────────────────────────────────────
UPDATE dorm_comments
SET hidden = TRUE
WHERE id IN (
    '3f8ef15b-8587-48b1-838c-31d261839f73',  -- armory / michaelleeeeeeee
    'ca18a5c6-176f-4ca9-9160-35cf2b50a491'   -- hendrick / xtan0613
);
