import requests
import json

# Coze Configuration
COZE_API_KEY = 'pat_kAgnKZqdzDca2GDBBNdkr14QEpkz0MtFNapT6Vee17mGepbblkzk49tTpWcBxRVq'
COZE_BOT_ID = '7595237753500827653'
COZE_API_URL = "https://api.coze.com/v3/chat"

def test_coze_stream():
    print("🚀 Testing Coze API with STREAMING enabled...")
    print(f"   Bot ID: {COZE_BOT_ID}\n")

    headers = {
        'Authorization': f'Bearer {COZE_API_KEY}',
        'Content-Type': 'application/json'
    }

    payload = {
        "bot_id": COZE_BOT_ID,
        "user_id": "test_user_stream_001",
        "stream": True,  # Enable streaming
        "auto_save_history": True,
        "additional_messages": [
            {
                "role": "user",
                "content": "Hello! Tell me about UIUC.",
                "content_type": "text"
            }
        ]
    }

    try:
        response = requests.post(COZE_API_URL, headers=headers, json=payload, stream=True, timeout=30)
        
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            return

        print("✅ Stream started! Receiving chunks:\n")
        print("=" * 60)
        
        # Read stream line by line
        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                print(f"RAW LINE: {decoded_line}")
                
                # Try to parse if it's a data line
                if decoded_line.startswith('data:'):
                    try:
                        json_str = decoded_line[5:].strip()
                        if json_str and json_str != '[DONE]':
                            data = json.loads(json_str)
                            print(f"  → PARSED: {json.dumps(data, indent=2, ensure_ascii=False)}")
                    except json.JSONDecodeError as e:
                        print(f"  → JSON Parse Error: {e}")
                print()

        print("=" * 60)
        print("✅ Stream completed!")

    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_coze_stream()
