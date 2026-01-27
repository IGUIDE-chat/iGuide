"""
Unit tests for bilingual translator module
"""

import pytest
from backend.core.translator import BilingualTranslator, get_translator


class TestLanguageDetection:
    def test_detect_english(self):
        translator = BilingualTranslator()
        assert translator.detect_language("What is CS 225?") == "en"
        assert translator.detect_language("UIUC GPA requirement") == "en"
    
    def test_detect_chinese(self):
        translator = BilingualTranslator()
        assert translator.detect_language("CS 225是什么课程？") == "zh"
        assert translator.detect_language("UIUC的GPA要求") == "zh"
        assert translator.detect_language("计算机科学") == "zh"
    
    def test_detect_mixed(self):
        translator = BilingualTranslator()
        # Mixed content should be detected as Chinese if it contains Chinese chars
        assert translator.detect_language("CS 225课程") == "zh"


class TestTerminologyPreservation:
    def test_preserve_university_terms(self):
        translator = BilingualTranslator()
        text = "UIUC的计算机专业很好"
        modified, placeholder_map = translator.preserve_special_terms(text)
        
        # Should have replaced UIUC alias
        assert "__TERM_" in modified
        assert "UIUC" in placeholder_map.values()
    
    def test_preserve_department_codes(self):
        translator = BilingualTranslator()
        text = "计算机科学很难"
        modified, placeholder_map = translator.preserve_special_terms(text)
        
        # Should preserve CS
        assert "__TERM_" in modified
        assert "CS" in placeholder_map.values()
    
    def test_preserve_immigration_terms(self):
        translator = BilingualTranslator()
        text = "国际学生办公室在哪里？"
        modified, placeholder_map = translator.preserve_special_terms(text)
        
        # Should preserve ISSS
        assert "__TERM_" in modified
        assert "ISSS" in placeholder_map.values()
    
    def test_restore_terms(self):
        translator = BilingualTranslator()
        text = "UIUC的CS专业"
        modified, placeholder_map = translator.preserve_special_terms(text)
        restored = translator.restore_special_terms(modified, placeholder_map)
        
        # Should contain preserved terms
        assert "UIUC" in restored
        assert "CS" in restored


class TestTranslation:
    def test_english_passthrough(self):
        translator = BilingualTranslator()
        query = "What is the GPA requirement for CS 225?"
        result = translator.translate_to_english(query)
        
        # English should pass through unchanged
        assert result == query
    
    def test_chinese_translation_preserves_terms(self):
        translator = BilingualTranslator()
        query = "CS 225的GPA要求是多少？"
        result = translator.translate_to_english(query)
        
        # Should preserve CS 225 and GPA
        assert "CS 225" in result or "CS225" in result
        assert "GPA" in result
        # Should be translated to English
        assert any(word in result.lower() for word in ["requirement", "what", "is"])
    
    def test_caching(self):
        translator = BilingualTranslator()
        query = "UIUC在哪里？"
        
        # First call
        result1 = translator.translate_to_english(query)
        
        # Second call should use cache
        result2 = translator.translate_to_english(query)
        
        assert result1 == result2


class TestSingleton:
    def test_get_translator_singleton(self):
        translator1 = get_translator()
        translator2 = get_translator()
        
        # Should return same instance
        assert translator1 is translator2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
