-- Fix: dorm_edit_history RLS policy
-- The old policy queried auth.users which causes "permission denied for table users"
-- New policy checks the current user's JWT metadata directly (no subquery needed)
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)

-- Drop the broken policy
DROP POLICY IF EXISTS "admins_all_history" ON dorm_edit_history;

-- Create a new policy that checks JWT metadata directly
-- This supports both 'is_admin' (underscore) and 'isAdmin' (camelCase) keys
CREATE POLICY "admins_all_history" ON dorm_edit_history
    FOR ALL USING (
        coalesce(
            auth.jwt() -> 'user_metadata' ->> 'is_admin',
            auth.jwt() -> 'user_metadata' ->> 'isAdmin'
        ) = 'true'
    );
