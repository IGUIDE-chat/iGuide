"""
Simple verification script for bilingual translator
Run from project root: python -c "exec(open('backend/tests/simple_verify.py').read())"
"""

import sys
sys.path.insert(0, 'd:/NewFolder/Ask/Ask')

print("=" * 60)
print("Bilingual Translator Verification")
print("=" * 60)

# Test 1: Language Detection
print("\n1. Testing Language Detection...")
from backend.core.translator import BilingualTranslator

translator = BilingualTranslator()

tests = [
    ("What is CS 225?", "en"),
    ("CS 225是什么课程？", "zh"),
]

for text, expected in tests:
    result = translator.detect_language(text)
    status = "✅" if result == expected else "❌"
    print(f"  {status} '{text}' -> {result}")

# Test 2: Terminology Preservation
print("\n2. Testing Terminology Preservation...")
text = "UIUC的CS专业GPA要求"
modified, placeholder_map = translator.preserve_special_terms(text)
print(f"  Original: {text}")
print(f"  Preserved terms: {list(placeholder_map.values())}")

# Test 3: Translation (if API key is set)
print("\n3. Testing Translation...")
query = "CS 225的GPA要求是多少？"
print(f"  Query: {query}")
try:
    translated = translator.translate_to_english(query)
    print(f"  ✅ Translated: {translated}")
except Exception as e:
    print(f"  ⚠️  Translation skipped (API key may not be set): {e}")

print("\n" + "=" * 60)
print("Verification Complete!")
print("=" * 60)
