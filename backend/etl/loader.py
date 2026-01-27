import sqlite3
import json
import logging
from typing import List
from concurrent.futures import ThreadPoolExecutor
# import httpx 
import requests # Use requests for simplicity in blocking threads
import time

from backend.core.config import get_settings
from backend.etl.processor import ContentProcessor

from backend.core.models import EmbeddingModel

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("etl_loader")

class ETLLoader:
    def __init__(self):
        self.db_path = settings.KNOWLEDGE_DB_PATH
        self.processor = ContentProcessor()
        self.embedding_model = EmbeddingModel(settings.MODEL_PATH)
        self._init_db()

    def _init_db(self):
        """Initialize SQLite DB with FTS5 and Vector tables"""
        conn = sqlite3.connect(self.db_path)
        conn.execute("PRAGMA journal_mode=WAL;") # Enable WAL for concurrent readers/writers
        cur = conn.cursor()
        
        # 1. Documents Table (Source of Truth / MD5 tracking)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                url TEXT PRIMARY KEY,
                md5 TEXT,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # 2. FTS5 Table
        # Note: 'content' is what we search against
        cur.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
                content,
                metadata,
                tokenize='porter'
            )
        """)
        
        # 3. Vector Table (sqlite-vec)
        # Note: Syntax depends on sqlite-vec version. Assuming v0.1.0+
        # We store embedding and link back to FTS or have metadata here?
        # Usually easier to store metadata in a separate table or duplicate it if small.
        try:
            conn.enable_load_extension(True)
            import sqlite_vec
            conn.load_extension(sqlite_vec.loadable_path())
            cur.execute("""
                CREATE VIRTUAL TABLE IF NOT EXISTS documents_vec USING vec0(
                    embedding float[1024]
                )
            """)
            # Create a side table to map vec rowid to metadata if needed, 
            # OR just duplicate content/metadata in a normal table and sync rowids.
            # Simplified: We will just insert into vec and rely on parallel rowids if possible,
            # BUT sqlite-vec usually manages its own rowids. 
            # Better approach for Hybrid: Store chunks in a standard table, and index specific columns.
            
            # Revised Schema for Hybrid:
            # Table: chunks
            #   id TEXT PRIMARY KEY
            #   content TEXT
            #   metadata JSON
            #   embedding BLOB/Vector
            
            # Since sqlite-vec is a virtual table, we might need to handle it separately.
            # Let's keep it simple: FTS table for text, Vec table for vectors.
            # We will use the same integer ROWID to link them if possible, or store a 'chunk_id' in both.
            
            # Actually, let's just use the FTS table to store content+metadata.
            # And use the Vec table to store embedding + chunk_id (as auxiliary int or handle mapping).
            
            # For this MVP, let's assume we clean tables on full reload or handle updates carefully.
            pass
        except Exception as e:
            logger.warning(f"Vector extension load failed (expected during build without deps): {e}")

        conn.commit()
        conn.close()

    def load_urls(self, urls: List[str]):
        """Process a list of URLs in parallel"""
        with ThreadPoolExecutor(max_workers=5) as executor:
            executor.map(self._process_single_url, urls)

    def _process_single_url(self, url: str):
        try:
            logger.info(f"Processing: {url}")
            # 1. Fetch
            resp = requests.get(url, timeout=10, headers={"User-Agent": "IlliniGuideBot/1.0"})
            if resp.status_code != 200:
                logger.warning(f"Failed to fetch {url}: {resp.status_code}")
                return

            html_content = resp.text
            current_md5 = self.processor.compute_md5(html_content)

            # 2. Check MD5 (Incremental Update)
            if not self._should_update(url, current_md5):
                logger.info(f"Skipping {url} (Unchanged)")
                return

            # 3. Process (Clean -> Chunk -> Inject)
            chunks = self.processor.process_url(url, html_content)
            
            if not chunks:
                logger.warning(f"No chunks extracted from {url}")
                return

            # 4. Load into DB
            self._save_chunks(url, current_md5, chunks)
            logger.info(f"Successfully loaded {len(chunks)} chunks for {url}")

        except Exception as e:
            logger.error(f"Error processing {url}: {e}")

    def _should_update(self, url: str, new_md5: str) -> bool:
        """Check against SQLite if URL needs update"""
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        cur.execute("SELECT md5 FROM documents WHERE url = ?", (url,))
        row = cur.fetchone()
        conn.close()
        
        if row and row[0] == new_md5:
            return False
        return True

    def _save_chunks(self, url: str, new_md5: str, chunks: List['Chunk']):
        """Transactionally updated chunks for a URL"""
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        try:
            # 1. Update Document Registry
            cur.execute("""
                INSERT OR REPLACE INTO documents (url, md5, last_updated)
                VALUES (?, ?, CURRENT_TIMESTAMP)
            """, (url, new_md5))

            # 2. Clear old chunks for this URL (Naive approach: we need a way to identify old chunks)
            # Since FTS/Vector don't easily support "DELETE WHERE metadata->>url = ?", 
            # we might need a mapping table or just accept some bloat for this MVP/One-off loader.
            # 2. Clear old chunks for this URL
            # We first find the rowids in FTS that belong to this URL
            try:
                # Note: 'metadata' column is a standard text column in FTS containing JSON
                # We can't always do optimized JSON queries on FTS columns depending on setup,
                # but we can scan or assume we have an external index.
                # For this MVP, we will do a targeted delete if possible.
                
                # Better approach: Select rowids where body matches? No.
                # Standard approach: We need to store chunk_ids linked to Document URL.
                # Since we didn't create a separate 'chunks' table, we rely on metadata scan.
                # This is slow for massive DBs but fine for <100MB.
                
                cur.execute("SELECT rowid FROM documents_fts WHERE metadata LIKE ?", (f'%"{url}"%',))
                old_row_ids = [row[0] for row in cur.fetchall()]
                
                if old_row_ids:
                    # Delete from Vector Table
                    # sqlite-vec usually manages rowids synced if we inserted with explicit rowid
                    # DELETE FROM documents_vec WHERE rowid IN (...)
                    id_list = ",".join(map(str, old_row_ids))
                    cur.execute(f"DELETE FROM documents_vec WHERE rowid IN ({id_list})")
                    cur.execute(f"DELETE FROM documents_fts WHERE rowid IN ({id_list})")
                    logger.info(f"Deleted {len(old_row_ids)} stale chunks for {url}")
            except Exception as delete_err:
                logger.warning(f"Failed to clear old chunks (might be first run): {delete_err}")

            # 3. Insert new chunks
            for chunk in chunks:
                # Insert into FTS
                metadata_json = json.dumps(chunk.metadata)
                cur.execute("INSERT INTO documents_fts (content, metadata) VALUES (?, ?)", 
                           (chunk.content, metadata_json))
                row_id = cur.lastrowid
                
                # Insert into Vector
                embedding = self.embedding_model.encode(chunk.content)
                if isinstance(embedding[0], list): # Handle batch 
                    embedding = embedding[0] 
                
                # Try inserting into vector table if exists
                try:
                    # Assuming vec0 table with 'embedding' column
                    # Explicit rowid mapping is better
                    cur.execute("INSERT INTO documents_vec(rowid, embedding) VALUES (?, ?)", 
                               (row_id, json.dumps(embedding)))
                except:
                    pass

            conn.commit()
        except Exception as e:
            logger.error(f"DB Write failed: {e}")
            conn.rollback()
        finally:
            conn.close()

if __name__ == "__main__":
    loader = ETLLoader()
    # Test with a single URL
    loader.load_urls(["https://cs.illinois.edu/academics/courses/cs440"])
