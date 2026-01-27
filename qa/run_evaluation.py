import json
import requests
import time
import pandas as pd
import sys
import os
from pathlib import Path

# Get project root
PROJECT_ROOT = Path(__file__).parent.parent

# Configuration
BACKEND_URL = "http://localhost:8000/api/v1/chat"
BAD_CASES_PATH = PROJECT_ROOT / "qa" / "bad_cases.json"
OUTPUT_PATH = PROJECT_ROOT / "qa" / "eval_results.csv"

def run_evaluation():
    if not os.path.exists(BAD_CASES_PATH):
        print(f"Error: {BAD_CASES_PATH} not found.")
        return

    with open(BAD_CASES_PATH, 'r', encoding='utf-8') as f:
        test_cases = json.load(f)

    results = []
    print(f"Starting evaluation of {len(test_cases)} cases...")

    for i, case in enumerate(test_cases):
        question = case['question']
        category = case['category']
        expected = case.get('expected_keywords', [])
        
        print(f"[{i+1}/{len(test_cases)}] Querying: {question}")
        
        start_time = time.time()
        try:
            # Note: Using non-streaming for simple evaluation if backend supports it
            # But our backend defaults to stream=True logic in main.py now?
            # Actually main.py uses StreamResponse unless we change it.
            # We can read the stream to get the full answer.
            
            response = requests.post(
                BACKEND_URL, 
                json={"query": question},
                headers={"X-User-Region": "Global"},
                stream=True
            )
            
            answer = ""
            sources = []
            server_latency = 0
            
            if response.status_code == 200:
                # Simple SSE Parser
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        if decoded_line.startswith("data: "):
                            data_str = decoded_line[6:]
                            if data_str == "[DONE]":
                                break
                            try:
                                data = json.loads(data_str)
                                if "type" in data:
                                    if data["type"] == "token" or data["type"] == "answer":
                                        # 'token' is what we yielded in main.py, 'answer' is what we send as 'conversation.message.delta'
                                        # Wait, main.py yields:
                                        # event: conversation.message.delta -> data: {type: answer, content: ...}
                                        # The 'data' object itself has 'content'.
                                        if "content" in data:
                                            answer += data["content"]
                                    elif data["type"] == "sources":
                                        sources = data["data"]
                                    elif data["type"] == "metrics":
                                        server_latency = data["data"].get("latency", 0)
                                # Check for nested Coze structure in main.py (Wait, main.py yields 'event: ...' then 'data: ...')
                                # requests.iter_lines() gives raw lines.
                                # 'event: ...' lines are skipped by 'startswith data:' check.
                                # But we modified main.py to send `event: ...\ndata: ...` which might be two lines or one block?
                                # SSE spec is `event: name\ndata: payload\n\n`.
                                # Requests iter_lines splits by \n.
                                # So we will see "event: ..." then "data: ..." then empty string.
                            except:
                                pass
            else:
                answer = f"Error: {response.status_code}"

        except Exception as e:
            answer = f"Exception: {str(e)}"
            server_latency = -1

        total_time = time.time() - start_time
        
        # Check Keywords
        score = 0
        found_keywords = []
        if isinstance(expected, list):
            for kw in expected:
                if kw.lower() in answer.lower():
                    score += 1
                    found_keywords.append(kw)
            match_rate = score / len(expected) if expected else 1.0
        else:
            match_rate = 0.0

        results.append({
            "category": category,
            "question": question,
            "answer": answer[:200] + "...", # Truncate for CSV
            "full_answer": answer,
            "latency_total": round(total_time, 2),
            "latency_server": round(server_latency, 2),
            "sources_count": len(sources),
            "match_rate": round(match_rate, 2),
            "found_keywords": ", ".join(found_keywords)
        })

    # Save Results
    df = pd.DataFrame(results)
    df.to_csv(OUTPUT_PATH, index=False)
    print(f"Evaluation complete. Results saved to {OUTPUT_PATH}")
    
    # Summary Metrics
    print("\n=== Summary ===")
    print(f"Average Latency: {df['latency_total'].mean():.2f}s")
    print(f"Average Keyword Match: {df['match_rate'].mean() * 100:.1f}%")
    print(f"Average Sources: {df['sources_count'].mean():.1f}")

if __name__ == "__main__":
    run_evaluation()
