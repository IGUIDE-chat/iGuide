-- Migration: Add Soul, User Memory, and Conversation Memory tables
-- Purpose: Per-user AI persona customization, persistent user profile, per-conversation memory

-- ── user_souls: per-user AI persona customization ──────────────────
CREATE TABLE IF NOT EXISTS public.user_souls (
    user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    soul_prompt   TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_souls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own soul"
  ON public.user_souls FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own soul"
  ON public.user_souls FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own soul"
  ON public.user_souls FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── user_memories: persistent user profile (user.md) ───────────────
CREATE TABLE IF NOT EXISTS public.user_memories (
    user_id       UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_text   TEXT NOT NULL DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own memory"
  ON public.user_memories FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own memory"
  ON public.user_memories FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own memory"
  ON public.user_memories FOR UPDATE
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── conversation_memories: per-conversation key facts ──────────────
CREATE TABLE IF NOT EXISTS public.conversation_memories (
    conversation_id UUID PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
    memory_text     TEXT NOT NULL DEFAULT '',
    updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.conversation_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read memories for their conversations"
  ON public.conversation_memories FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert memories for their conversations"
  ON public.conversation_memories FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update memories for their conversations"
  ON public.conversation_memories FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = (select auth.uid())
    )
  );
