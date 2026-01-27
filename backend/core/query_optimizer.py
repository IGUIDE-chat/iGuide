"""
Query Optimizer for IlliniGuide
Implements signal-driven query optimization with multi-query expansion
"""

import re
import json
import logging
from pathlib import Path
from typing import List, Dict, Tuple, Any
from dataclasses import dataclass, asdict
from functools import lru_cache

logger = logging.getLogger(__name__)


@dataclass
class QuerySignals:
    """Retrieval signals used for optimization decisions"""
    fts_hits: int
    vec_top1: float
    rerank_top1: float
    has_entity: bool
    q_len: int
    expanded_used: bool = False
    queries_count: int = 1
    
    def __str__(self):
        return (f"fts_hits={self.fts_hits}, vec_top1={self.vec_top1:.3f}, "
                f"rerank_top1={self.rerank_top1:.3f}, has_entity={self.has_entity}, "
                f"q_len={self.q_len}, expanded={self.expanded_used}, "
                f"queries_count={self.queries_count}")


class QueryOptimizer:
    def __init__(self, domain_dict_path: str = None):
        """Initialize optimizer with domain dictionary"""
        if domain_dict_path is None:
            domain_dict_path = Path(__file__).parent / "domain_dict.json"
        
        self.domain_dict = self._load_domain_dict(domain_dict_path)
        self.intent_expansions = self.domain_dict.get("intent_expansions", {})
        self.entity_patterns = self.domain_dict.get("entity_patterns", {})
        self.realtime_keywords = self.domain_dict.get("realtime_keywords", {})
        self.vague_intents = set(self.domain_dict.get("vague_intents", []))
        
        # Compile regex patterns
        self.course_code_pattern = re.compile(
            self.entity_patterns.get("course_code", r'\b([A-Z]{2,4})\s*[-]?\s*(\d{3})\b'),
            re.IGNORECASE
        )
        
    def _load_domain_dict(self, path: Path) -> Dict[str, Any]:
        """Load domain dictionary from JSON file"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load domain dictionary: {e}")
            return {}
    
    def normalize_query(self, query: str) -> str:
        """
        Normalize query with lightweight rule-based processing
        
        - Course code standardization: CS440 → CS 440
        - Whitespace cleanup
        - Case normalization (preserve course codes)
        """
        # Step 1: Standardize course codes
        def standardize_course_code(match):
            dept = match.group(1).upper()
            num = match.group(2)
            return f"{dept} {num}"
        
        normalized = self.course_code_pattern.sub(standardize_course_code, query)
        
        # Step 2: Whitespace cleanup
        normalized = ' '.join(normalized.split())
        
        # Step 3: Trim
        normalized = normalized.strip()
        
        return normalized
    
    def extract_entities(self, query: str) -> Dict[str, List[str]]:
        """
        Extract entities from query using regex patterns
        
        Returns:
            {
                "course_codes": ["CS 225", "ECE 391"],
                "buildings": ["Siebel"],
                "departments": ["CS"]
            }
        """
        entities = {
            "course_codes": [],
            "buildings": [],
            "departments": []
        }
        
        # Extract course codes
        matches = self.course_code_pattern.findall(query)
        for dept, num in matches:
            entities["course_codes"].append(f"{dept.upper()} {num}")
        
        # Extract buildings
        buildings = self.entity_patterns.get("buildings", [])
        for building in buildings:
            if building.lower() in query.lower():
                entities["buildings"].append(building)
        
        # Extract departments
        departments = self.entity_patterns.get("departments", [])
        for dept in departments:
            # Match whole word only
            if re.search(r'\b' + re.escape(dept) + r'\b', query, re.IGNORECASE):
                entities["departments"].append(dept)
        
        return entities
    
    def expand_queries(self, original: str, normalized: str, entities: Dict[str, List[str]]) -> List[str]:
        """
        Generate 3-6 expanded queries for parallel retrieval
        
        Strategies:
        1. Domain dictionary expansion
        2. Entity boosting
        3. Bilingual keyword expansion (via intent dict)
        """
        queries = set()
        
        # Always include original and normalized
        queries.add(original)
        queries.add(normalized)
        
        # Strategy 1: Domain dictionary expansion
        query_lower = normalized.lower()
        for intent_key, expansion in self.intent_expansions.items():
            if intent_key.lower() in query_lower:
                # Add expansion keywords
                expanded = f"{normalized} {expansion}"
                queries.add(expanded)
                
                # Also add just the expansion keywords
                queries.add(expansion)
                break  # Only use first match to avoid over-expansion
        
        # Strategy 2: Entity boosting
        if entities.get("course_codes"):
            for course_code in entities["course_codes"]:
                # Add course-specific boosting
                boosted = f"{course_code} syllabus grading prerequisites requirements"
                queries.add(boosted)
        
        if entities.get("buildings"):
            for building in entities["buildings"]:
                boosted = f"{building} hours location address"
                queries.add(boosted)
        
        # Limit to 6 queries max
        queries_list = list(queries)[:6]
        
        logger.info(f"Expanded '{original}' to {len(queries_list)} queries")
        return queries_list
    
    def should_expand(self, signals: QuerySignals) -> bool:
        """
        Decide whether to trigger multi-query expansion
        
        Trigger if ANY 2 of the following are true:
        1. Query is short (≤3 words EN or ≤6 chars ZH)
        2. No entities detected
        3. FTS hits < 5
        4. Vector top1 < 0.35
        5. Rerank top1 < 0.55
        """
        conditions = [
            signals.q_len <= 3,  # Short query (simplified, assumes English)
            not signals.has_entity,
            signals.fts_hits < 5,
            signals.vec_top1 < 0.35,
            signals.rerank_top1 < 0.55
        ]
        
        trigger_count = sum(conditions)
        should_trigger = trigger_count >= 2
        
        if should_trigger:
            logger.info(f"Triggering expansion: {trigger_count}/5 conditions met")
        
        return should_trigger
    
    def should_web_fallback(self, signals: QuerySignals, query: str) -> bool:
        """
        Decide whether to trigger web fallback
        
        Trigger if:
        - Rerank top1 < 0.35 AND query has real-time keywords
        - OR rerank top1 < 0.35 with very few candidates
        """
        if signals.rerank_top1 >= 0.35:
            return False
        
        # Check for real-time keywords
        query_lower = query.lower()
        en_keywords = self.realtime_keywords.get("en", [])
        zh_keywords = self.realtime_keywords.get("zh", [])
        
        has_realtime = any(kw in query_lower for kw in en_keywords + zh_keywords)
        
        if has_realtime:
            logger.info(f"Triggering web fallback: real-time query detected")
            return True
        
        # Check if very few candidates
        if signals.fts_hits < 3:
            logger.info(f"Triggering web fallback: insufficient local results")
            return True
        
        return False
    
    def should_ask_clarify(self, signals: QuerySignals, query: str) -> bool:
        """
        Decide whether to ask clarifying question (optional)
        
        Trigger if:
        - Query is vague intent AND rerank top1 < 0.5
        """
        if signals.rerank_top1 >= 0.5:
            return False
        
        query_lower = query.lower()
        is_vague = any(intent in query_lower for intent in self.vague_intents)
        
        if is_vague:
            logger.info(f"Suggesting clarification: vague intent detected")
            return True
        
        return False
    
    def count_query_length(self, query: str) -> int:
        """
        Count query length (words for English, characters for Chinese)
        Simplified: just count words
        """
        return len(query.split())


# Singleton instance
_optimizer_instance = None

def get_query_optimizer() -> QueryOptimizer:
    """Get or create optimizer singleton"""
    global _optimizer_instance
    if _optimizer_instance is None:
        _optimizer_instance = QueryOptimizer()
    return _optimizer_instance
