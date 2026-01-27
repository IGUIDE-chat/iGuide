"""
Manual verification script for bilingual translator
Run this to quickly test the translator functionality
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.core.translator import BilingualTranslator, get_translator


def test_language_detection():
    print("\n=== Testing Language Detection ===")
    translator = BilingualTranslator()
    
    test_cases = [
        ("What is CS 225?", "en"),
        ("CS 225是什么课程？", "zh"),
        ("UIUC的GPA要求", "zh"),
        ("GPA requirement for UIUC", "en"),
    ]
    
    for text, expected in test_cases:
        result = translator.detect_language(text)
        status = "✅" if result == expected else "❌"
        print(f"{status} '{text}' -> {result} (expected: {expected})")


def test_terminology_preservation():
    print("\n=== Testing Terminology Preservation ===")
    translator = BilingualTranslator()
    
    test_cases = [
        "UIUC的计算机专业很好",
        "CS 225的GPA要求是多少？",
        "ISSS在哪里？I-20怎么办理？",
        "去ARC健身房需要什么？",
    ]
    
    for text in test_cases:
        modified, placeholder_map = translator.preserve_special_terms(text)
        restored = translator.restore_special_terms(modified, placeholder_map)
        
        print(f"\nOriginal:  {text}")
        print(f"Modified:  {modified}")
        print(f"Preserved: {list(placeholder_map.values())}")
        print(f"Restored:  {restored}")


def test_translation():
    print("\n=== Testing Translation ===")
    translator = BilingualTranslator()
    
    test_cases = [
        "What is the GPA requirement for CS 225?",  # English (should pass through)
        "CS 225的GPA要求是多少？",  # Chinese with preserved terms
        "UIUC的计算机专业怎么样？",  # Chinese with UIUC
        "ISSS在哪里？",  # Immigration term
    ]
    
    for query in test_cases:
        print(f"\nOriginal: {query}")
        try:
            translated = translator.translate_to_english(query)
            print(f"Translated: {translated}")
            
            # Check if special terms are preserved
            special_terms = ["CS 225", "GPA", "UIUC", "ISSS"]
            preserved = [term for term in special_terms if term in translated]
            if preserved:
                print(f"✅ Preserved terms: {preserved}")
        except Exception as e:
            print(f"❌ Error: {e}")


def test_singleton():
    print("\n=== Testing Singleton Pattern ===")
    translator1 = get_translator()
    translator2 = get_translator()
    
    if translator1 is translator2:
        print("✅ Singleton working: Same instance returned")
    else:
        print("❌ Singleton broken: Different instances returned")


if __name__ == "__main__":
    print("=" * 60)
    print("Bilingual Translator Manual Verification")
    print("=" * 60)
    
    test_language_detection()
    test_terminology_preservation()
    test_translation()
    test_singleton()
    
    print("\n" + "=" * 60)
    print("Verification Complete!")
    print("=" * 60)
