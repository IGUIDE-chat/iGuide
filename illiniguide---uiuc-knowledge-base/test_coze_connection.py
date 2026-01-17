import requests
import json

# Coze Configuration
COZE_API_KEY = 'pat_69hIiNSLjqAXFejtV1XErY8UrFoma2HNxEqSpbCzSxS6w0w97yV8f60x1JgYXBSc'
COZE_BOT_ID = '7595237753500827653'
COZE_API_URL = "https://api.coze.com/v3/chat"

def test_coze():
    print("Testing Coze API Connection (Python)...")
    print(f"   Bot ID: {COZE_BOT_ID}")

    headers = {
        'Authorization': f'Bearer {COZE_API_KEY}',
        'Content-Type': 'application/json'
    }

    print(f"\nStarting 5-Round Comparative Test (Math -> Engineering)...")
    print(f"English Query: 'How to transfer to engineering from math? (answer only in English)'")
    print(f"Chinese Query: '数学怎么转工院？ (请务必用中文回答)'")
    print("-" * 60)
    print(f"{'Round':<6} | {'Lang':<8} | {'Chars':<8} | {'Words':<8} | {'Preview'}")
    print("-" * 60)

    english_stats = []
    chinese_stats = []

    for i in range(5):
        # Run both languages for this round
        for lang, query_base, prompt_suffix in [
            ('EN', "How to transfer to engineering from math?", " (answer only in English)"),
            ('ZH', "数学怎么转工院？", " (请务必用中文回答)")
        ]:
            full_query = query_base + prompt_suffix
            payload = {
                "bot_id": COZE_BOT_ID,
                "user_id": f"test_user_compare_{i}_{lang}",
                "stream": True,
                "auto_save_history": True,
                "additional_messages": [{"role": "user", "content": full_query, "content_type": "text"}]
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
                                if '[DONE]' in json_str: break
                                data = json.loads(json_str)
                                if data.get('type') == 'answer' and 'content' in data:
                                    full_response += data['content']
                                if data.get('event') == 'conversation.chat.completed': break
                            except: pass
                
                char_count = len(full_response)
                word_count = len(full_response.split())
                
                # Store stats
                if lang == 'EN': english_stats.append(word_count)
                else: chinese_stats.append(char_count) # Use chars for Chinese roughly

                # Safe preview
                safe_preview = full_response[:30].replace(chr(10), ' ').encode('ascii', 'replace').decode('ascii')
                print(f"{i+1:<6} | {lang:<8} | {char_count:<8} | {word_count:<8} | {safe_preview}...")

            except Exception as e:
                print(f"{i+1:<6} | {lang:<8} | ERROR: {e}")

    # Summary
    if english_stats and chinese_stats:
        avg_en = sum(english_stats) / len(english_stats)
        avg_zh = sum(chinese_stats) / len(chinese_stats)
        print("-" * 60)
        print(f"Average English Words: {avg_en:.1f}")
        print(f"Average Chinese Chars: {avg_zh:.1f}")
        print(f"Ratio (EN Words / ZH Chars): {avg_en/avg_zh:.2f}")

if __name__ == "__main__":
    test_coze()
