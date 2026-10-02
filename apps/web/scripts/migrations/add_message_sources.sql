-- Migration: Add sources to chat messages
-- Purpose: Keep the web pages an assistant reply was based on, so the
-- "N sources" button and numbered citations survive reloading a conversation.
-- Shape: [{ "id": text, "url": text, "title": text, "snippet"?: text }]
-- Until this runs, the app saves messages without their sources.

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sources JSONB;

-- Reload PostgREST's schema cache so the new column is accepted right away.
NOTIFY pgrst, 'reload schema';
