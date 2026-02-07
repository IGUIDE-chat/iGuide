import sqlite3
import logging
from datetime import datetime

class DBManager:
    def __init__(self, db_path="crawler_state.db"):
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        self._init_table()

    def _init_table(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS pages (
                url TEXT PRIMARY KEY,
                content_hash TEXT,
                category TEXT,
                title TEXT,
                last_crawled TIMESTAMP
            )
        ''')
        self.conn.commit()

    def should_process(self, url, current_hash):
        self.cursor.execute('SELECT content_hash FROM pages WHERE url = ?', (url,))
        row = self.cursor.fetchone()
        if row is None: return True, "NEW"
        if row[0] != current_hash: return True, "UPDATED"
        return False, "UNCHANGED"

    def upsert_page(self, url, content_hash, category, title):
        now = datetime.now().isoformat()
        self.cursor.execute('''
            INSERT INTO pages (url, content_hash, category, title, last_crawled)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(url) DO UPDATE SET
                content_hash=excluded.content_hash,
                category=excluded.category,
                title=excluded.title,
                last_crawled=excluded.last_crawled
        ''', (url, content_hash, category, title, now))
        self.conn.commit()

    def get_all_urls(self):
        """Return all URLs, categories, and titles stored in the database."""
        self.cursor.execute('SELECT url, category, title FROM pages')
        return self.cursor.fetchall()

    def delete_page(self, url):
        """Physically delete a record for the given URL."""
        self.cursor.execute('DELETE FROM pages WHERE url = ?', (url,))
        self.conn.commit()
        
    def close(self):
        self.conn.close()