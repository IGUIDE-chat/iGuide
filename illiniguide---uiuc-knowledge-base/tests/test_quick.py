import requests
import json
import time

# Coze Configuration
COZE_API_KEY = 'pat_69hIiNSLjqAXFejtV1XErY8UrFoma2HNxEqSpbCzSxS6w0w97yV8f60x1JgYXBSc'
COZE_BOT_ID = '7595237753500827653'
COZE_API_URL = "https://api.coze.com/v3/chat"

# Quick test with only 3 questions
TEST_QUESTIONS = [
    {
        "en": "What vaccines are required for enrollment?",
        "zh": "入学需要哪些疫苗？"
    },
    {
        "en": "How can I get a student ID card?",
        "zh": "如何获得学生证？"
    },
    {
        "en": "How do I access the student portal?",
        "zh": "如何访问学生门户？"
    }
]

def call_coze(query, lang, user_id):
    """Call Coze API and return response text and length"""
    headers = {
        'Authorization': f'Bearer {COZE_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    # BILINGUAL KNOWLEDGE BASE HANDLING - matches cozeService.ts
    if lang == 'en':
        full_query = query + """

[IMPORTANT INSTRUCTIONS]
1. Search BOTH Chinese AND English content in the knowledge base
2. Merge ALL relevant information from both languages into your response
3. Translate any Chinese knowledge base content into English
4. Do NOT omit any unique information from either language version
5. Provide a comprehensive and detailed response"""
    else:
        full_query = query + """

【重要指令】
1. 请同时搜索知识库中的中文和英文内容
2. 将所有相关内容整合后，用中文完整回答
3. 英文知识库中的内容也必须翻译成中文包含在回答中
4. 不要遗漏任何语言版本中的独特信息
5. 回答要详尽全面"""
    
    payload = {
        "bot_id": COZE_BOT_ID,
        "user_id": user_id,
        "stream": True,
        "auto_save_history": True,
        "additional_messages": [{
            "role": "user", 
            "content": full_query, 
            "content_type": "text"
        }],
        "custom_variables": {
            "language": "English" if lang == 'en' else "Chinese",
            "response_detail_level": "comprehensive"
        }
    }
    
    try:
        response = requests.post(COZE_API_URL, headers=headers, json=payload, stream=True, timeout=60)
        full_response = ""
        
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith('data:'):
                    json_str = decoded_line[5:].strip()
                    try:
                        if '[DONE]' in json_str: 
                            break
                        data = json.loads(json_str)
                        if data.get('type') == 'answer' and 'content' in data:
                            full_response += data['content']
                        if data.get('event') == 'conversation.chat.completed': 
                            break
                    except: 
                        pass
        
        return full_response, len(full_response)
    
    except Exception as e:
        return f"ERROR: {e}", 0

def test_coze():
    print("=" * 80)
    print("QUICK TEST - Chinese vs English Response Length (3 Questions)")
    print("=" * 80)
    print()
    
    results = []
    
    for i, question in enumerate(TEST_QUESTIONS, 1):
        print(f"\n{'='*80}")
        print(f"Test {i}/3")
        print(f"{'='*80}")
        
        # Test Chinese
        print(f"\n[Q] Question (Chinese): {question['zh']}")
        print("[*] Calling Coze API in Chinese...")
        zh_response, zh_length = call_coze(question['zh'], 'zh', f"quick_test_{i}_zh")
        print(f"[OK] Chinese response: {zh_length} chars")
        
        time.sleep(1)  # Reduced delay
        
        # Test English
        print(f"\n[Q] Question (English): {question['en']}")
        print("[*] Calling Coze API in English...")
        en_response, en_length = call_coze(question['en'], 'en', f"quick_test_{i}_en")
        print(f"[OK] English response: {en_length} chars")
        
        # Compare
        ratio = (en_length / zh_length * 100) if zh_length > 0 else 0
        passed = ratio >= 80  # Consider pass if English >= 80% of Chinese length
        status = "[PASS]" if passed else "[FAIL]"
        
        print(f"\n[Stats] Comparison:")
        print(f"   Chinese: {zh_length} chars")
        print(f"   English: {en_length} chars")
        print(f"   Ratio: {ratio:.1f}%")
        print(f"   Status: {status}")
        
        results.append({
            "test": i,
            "question_zh": question['zh'],
            "question_en": question['en'],
            "zh_length": zh_length,
            "en_length": en_length,
            "ratio": ratio,
            "passed": passed
        })
        
        time.sleep(1)  # Reduced delay
    
    # Summary
    print(f"\n\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}\n")
    
    print(f"{'Test':<6} {'Chinese':<10} {'English':<10} {'Ratio':<12} {'Status':<10}")
    print("-" * 80)
    for r in results:
        status = "[PASS]" if r['passed'] else "[FAIL]"
        print(f"{r['test']:<6} {r['zh_length']:<10} {r['en_length']:<10} {r['ratio']:.1f}%{'':<8} {status}")
    
    passed_count = sum(1 for r in results if r['passed'])
    avg_ratio = sum(r['ratio'] for r in results) / len(results)
    
    print(f"\n{'='*80}")
    print(f"Overall Results:")
    print(f"  Passed: {passed_count}/3 tests ({passed_count*100//3}%)")
    print(f"  Average EN/ZH Ratio: {avg_ratio:.1f}%")
    print(f"{'='*80}")
    
    # Save detailed results
    with open('test_results_quick.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print("\n[SAVED] Results saved to test_results_quick.json")

if __name__ == "__main__":
    test_coze()
