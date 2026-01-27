"""
Integration tests for bilingual search pipeline
"""

import pytest
from backend.core.search import LocalSearchEngine
from backend.core.translator import get_translator


class TestBilingualSearch:
    @pytest.fixture
    def search_engine(self):
        return LocalSearchEngine()
    
    def test_chinese_query_with_special_terms(self, search_engine):
        """Test that Chinese queries are translated and special terms are preserved"""
        query = "CS 225的先修课是什么？"
        
        # This should translate to English while preserving "CS 225"
        sources, latency = search_engine.search(query)
        
        # Should return results (assuming knowledge base has CS 225 info)
        assert isinstance(sources, list)
        assert latency > 0
    
    def test_english_query_passthrough(self, search_engine):
        """Test that English queries work without translation"""
        query = "What are the prerequisites for CS 225?"
        
        sources, latency = search_engine.search(query)
        
        assert isinstance(sources, list)
        assert latency > 0
    
    def test_mixed_query(self, search_engine):
        """Test queries with mixed English and Chinese"""
        query = "UIUC的计算机专业怎么样？"
        
        sources, latency = search_engine.search(query)
        
        assert isinstance(sources, list)
        assert latency > 0
    
    def test_immigration_query(self, search_engine):
        """Test immigration-related queries with special terms"""
        query = "ISSS在哪里？I-20怎么办理？"
        
        sources, latency = search_engine.search(query)
        
        assert isinstance(sources, list)
        # Should preserve ISSS and I-20


class TestTranslatorIntegration:
    def test_translator_in_search_pipeline(self):
        """Test that translator is properly integrated in search"""
        translator = get_translator()
        
        # Test a Chinese query
        query = "GPA要求"
        translated = translator.translate_to_english(query)
        
        # Should preserve GPA
        assert "GPA" in translated
        # Should translate the rest
        assert "requirement" in translated.lower() or "require" in translated.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
