import requests
import json

# Coze Configuration
COZE_API_KEY = 'pat_kAgnKZqdzDca2GDBBNdkr14QEpkz0MtFNapT6Vee17mGepbblkzk49tTpWcBxRVq'
COZE_BOT_ID = '7595237753500827653'
COZE_API_URL = "https://api.coze.com/v3/chat"

def test_coze():
    print("🚀 Testing Coze API Connection (Python)...")
    print(f"   Bot ID: {COZE_BOT_ID}")

    headers = {
        'Authorization': f'Bearer {COZE_API_KEY}',
        'Content-Type': 'application/json'
    }

    payload = {
        "bot_id": COZE_BOT_ID,
        "user_id": "test_user_py_001",
        "stream": False,
        "auto_save_history": True,
        "additional_messages": [
            {
                "role": "user",
                "content": "Hello! Are you online?",
                "content_type": "text"
            }
        ]
    }

    try:
        response = requests.post(COZE_API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(response.text)
            return

        data = response.json()
        print("✅ API Response Received!")
        
        if 'id' in data:
            print(f"   Chat ID: {data['id']}")
            print("   Status: Connection Successful.")
        else:
            print("   Warning: Response format unexpected.")
            print(json.dumps(data, indent=2))

    except Exception as e:
        print(f"❌ Connection Failed: {e}")

if __name__ == "__main__":
    test_coze()
