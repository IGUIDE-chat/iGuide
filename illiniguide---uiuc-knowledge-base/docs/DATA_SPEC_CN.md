# 数据架构与爬虫/ETL 开发规范 (Data Architecture & ETL Spec)

本文档是 **IlliniGuide Knowledge Base** 的核心技术规范，定义了数据模型、存储方案及 ETL 写入流程。

---

## 1. 系统架构概览

系统采用双链路数据存储设计：

1.  **知识库 (`knowledge.db`)**：
    *   **用途**：存储爬取的网页内容、切片 (Chunks) 及索引。
    *   **技术栈**：SQLite (本地文件) + FTS5 (全文检索) + sqlite-vec (向量检索)。
    *   **位置**：部署在 VPS 本地（与 Chat API 同机），这是为了追求极致的读取速度和零网络开销。
    *   **读写模式**：Chat API 只读；ETL 进程负责写入。

2.  **用户数据 (Supabase)**：
    *   **用途**：存储用户身份 (Auth) 和对话历史 (Chat Logs)。
    *   **技术栈**：Postgres (Cloud)。
    *   **读写模式**：API 异步写入。

---

## 2. 核心数据模型 (Data Model)

知识库数据分为三层：

### 2.1 Source (来源)
表示内容的一个集合，例如一个特定的站点域名、Sitemap 或数据源配置。主要用于任务调度。

### 2.2 Document (文档/页面)
对应一个唯一的 URL。
*   **指纹 (Fingerprints)**：使用 `main_hash` (正文哈希) 来判断页面是否实质性更新，避免重复处理未变动的页面。

### 2.3 Chunk (切片)
文档切分后的最小检索单元。
*   **内容注入**：Chunk 的内容 **必须** 是经过元数据注入的完整文本 (例如包含标题路径 `[CS440 > Grading] ...`)。这确保 FTS 和向量检索都能通过上下文召回。

---

## 3. 数据库 Schema (SQLite)

以下是 `knowledge.db` 的推荐建表语句。我们使用 `sqlite-vec` 存储向量，格式选用 **Float32 BLOB** 以获得最佳性能。

```sql
-- 开启外键约束
PRAGMA foreign_keys = ON;

-- ==========================================
-- 1. DOCUMENTS 表 (页面级元数据)
-- ==========================================
CREATE TABLE IF NOT EXISTS documents (
    doc_id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,                -- 核心去重键
    canonical_url TEXT,
    title TEXT,
    site_host TEXT,                          -- 域名，如 "cs.illinois.edu"
    page_type TEXT,                          -- 类型，如 "syllabus", "faq"
    
    -- 变更检测与版本控制
    etag TEXT,
    last_modified TEXT,
    raw_hash TEXT,                           -- 原始 HTML 哈希
    main_hash TEXT,                          -- 清洗后正文哈希 (用于跳过未变动页面)
    
    -- 状态与质量
    status TEXT DEFAULT 'ok',                -- 枚举: 'ok', 'drop', 'fetch_fail'
    quality_score REAL,
    
    -- 时间戳
    fetched_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_host ON documents(site_host);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);


-- ==========================================
-- 2. CHUNKS 表 (切片内容)
-- ==========================================
CREATE TABLE IF NOT EXISTS chunks (
    chunk_id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_id INTEGER NOT NULL,
    chunk_index INTEGER NOT NULL,            -- 切片序号
    
    heading_path TEXT,                       -- 路径面包屑: "CS440 > Grading > Exams"
    content TEXT NOT NULL,                   -- **注意：这是注入元数据后的最终内容**
    content_hash TEXT,                       -- 切片级去重哈希
    
    token_len INTEGER,
    char_len INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(doc_id) REFERENCES documents(doc_id) ON DELETE CASCADE,
    UNIQUE(doc_id, chunk_index)              -- 保证同一文档下切片序号唯一
);


-- ==========================================
-- 3. FTS5 表 (全文检索)
-- ==========================================
-- 使用 content='chunks' 也可以，但这里为了结构清晰使用外部内容表模式
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    content,
    heading_path,
    content='chunks',
    content_rowid='chunk_id'
);

-- 触发器：自动同步 chunks 表的增删改到 FTS 索引
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, content, heading_path) VALUES (new.chunk_id, new.content, new.heading_path);
END;

CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, content, heading_path) VALUES('delete', old.chunk_id, old.content, old.heading_path);
END;

CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, content, heading_path) VALUES('delete', old.chunk_id, old.content, old.heading_path);
  INSERT INTO chunks_fts(rowid, content, heading_path) VALUES (new.chunk_id, new.content, new.heading_path);
END;


-- ==========================================
-- 4. VECTOR 表 (语义检索)
-- ==========================================
-- 依赖 sqlite-vec 插件。此处假设使用 BGE-M3 (1024 维)。
-- 格式：FLOAT[1024] 对应底层的 Float32 BLOB 存储。
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(
    chunk_id INTEGER PRIMARY KEY,
    embedding FLOAT[1024]
);
```

---

## 4. 数据传输对象 (DTO Specification)

ETL 内部流转建议采用以下标准 JSON 结构。

### 4.1 DocumentRecord

```json
{
  "url": "https://cs.illinois.edu/academics/courses/cs440",
  "canonical_url": "https://cs.illinois.edu/academics/courses/cs440",
  "title": "CS 440: Artificial Intelligence",
  "site_host": "cs.illinois.edu",
  "page_type": "course",
  "http": {
    "status_code": 200,
    "etag": "\"abc123\"",
    "last_modified": "Mon, 22 Jan 2026 18:30:00 GMT"
  },
  "fingerprints": {
    "raw_hash": "md5:...",
    "main_hash": "md5:..."  // 关键字段：正文哈希
  },
  "quality": {
    "char_len": 18234,
    "quality_score": 0.87
  },
  "timestamps": {
    "fetched_at": "2026-01-27T10:31:00-06:00"
  }
}
```

### 4.2 ChunkRecord

```json
{
  "doc_url": "https://cs.illinois.edu/academics/courses/cs440",
  "chunk_index": 3,
  "heading_path": "CS 440 > Grading",
  "content": "[Course: CS 440] [Topic: Grading] Final Exam counts for 40% ...",
  // 注意：虽然外层是 JSON，但 content 字段内容强烈建议保留 Markdown 格式（如标题 #, 列表 -），
  // 这样 LLM 在读取时能保留语义层级。
  "content_hash": "sha1:...",
  "char_len": 980,
  "embedding": {
    "model": "bge-m3",
    "dim": 1024,
    "vector": "BINARY_BLOB" // 建议在 Python 中直接转为 bytes 传递
  }
}
```

---

## 5. 写入流程 (Write Strategy)

写入过程必须保证**原子性 (Atomic)** 和**幂等性 (Idempotent)**。同一 URL 重复跑不应产生重复数据，而应更新现有数据。

### Python 伪代码参考

```python
import sqlite3
import struct

def write_batch(db_path, documents_batch):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 开启事务
        cursor.execute("BEGIN TRANSACTION")
        
        for doc in documents_batch:
            # 1. 检查是否存在及内容是否变更
            cursor.execute("SELECT doc_id, main_hash FROM documents WHERE url = ?", (doc.url,))
            existing = cursor.fetchone()
            
            should_update_chunks = True
            doc_id = None
            
            if existing:
                doc_id, old_hash = existing
                if old_hash == doc.fingerprints.main_hash:
                    # 内容未变：只更新爬取时间，跳过 Chunk 更新
                    cursor.execute("UPDATE documents SET fetched_at=?, updated_at=CURRENT_TIMESTAMP WHERE doc_id=?", 
                        (doc.timestamps.fetched_at, doc_id))
                    should_update_chunks = False 
                else:
                    # 内容变了：更新 Hash 和 Metadata
                    cursor.execute("UPDATE documents SET main_hash=?, updated_at=CURRENT_TIMESTAMP WHERE doc_id=?", 
                        (doc.fingerprints.main_hash, doc_id))
            else:
                # 新页面：插入 Documents 表
                cursor.execute("INSERT INTO documents (url, main_hash, ...) VALUES (?, ...)", 
                    (doc.url, doc.fingerprints.main_hash))
                doc_id = cursor.lastrowid

            # 2. 更新 Chunk (仅当内容变更时)
            if should_update_chunks:
                # A. 删除旧 Chunks (Trigger 会自动处理 FTS/Vec 的清理，视具体实现而定，建议手动检查)
                cursor.execute("DELETE FROM chunks WHERE doc_id = ?", (doc_id,))
                
                # B. 插入新 Chunks
                for chunk in doc.chunks:
                    # 插入 content
                    cursor.execute("INSERT INTO chunks (doc_id, content, ...) VALUES (?, ...)", 
                        (doc_id, chunk.content))
                    new_chunk_id = cursor.lastrowid
                    
                    # 插入 vector (转为二进制 blob)
                    # vec_blob = struct.pack(f'{len(v)}f', *v)
                    cursor.execute("INSERT INTO chunks_vec (chunk_id, embedding) VALUES (?, ?)", 
                        (new_chunk_id, chunk.embedding_blob))
        
        cursor.execute("COMMIT")
        
    except Exception as e:
        cursor.execute("ROLLBACK")
        raise
    finally:
        conn.close()
```
