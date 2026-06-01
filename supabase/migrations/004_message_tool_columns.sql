ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_calls JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tool_call_id TEXT;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_role_check;
ALTER TABLE messages ADD CONSTRAINT messages_role_check
  CHECK (role IN ('user', 'assistant', 'tool', 'system', 'model'));

CREATE INDEX IF NOT EXISTS messages_tool_call_id_idx ON messages(tool_call_id) WHERE tool_call_id IS NOT NULL;
