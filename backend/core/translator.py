"""
Bilingual Query Translator for IlliniGuide
Translates Chinese queries to English while preserving special terminology
"""

import re
import json
import logging
from pathlib import Path
from typing import Tuple, Dict, Any
from functools import lru_cache

logger = logging.getLogger(__name__)


class BilingualTranslator:
    def __init__(self, terminology_path: str = None):
        """Initialize translator with terminology glossary"""
        if terminology_path is None:
            terminology_path = Path(__file__).parent / "terminology.json"
        
        self.terminology = self._load_terminology(terminology_path)
        self.preserve_terms = self._build_preserve_map()
        
    def _load_terminology(self, path: Path) -> Dict[str, Any]:
        """Load terminology from JSON file"""
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load terminology: {e}")
            return {"preserve_terms": {}, "common_translations": {}}
    
    def _build_preserve_map(self) -> Dict[str, str]:
        """Build a mapping of Chinese terms to their preserved English equivalents"""
        preserve_map = {}
        
        for category, terms in self.terminology.get("preserve_terms", {}).items():
            for term_key, term_data in terms.items():
                # Map Chinese term to preserved English
                preserve_map[term_data["zh"]] = term_data["preserve"]
                
                # Map aliases to preserved English
                for alias in term_data.get("aliases", []):
                    preserve_map[alias] = term_data["preserve"]
        
        return preserve_map
    
    def detect_language(self, text: str) -> str:
        """Detect if text contains Chinese characters"""
        # Check for Chinese characters (Unicode range)
        chinese_pattern = re.compile(r'[\u4e00-\u9fff]+')
        if chinese_pattern.search(text):
            return "zh"
        return "en"
    
    def preserve_special_terms(self, text: str) -> Tuple[str, Dict[int, str]]:
        """
        Replace special terms with placeholders before translation
        Returns: (modified_text, placeholder_map)
        """
        placeholder_map = {}
        modified_text = text
        placeholder_idx = 0
        
        # Sort by length (longest first) to avoid partial matches
        sorted_terms = sorted(self.preserve_terms.items(), key=lambda x: len(x[0]), reverse=True)
        
        for chinese_term, english_term in sorted_terms:
            if chinese_term in modified_text:
                placeholder = f"__TERM_{placeholder_idx}__"
                placeholder_map[placeholder_idx] = english_term
                modified_text = modified_text.replace(chinese_term, placeholder)
                placeholder_idx += 1
        
        return modified_text, placeholder_map
    
    def restore_special_terms(self, text: str, placeholder_map: Dict[int, str]) -> str:
        """Restore special terms from placeholders"""
        restored_text = text
        for idx, term in placeholder_map.items():
            placeholder = f"__TERM_{idx}__"
            restored_text = restored_text.replace(placeholder, term)
        return restored_text
    
    @lru_cache(maxsize=1000)
    def translate_to_english(self, query: str) -> str:
        """
        Translate query to English, preserving special terminology
        
        Args:
            query: User query in Chinese or English
            
        Returns:
            English query with preserved terminology
        """
        # Detect language
        lang = self.detect_language(query)
        
        # If already English, return as-is
        if lang == "en":
            return query
        
        # Preserve special terms
        modified_query, placeholder_map = self.preserve_special_terms(query)
        
        # Translate the modified query
        # For now, we'll use a simple approach - in production, integrate with
        # a translation API (Google Translate, DeepL, etc.)
        translated_query = self._translate_with_api(modified_query)
        
        # Restore special terms
        final_query = self.restore_special_terms(translated_query, placeholder_map)
        
        logger.info(f"Translated query: '{query}' -> '{final_query}'")
        return final_query
    
    def _translate_with_api(self, text: str) -> str:
        """
        Translate text using external API
        
        TODO: Integrate with translation service (Google Translate, DeepL, etc.)
        For now, returns a placeholder implementation
        """
        try:
            # Option 1: Use Google Translate (requires googletrans library)
            # from googletrans import Translator
            # translator = Translator()
            # result = translator.translate(text, src='zh-CN', dest='en')
            # return result.text
            
            # Option 2: Use DeepL (requires deepl library and API key)
            # import deepl
            # translator = deepl.Translator(auth_key="YOUR_API_KEY")
            # result = translator.translate_text(text, target_lang="EN-US")
            # return result.text
            
            # Option 3: Use LLM for translation (DeepSeek/SiliconFlow)
            # This would be the most accurate for preserving context
            return self._translate_with_llm(text)
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            # Fallback: return original text
            return text
    
    def _translate_with_llm(self, text: str) -> str:
        """
        Use LLM to translate text (most accurate for context preservation)
        
        This can use the same DeepSeek/SiliconFlow API that's already configured
        """
        # Import here to avoid circular dependency
        from backend.core.config import get_settings
        import httpx
        
        settings = get_settings()
        
        # Use DeepSeek for translation (fast and accurate)
        api_url = "https://api.deepseek.com/chat/completions"
        api_key = settings.DEEPSEEK_API_KEY
        
        if not api_key:
            logger.warning("DeepSeek API key not set, skipping LLM translation")
            return text
        
        try:
            with httpx.Client() as client:
                response = client.post(
                    api_url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [
                            {
                                "role": "system",
                                "content": "You are a translator. Translate the following Chinese text to English. Keep placeholders like __TERM_0__ unchanged. Only output the translation, no explanations."
                            },
                            {
                                "role": "user",
                                "content": text
                            }
                        ],
                        "temperature": 0.1,
                        "max_tokens": 200
                    },
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    translation = result['choices'][0]['message']['content'].strip()
                    return translation
                else:
                    logger.error(f"LLM translation failed: {response.status_code}")
                    return text
                    
        except Exception as e:
            logger.error(f"LLM translation error: {e}")
            return text


# Singleton instance
_translator_instance = None

def get_translator() -> BilingualTranslator:
    """Get or create translator singleton"""
    global _translator_instance
    if _translator_instance is None:
        _translator_instance = BilingualTranslator()
    return _translator_instance
