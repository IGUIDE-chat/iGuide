# Supabase 数据库设置指南

## 前提条件

1. 注册 Supabase 账号: https://supabase.com
2. 创建一个新项目

## 数据库表结构

你需要在 Supabase 中创建以下两个表:

### 1. conversations 表

存储对话的基本信息。

```sql
-- 创建 conversations 表
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coze_conversation_id TEXT,
  title TEXT NOT NULL DEFAULT '新对话',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_last_viewed_at ON conversations(last_viewed_at DESC);
CREATE INDEX idx_conversations_is_pinned ON conversations(is_pinned DESC, updated_at DESC);

-- 启用行级安全策略 (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略:用户只能访问自己的对话
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);
```

### 2. messages 表

存储对话中的所有消息。

```sql
-- 创建 messages 表
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'model')),
  content TEXT NOT NULL,
  follow_up_questions TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- 启用行级安全策略
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略:用户只能访问自己对话中的消息
CREATE POLICY "Users can view messages from their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );
```

### 3. 自动更新 updated_at 触发器

创建一个函数和触发器,自动更新 `conversations` 表的 `updated_at` 字段:

```sql
-- 创建更新时间戳的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. 自动清理旧对话 (可选)

如果你希望 automatic limit each user to 100 conversations, keeping **pinned** and **recently active/viewed** ones first.

If you hope to limit each user to 100 conversations, keeping **pinned** and **recently active/viewed** ones first.

This setup assumes you have already created the `conversations` table with the `last_viewed_at` column as described in Section 1.

Then create the cleanup trigger:

```sql
-- 创建自动清理函数
CREATE OR REPLACE FUNCTION trim_conversations()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果用户对话数量超过 100 个
  IF (SELECT count(*) FROM conversations WHERE user_id = NEW.user_id) > 100 THEN
    -- 删除不需要保留的对话
    -- 优先级: 置顶 > 最近查看 > 最近更新
    DELETE FROM conversations
    WHERE id IN (
      SELECT id FROM conversations
      WHERE user_id = NEW.user_id
      ORDER BY 
        is_pinned DESC, 
        -- Coalesce ensures we use the latest of view or update time
        GREATEST(last_viewed_at, updated_at) DESC 
      OFFSET 100
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trim_conversations_trigger
  AFTER INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION trim_conversations();
```

### 5. reading_history 表

用于同步用户的浏览历史，并自动限制每个用户最多保留 100 条记录。

```sql
-- 1. 创建 reading_history 表
CREATE TABLE reading_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  article_title TEXT NOT NULL,
  article_title_zh TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT unique_user_article UNIQUE(user_id, article_id)
);

-- 2. 创建索引
CREATE INDEX idx_reading_history_user_id ON reading_history(user_id);
CREATE INDEX idx_reading_history_last_viewed_at ON reading_history(last_viewed_at DESC);
CREATE INDEX idx_reading_history_is_pinned ON reading_history(is_pinned DESC, last_viewed_at DESC);

-- 3. 启用 RLS 安全策略
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history"
  ON reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own history"
  ON reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
  ON reading_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own history"
  ON reading_history FOR DELETE
  USING (auth.uid() = user_id);

-- 4. 自动清理触发器 (限制 100 条)
CREATE OR REPLACE FUNCTION trim_reading_history()
RETURNS TRIGGER AS $$
BEGIN
  -- 删除该用户第 100 条之后的所有旧记录
  DELETE FROM reading_history
  WHERE id IN (
    SELECT id FROM reading_history
    WHERE user_id = NEW.user_id
    ORDER BY last_viewed_at DESC
    OFFSET 100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trim_reading_history_trigger
  AFTER INSERT ON reading_history
  FOR EACH ROW
  EXECUTE FUNCTION trim_reading_history();

-- 5. 开启实时监听 (CRITICAL for Sidebar auto-refresh)
ALTER PUBLICATION supabase_realtime ADD TABLE reading_history;
```

## 设置步骤

### 方法 1: 使用 Supabase SQL 编辑器(推荐)

1. 登录 Supabase Dashboard
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New Query**
5. 复制上面的所有 SQL 代码
6. 点击 **Run** 执行

### 方法 2: 使用 Supabase Table Editor

如果你不熟悉 SQL,可以使用可视化界面:

1. 点击左侧菜单的 **Table Editor**
2. 点击 **New Table**
3. 手动创建表和字段(但这样比较繁琐,不推荐)

## 获取 Supabase 凭证

1. 在 Supabase Dashboard 中,点击左侧的 **Project Settings** (齿轮图标)
2. 点击 **API** 标签
3. 复制以下信息:
   - **Project URL** (例如: `https://xxxxx.supabase.co`)
   - **anon public** key

## 配置环境变量

在项目根目录创建 `.env.local` 文件:

```env
VITE_SUPABASE_URL=你的_Project_URL
VITE_SUPABASE_ANON_KEY=你的_anon_public_key
```

**重要:** 不要将 `.env.local` 提交到 Git!确保它在 `.gitignore` 中。

## 验证设置

运行以下步骤验证设置是否正确:

1. 启动开发服务器: `npm run dev`
2. 打开浏览器访问 http://localhost:3000
3. 注册一个测试账号
4. 发送一条消息
5. 在 Supabase Dashboard 的 **Table Editor** 中检查:
   - `conversations` 表应该有一条新记录
   - `messages` 表应该有两条记录(用户消息 + AI 回复)

## 表结构说明

### conversations 表字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键,自动生成 |
| user_id | UUID | 用户 ID,关联到 auth.users |
| coze_conversation_id | TEXT | Coze AI 的对话 ID(可选) |
| title | TEXT | 对话标题 |
| is_pinned | BOOLEAN | 是否置顶 |
| created_at | TIMESTAMPTZ | 创建时间 |
| updated_at | TIMESTAMPTZ | 最后更新时间 |

### messages 表字段

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键,自动生成 |
| conversation_id | UUID | 关联的对话 ID |
| role | TEXT | 消息角色('user' 或 'model') |
| content | TEXT | 消息内容 |
| follow_up_questions | TEXT[] | 后续问题建议(数组) |
| created_at | TIMESTAMPTZ | 创建时间 |

## 安全说明

- ✅ 已启用行级安全策略 (RLS)
- ✅ 用户只能访问自己的对话和消息
- ✅ 删除对话时会自动删除相关消息(CASCADE)
- ✅ 使用 UUID 作为主键,更安全

## 常见问题

### Q: 为什么我看不到对话历史?
A: 检查:
1. 是否已登录(非访客模式)
2. Supabase 凭证是否正确配置
3. 浏览器控制台是否有错误信息

### Q: 如何清空测试数据?
A: 在 Supabase SQL 编辑器中运行:
```sql
TRUNCATE TABLE messages, conversations CASCADE;
```

### Q: 如何备份数据?
A: 在 Supabase Dashboard 中:
1. 点击 **Database** > **Backups**
2. 点击 **Create backup**



## 下一步

设置完成后,你就可以:
- ✅ 自动保存所有对话
- ✅ 查看历史对话
- ✅ 在不同设备间同步对话
- ✅ 永久保存重要对话

如有问题,请查看 Supabase 文档: https://supabase.com/docs
