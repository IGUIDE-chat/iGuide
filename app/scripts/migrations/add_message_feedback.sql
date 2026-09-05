-- Migration: Add message feedback (thumbs up / down on assistant replies)
-- Purpose: Capture a per-user quality signal for chat answers so responses
--          can be evaluated and improved over time.

-- ── message_feedback: one vote per user per assistant message ──────
CREATE TABLE IF NOT EXISTS public.message_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    -- Client-rendered message id. Note: live and reloaded message ids may
    -- differ (saveMessage assigns a fresh row id), so this is a best-effort
    -- key for correlating feedback with a specific answer.
    message_id      TEXT NOT NULL,
    -- 1 = thumbs up, -1 = thumbs down
    vote            SMALLINT NOT NULL CHECK (vote IN (1, -1)),
    -- Snapshot of the rated answer text for offline eval (optional).
    message_text    TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, message_id)
);

CREATE INDEX IF NOT EXISTS message_feedback_conversation_idx
  ON public.message_feedback (conversation_id);

ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own feedback"
  ON public.message_feedback FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own feedback"
  ON public.message_feedback FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own feedback"
  ON public.message_feedback FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own feedback"
  ON public.message_feedback FOR DELETE
  USING (user_id = (select auth.uid()));
