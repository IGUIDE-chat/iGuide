"""
Unit tests for query optimizer
Tests normalization, entity extraction, query expansion, and signal logic
"""

import pytest
from backend.core.query_optimizer import QueryOptimizer, QuerySignals, get_query_optimizer


class TestQueryNormalization:
    def test_course_code_standardization(self):
        optimizer = QueryOptimizer()
        
        # Test various course code formats
        assert optimizer.normalize_query("CS440") == "CS 440"
        assert optimizer.normalize_query("CS-225") == "CS 225"
        assert optimizer.normalize_query("cs 391") == "CS 391"
        assert optimizer.normalize_query("ECE391") == "ECE 391"
        assert optimizer.normalize_query("MATH-241") == "MATH 241"
    
    def test_whitespace_cleanup(self):
        optimizer = QueryOptimizer()
        
        assert optimizer.normalize_query("  CS  225  ") == "CS 225"
        assert optimizer.normalize_query("CS   225   prerequisites") == "CS 225 prerequisites"
    
    def test_mixed_normalization(self):
        optimizer = QueryOptimizer()
        
        # Multiple course codes
        query = "CS440 and ECE391 prerequisites"
        normalized = optimizer.normalize_query(query)
        assert "CS 440" in normalized
        assert "ECE 391" in normalized


class TestEntityExtraction:
    def test_extract_course_codes(self):
        optimizer = QueryOptimizer()
        
        entities = optimizer.extract_entities("CS 225 prerequisites")
        assert "CS 225" in entities["course_codes"]
        
        entities = optimizer.extract_entities("ECE391 and MATH241")
        assert "ECE 391" in entities["course_codes"]
        assert "MATH 241" in entities["course_codes"]
    
    def test_extract_buildings(self):
        optimizer = QueryOptimizer()
        
        entities = optimizer.extract_entities("Siebel Center hours")
        assert "Siebel" in entities["buildings"]
        
        entities = optimizer.extract_entities("Where is Grainger Library?")
        assert "Grainger" in entities["buildings"]
    
    def test_extract_departments(self):
        optimizer = QueryOptimizer()
        
        entities = optimizer.extract_entities("CS department")
        assert "CS" in entities["departments"]
        
        entities = optimizer.extract_entities("Computer Science major requirements")
        assert "Computer Science" in entities["departments"]
    
    def test_no_entities(self):
        optimizer = QueryOptimizer()
        
        entities = optimizer.extract_entities("How to waive insurance?")
        assert not entities["course_codes"]
        assert not entities["buildings"]


class TestQueryExpansion:
    def test_domain_expansion_insurance(self):
        optimizer = QueryOptimizer()
        
        queries = optimizer.expand_queries("保险", "保险", {})
        # Should include insurance-related keywords
        assert any("insurance" in q.lower() or "waiver" in q.lower() or "McKinley" in q.lower() 
                   for q in queries)
    
    def test_domain_expansion_transfer(self):
        optimizer = QueryOptimizer()
        
        queries = optimizer.expand_queries("transfer", "transfer", {})
        # Should include transfer-related keywords
        assert any("major" in q.lower() or "requirements" in q.lower() 
                   for q in queries)
    
    def test_entity_boosting_course_code(self):
        optimizer = QueryOptimizer()
        
        entities = {"course_codes": ["CS 225"], "buildings": [], "departments": []}
        queries = optimizer.expand_queries("CS 225", "CS 225", entities)
        
        # Should include syllabus/grading boosting
        assert any("syllabus" in q.lower() or "grading" in q.lower() 
                   for q in queries)
    
    def test_entity_boosting_building(self):
        optimizer = QueryOptimizer()
        
        entities = {"course_codes": [], "buildings": ["Siebel"], "departments": []}
        queries = optimizer.expand_queries("Siebel", "Siebel", entities)
        
        # Should include hours/location boosting
        assert any("hours" in q.lower() or "location" in q.lower() 
                   for q in queries)
    
    def test_expansion_limit(self):
        optimizer = QueryOptimizer()
        
        queries = optimizer.expand_queries("test", "test", {})
        # Should not exceed 6 queries
        assert len(queries) <= 6


class TestSignalLogic:
    def test_should_expand_short_query(self):
        optimizer = QueryOptimizer()
        
        # Short query with no entity
        signals = QuerySignals(
            fts_hits=10,
            vec_top1=0.5,
            rerank_top1=0.6,
            has_entity=False,
            q_len=2  # Short
        )
        # Should trigger (2 conditions: short + no entity)
        assert optimizer.should_expand(signals)
    
    def test_should_expand_low_scores(self):
        optimizer = QueryOptimizer()
        
        # Low scores
        signals = QuerySignals(
            fts_hits=2,  # Low
            vec_top1=0.2,  # Low
            rerank_top1=0.3,  # Low
            has_entity=True,
            q_len=5
        )
        # Should trigger (3 conditions: low fts, low vec, low rerank)
        assert optimizer.should_expand(signals)
    
    def test_should_not_expand_clear_query(self):
        optimizer = QueryOptimizer()
        
        # Clear query with good scores
        signals = QuerySignals(
            fts_hits=20,
            vec_top1=0.8,
            rerank_top1=0.9,
            has_entity=True,
            q_len=8
        )
        # Should NOT trigger (only 0-1 conditions met)
        assert not optimizer.should_expand(signals)
    
    def test_should_web_fallback_realtime(self):
        optimizer = QueryOptimizer()
        
        signals = QuerySignals(
            fts_hits=5,
            vec_top1=0.3,
            rerank_top1=0.2,  # Low
            has_entity=False,
            q_len=5
        )
        # Should trigger for real-time query
        assert optimizer.should_web_fallback(signals, "basketball game score today")
    
    def test_should_not_web_fallback_good_score(self):
        optimizer = QueryOptimizer()
        
        signals = QuerySignals(
            fts_hits=10,
            vec_top1=0.7,
            rerank_top1=0.8,  # Good
            has_entity=True,
            q_len=5
        )
        # Should NOT trigger
        assert not optimizer.should_web_fallback(signals, "CS 225 prerequisites")


class TestSingleton:
    def test_get_optimizer_singleton(self):
        optimizer1 = get_query_optimizer()
        optimizer2 = get_query_optimizer()
        
        # Should return same instance
        assert optimizer1 is optimizer2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
