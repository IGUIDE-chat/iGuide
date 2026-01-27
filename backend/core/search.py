import sqlite3
import time
import json
import logging
from typing import List, Tuple
import numpy as np
from tavily import TavilyClient

from backend.core.config import get_settings
from backend.schemas import Chunk, Source

from backend.core.models import EmbeddingModel, RerankerModel 

settings = get_settings()
logger = logging.getLogger(__name__)

class LocalSearchEngine:
    def __init__(self):
        self.db_path = settings.KNOWLEDGE_DB_PATH
        self.conn = None
        self.embedding_model = EmbeddingModel(settings.MODEL_PATH)
        self.reranker_model = RerankerModel(settings.MODEL_PATH)
        if settings.TAVILY_API_KEY:
            self.tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
        else:
            self.tavily = None

    def get_conn(self):
        if not self.conn:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.execute("PRAGMA journal_mode=WAL;")  # Enable Write-Ahead Logging for concurrency
            self.conn.enable_load_extension(True)
            try:
                import sqlite_vec
                self.conn.load_extension(sqlite_vec.loadable_path())
            except ImportError:
                logger.warning("sqlite-vec not installed, vector search will fail")
            except Exception as e:
                logger.warning(f"Failed to load sqlite-vec extension: {e}")
        return self.conn

    def search(self, query: str) -> Tuple[List[Source], float]:
        start_time = time.time()
        
        # 4.0 Translate query to English (preserving special terms)
        from backend.core.translator import get_translator
        translator = get_translator()
        original_query = query
        query_en = translator.translate_to_english(query)
        logger.info(f"Query translation: '{original_query}' -> '{query_en}'")
        
        # 4.1 Normalize and extract entities
        from backend.core.query_optimizer import get_query_optimizer
        optimizer = get_query_optimizer()
        q_norm = optimizer.normalize_query(query_en)
        entities = optimizer.extract_entities(q_norm)
        logger.info(f"Entities extracted: {entities}")
        
        # 4.2 Baseline retrieval
        fts_candidates = self._search_fts(q_norm)
        vec_candidates = self._search_vector(q_norm)
        
        # Merge candidates (deduplicate by ID)
        all_candidates = {c.id: c for c in fts_candidates + vec_candidates}.values()
        candidates_list = list(all_candidates)
        
        if not candidates_list:
            logger.info("No local results found, triggering fallback directly.")
            return self._web_fallback(query_en), time.time() - start_time

        # 4.3 Rerank baseline
        best_chunks = self._rerank(q_norm, candidates_list)
        
        # 4.4 Score signals
        signals = self._score_signals(
            fts_hits=len(fts_candidates),
            vec_candidates=vec_candidates,
            ranked_chunks=best_chunks,
            entities=entities,
            query=q_norm
        )
        logger.info(f"Baseline signals: {signals}")
        
        # 4.5 Decide optimization
        if optimizer.should_expand(signals):
            logger.info("Triggering multi-query expansion...")
            q_list = optimizer.expand_queries(query_en, q_norm, entities)
            
            # Multi-query retrieval
            cands2 = self._retrieve_multiquery(q_list)
            ranked2 = self._rerank(q_norm, cands2)
            
            # Score expanded signals
            signals2 = self._score_signals(
                fts_hits=len(cands2),
                vec_candidates=[],  # Not tracked for multi-query
                ranked_chunks=ranked2,
                entities=entities,
                query=q_norm
            )
            signals2.expanded_used = True
            signals2.queries_count = len(q_list)
            logger.info(f"Expanded signals: {signals2}")
            
            # Use expanded results if better
            if signals2.rerank_top1 >= signals.rerank_top1:
                best_chunks = ranked2
                signals = signals2
                logger.info("Using expanded results (better scores)")
            else:
                logger.info("Keeping baseline results (expansion didn't improve)")
        
        # Check Confidence
        top_score = best_chunks[0].score if best_chunks else 0.0
        
        # 4.6 Web Fallback
        if optimizer.should_web_fallback(signals, query_en):
            logger.info(f"Low confidence ({top_score:.2f}), triggering web fallback.")
            web_results = self._web_fallback(query_en)
            return self._format_results(best_chunks) + web_results, time.time() - start_time
            
        return self._format_results(best_chunks), time.time() - start_time
            # Combine or just return web results? 
            # Strategy: If local is bad, maybe web is better. 
            # We can append web results to local results.
            return self._format_results(best_chunks) + web_results, time.time() - start_time
            
        return self._format_results(best_chunks), time.time() - start_time

    def _search_fts(self, query: str) -> List[Chunk]:
        """Full Text Search using SQLite FTS5"""
        conn = self.get_conn()
        cursor = conn.cursor()
        
        # Simpler query, in production use proper tokenization/sanitization
        sql = """
            SELECT rowid, content, metadata 
            FROM documents_fts 
            WHERE documents_fts MATCH ? 
            ORDER BY rank 
            LIMIT ?
        """
        try:
            cursor.execute(sql, (query, settings.TOP_K_RETRIEVAL // 2))
            rows = cursor.fetchall()
            return [
                Chunk(
                    id=f"fts_{r[0]}", 
                    content=r[1], 
                    metadata=json.loads(r[2]) if r[2] else {},
                    score=0.0 # Bm25 score isn't normalized like cosine, handle carefully
                ) for r in rows
            ]
        except Exception as e:
            logger.error(f"FTS search failed: {e}")
            return []

    def _search_vector(self, query: str) -> List[Chunk]:
        """Vector Search using sqlite-vec"""
        embedding = self.embedding_model.encode(query)
        if isinstance(embedding[0], list): # Handle batch return if happened
            embedding = embedding[0]
            
        conn = self.get_conn()
        cursor = conn.cursor()
        
        # Note: sqlite-vec v0.1.x uses MATCH syntax
        sql = """
            SELECT vec.rowid, fts.content, fts.metadata, vec.distance
            FROM documents_vec vec
            JOIN documents_fts fts ON vec.rowid = fts.rowid
            WHERE vec.embedding MATCH ? AND k = ?
            ORDER BY vec.distance
        """
        try:
            cursor.execute(sql, (json.dumps(embedding), settings.TOP_K_RETRIEVAL // 2))
            rows = cursor.fetchall()
            return [
                Chunk(
                    id=f"vec_{r[0]}",
                    content=r[1],
                    metadata=json.loads(r[2]) if r[2] else {},
                    score=1.0 - r[3] # Convert distance to similarity
                ) for r in rows
            ]
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []

    def _rerank(self, query: str, candidates: List[Chunk]) -> List[Chunk]:
        """Rerank candidates using Cross-Encoder"""
        if not candidates:
            return []
            
        pairs = [[query, c.content] for c in candidates]
        scores = self.reranker_model.predict(pairs)
        
        for i, c in enumerate(candidates): 
            c.score = float(scores[i]) # Ensure float for pydantic
        
        # Sort by score
        candidates.sort(key=lambda x: x.score, reverse=True)
        return candidates[:settings.TOP_K_RERANK]

    def _web_fallback(self, query: str) -> List[Source]:
        """Use Tavily API to search the web"""
        if not self.tavily:
            logger.warning("Tavily API key not set")
            return []
            
        try:
            response = self.tavily.search(query=query, search_depth="advanced", max_results=3)
            # Clean and format
            results = []
            for res in response.get("results", []):
                results.append(Source(
                    title=res.get("title", "Web Result"),
                    url=res.get("url", ""),
                    content=res.get("content", ""),
                    score=0.8, # Artificial score for web results
                    source_type="web"
                ))
            return results
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            return []

    def _retrieve_multiquery(self, queries: List[str]) -> List[Chunk]:
        """
        Retrieve candidates for multiple queries in parallel
        Merge and deduplicate results
        """
        all_candidates = {}
        
        for q in queries:
            # FTS search
            fts_results = self._search_fts(q)
            for chunk in fts_results:
                all_candidates[chunk.id] = chunk
            
            # Vector search
            vec_results = self._search_vector(q)
            for chunk in vec_results:
                all_candidates[chunk.id] = chunk
        
        # Cap at 200 candidates
        candidates_list = list(all_candidates.values())[:200]
        logger.info(f"Multi-query retrieved {len(candidates_list)} unique candidates from {len(queries)} queries")
        
        return candidates_list
    
    def _score_signals(self, fts_hits: int, vec_candidates: List[Chunk], 
                       ranked_chunks: List[Chunk], entities: Dict, query: str) -> 'QuerySignals':
        """
        Calculate retrieval signals for optimization decisions
        """
        from backend.core.query_optimizer import QuerySignals, get_query_optimizer
        
        optimizer = get_query_optimizer()
        
        # Calculate metrics
        vec_top1 = vec_candidates[0].score if vec_candidates else 0.0
        rerank_top1 = ranked_chunks[0].score if ranked_chunks else 0.0
        has_entity = bool(entities.get("course_codes") or entities.get("buildings") or entities.get("departments"))
        q_len = optimizer.count_query_length(query)
        
        return QuerySignals(
            fts_hits=fts_hits,
            vec_top1=vec_top1,
            rerank_top1=rerank_top1,
            has_entity=has_entity,
            q_len=q_len
        )
    
    def _format_results(self, chunks: List[Chunk]) -> List[Source]:
        return [
            Source(
                title=c.metadata.get("title", "Local Knowledge"),
                url=c.metadata.get("url", ""),
                content=c.content,
                score=c.score,
                source_type="local"
            ) for c in chunks
        ]

