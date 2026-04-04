-- Setup script for user dorm favorites and viewing history

-- ============================================================================
-- 1. Create dorm_favorites table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dorm_favorites (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) NOT NULL,
    dorm_id text NOT NULL,
    dorm_name text NOT NULL,
    dorm_name_zh text,
    notes text,
    created_at timestamptz DEFAULT now () NOT NULL,
    UNIQUE (user_id, dorm_id)
);

-- Row Level Security (RLS) for dorm_favorites
ALTER TABLE public.dorm_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only select their own favorites
CREATE POLICY "Users can view their own favorites" ON public.dorm_favorites FOR
SELECT USING (auth.uid () = user_id);

-- Users can only insert their own favorites
CREATE POLICY "Users can insert their own favorites" ON public.dorm_favorites FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Users can only update their own favorites
CREATE POLICY "Users can update their own favorites" ON public.dorm_favorites FOR
UPDATE USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON public.dorm_favorites FOR DELETE USING (auth.uid () = user_id);

-- Grant permissions
GRANT
SELECT, INSERT,
UPDATE, DELETE ON public.dorm_favorites TO authenticated;

-- ============================================================================
-- 2. Create dorm_viewing_history table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.dorm_viewing_history (
    id uuid DEFAULT gen_random_uuid () PRIMARY KEY,
    user_id uuid REFERENCES auth.users (id) NOT NULL,
    dorm_id text NOT NULL,
    dorm_name text NOT NULL,
    dorm_name_zh text,
    view_count integer DEFAULT 1 NOT NULL,
    last_viewed_at timestamptz DEFAULT now () NOT NULL,
    UNIQUE (user_id, dorm_id)
);

-- Row Level Security (RLS) for dorm_viewing_history
ALTER TABLE public.dorm_viewing_history ENABLE ROW LEVEL SECURITY;

-- Users can only select their own viewing history
CREATE POLICY "Users can view their own history" ON public.dorm_viewing_history FOR
SELECT USING (auth.uid () = user_id);

-- Users can only insert their own viewing history
CREATE POLICY "Users can insert their own history" ON public.dorm_viewing_history FOR INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Users can only update their own viewing history
CREATE POLICY "Users can update their own history" ON public.dorm_viewing_history FOR
UPDATE USING (auth.uid () = user_id)
WITH
    CHECK (auth.uid () = user_id);

-- Users can only delete their own viewing history
CREATE POLICY "Users can delete their own history" ON public.dorm_viewing_history FOR DELETE USING (auth.uid () = user_id);

-- Grant permissions
GRANT
SELECT, INSERT,
UPDATE, DELETE ON public.dorm_viewing_history TO authenticated;