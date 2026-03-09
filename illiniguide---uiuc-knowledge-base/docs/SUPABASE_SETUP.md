# Supabase Setup & Maintenance Guide | Supabase 数据库设置与维护指南
English | [中文](#中文版本-chinese-version)

---

## English Version

### Prerequisites
1. Create a Supabase account: https://supabase.com
2. Create a new project

### Database Schema & Maintenance

This project uses Supabase to store conversations, reading history, and static application data such as dorms.

#### 1. Dorms Data Management (New Unified Architecture)
The `dorms` table is the single source of truth for housing data.

**Initialization / Migration:**
To create the `dorms` table with Row Level Security (RLS) policies:
```bash
# Run this SQL script in your Supabase SQL Editor
scripts/migrations/create_dorms_table.sql
# And to add the new categorized tags schema:
scripts/migrations/add_categorized_tags.sql
```
**Data Maintenance & Synchronization:**
Whenever you update static dorm data in the codebase or want to migrate admin overrides into the unified table, use the seed script:
\\ash
npx tsx scripts/seed-dorms-table.ts
\*Requires \SUPABASE_URL\ and \SUPABASE_SERVICE_KEY\ environment variables.* 

#### 2. User Features (Favorites & History)
To enable users to save their favorite dorms and track their viewing history:
\\ash
# Run this SQL script in your Supabase SQL Editor
scripts/create_dorm_user_features.sql
\
#### 3. Conversations & Messages
Run the following SQL to set up the chat history tables (\conversations\ and \messages\) with auto-cleanup triggers (limits to 100 conversations per user).

*(Note: Please refer to the initial codebase SQL migration snippets for the exact definitions of \conversations\, \messages\, and eading_history\ tables.)*

---

## 中文版本 (Chinese Version)

### 前提条件
1. 注册 Supabase 账号: https://supabase.com
2. 创建一个新项目

### 数据库表结构与日常维护

本项目使用 Supabase 存储聊天记录、阅读历史以及应用静态数据（如宿舍信息）。

#### 1. 宿舍数据管理 (全新统一架构)
`dorms` 表是所有宿舍数据的唯一真实数据源（Single Source of Truth）。

**初始化与建表：**
在 Supabase SQL Editor 中运行以下脚本来创建 `dorms` 表及 RLS 安全策略：
```bash
scripts/migrations/create_dorms_table.sql
# 以及新增的分类标签 Schema：
scripts/migrations/add_categorized_tags.sql
```
**数据维护与同步：**
每当你在代码中更新了静态宿舍数据，或者希望将管理员在后台的操作同步为持久化数据时，请运行播种/同步脚本：
\\ash
npx tsx scripts/seed-dorms-table.ts
\*运行此脚本需要配置 \SUPABASE_URL\ 和 \SUPABASE_SERVICE_KEY\ 环境变量。*

#### 2. 用户功能（收藏与浏览历史）
为了让用户可以收藏宿舍并记录浏览历史，需要创建对应的用户功能表：
\\ash
# 在 Supabase SQL Editor 中运行此脚本
scripts/create_dorm_user_features.sql
\
#### 3. 聊天记录与消息表
请在 SQL Editor 中执行建表语句以创建 \conversations\(会话) 和 \messages\(消息) 表，以及 eading_history\(阅读历史) 表。系统内置了触发器，会自动清理旧数据（每个用户最多保留 100 条记录）。

*(注：建表 SQL 语句的完整详情可以直接参考之前的初始化代码片段)*

