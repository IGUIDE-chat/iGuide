-- Migration: Add dorm comments and comment votes tables
-- Run manually in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS dorm_comments (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dorm_id      TEXT        NOT NULL REFERENCES dorms(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT        NOT NULL,
    content      TEXT        NOT NULL,
    dorm_vote    SMALLINT    CHECK (dorm_vote IN (-1, 1)),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(dorm_id, user_id)
);

ALTER TABLE dorm_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_read"   ON dorm_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON dorm_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_update" ON dorm_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON dorm_comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dorm_comments_lookup
    ON dorm_comments(dorm_id, created_at DESC);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS dorm_comment_votes (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID        NOT NULL REFERENCES dorm_comments(id) ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote       SMALLINT    NOT NULL CHECK (vote IN (-1, 1)),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

ALTER TABLE dorm_comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cvotes_read"   ON dorm_comment_votes FOR SELECT USING (true);
CREATE POLICY "cvotes_insert" ON dorm_comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cvotes_update" ON dorm_comment_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "cvotes_delete" ON dorm_comment_votes FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS dorm_comment_votes_lookup
    ON dorm_comment_votes(comment_id, user_id);
