"""
Quick script to inspect knowledge.db database
"""
import sqlite3
import json

db_path = "knowledge.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("=" * 60)
print("KNOWLEDGE DATABASE INSPECTION")
print("=" * 60)

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
print(f"\nTables in database: {len(tables)}")
for table in tables:
    print(f"  - {table[0]}")

# Check documents_fts table
print("\n" + "=" * 60)
print("DOCUMENTS_FTS TABLE")
print("=" * 60)

cursor.execute("SELECT COUNT(*) FROM documents_fts")
total_chunks = cursor.fetchone()[0]
print(f"\nTotal document chunks: {total_chunks}")

# Get sample content
print("\nSample content (first 3 chunks):\n")
cursor.execute("SELECT rowid, content, metadata FROM documents_fts LIMIT 3")
for i, (rowid, content, metadata) in enumerate(cursor.fetchall(), 1):
    print(f"Chunk {i} (ID: {rowid}):")
    print(f"  Content: {content[:150]}...")
    if metadata:
        try:
            meta = json.loads(metadata)
            print(f"  Metadata: {meta}")
        except:
            print(f"  Metadata: {metadata[:100]}")
    print()

# Check documents_vec table if exists
try:
    cursor.execute("SELECT COUNT(*) FROM documents_vec")
    vec_count = cursor.fetchone()[0]
    print(f"\nVector embeddings: {vec_count}")
except:
    print("\nNo documents_vec table found")

conn.close()
print("=" * 60)
