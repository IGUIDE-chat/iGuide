-- ==============================================================================
-- RLS Policy Optimization Migration
-- 
-- DESCRIPTION:
-- This script replaces `auth.uid()` with `(select auth.uid())` in RLS policies.
-- This prevents Postgres from re-evaluating the auth function for every row,
-- significantly improving query performance for large tables.
--
-- TARGET TABLES:
-- 1. conversations
-- 2. messages
-- 3. reading_history
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Optimize `conversations` Table
-- ------------------------------------------------------------------------------

-- Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Recreate policies with optimization
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (user_id = (select auth.uid()));


-- ------------------------------------------------------------------------------
-- 2. Optimize `messages` Table
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON messages;

CREATE POLICY "Users can view messages from their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = (select auth.uid())
    )
  );


-- ------------------------------------------------------------------------------
-- 3. Optimize `reading_history` Table
-- ------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own history" ON reading_history;
DROP POLICY IF EXISTS "Users can insert their own history" ON reading_history;
DROP POLICY IF EXISTS "Users can update their own history" ON reading_history;
DROP POLICY IF EXISTS "Users can delete their own history" ON reading_history;

CREATE POLICY "Users can view their own history"
  ON reading_history FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own history"
  ON reading_history FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own history"
  ON reading_history FOR UPDATE
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own history"
  ON reading_history FOR DELETE
  USING (user_id = (select auth.uid()));
