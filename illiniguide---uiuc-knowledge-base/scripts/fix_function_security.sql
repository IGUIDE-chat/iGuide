-- [SCRIPT] SQL update to fix function security warnings.
-- [脚本] 用于修复函数安全警告的 SQL 更新脚本。
-- ==============================================================================
-- Function Security Fix (Search Path)
-- 
-- DESCRIPTION:
-- This script updates database functions to explicitly set `search_path`.
-- This resolves the "role mutable search_path" security warning by preventing 
-- potential search path hijacking.
--
-- TARGET FUNCTIONS:
-- 1. update_updated_at_column()
-- 2. trim_conversations()
-- 3. trim_reading_history()
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Fix `update_updated_at_column`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. Fix `trim_conversations`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trim_conversations()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Check if user conversation count exceeds 100
  IF (SELECT count(*) FROM conversations WHERE user_id = NEW.user_id) > 100 THEN
    -- Delete lowest priority conversations (to keep limit at 100)
    -- Priority: Pinned > Recently Viewed > Recently Updated
    DELETE FROM conversations
    WHERE id IN (
      SELECT id FROM conversations
      WHERE user_id = NEW.user_id
      ORDER BY 
        is_pinned DESC, 
        GREATEST(last_viewed_at, updated_at) DESC 
      OFFSET 100
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. Fix `trim_reading_history`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trim_reading_history()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Delete old history for this user beyond the most recent 100 items
  DELETE FROM reading_history
  WHERE id IN (
    SELECT id FROM reading_history
    WHERE user_id = NEW.user_id
    ORDER BY last_viewed_at DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$;
