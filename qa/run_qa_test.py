"""
QA Test Runner - Starts backend and runs evaluation
"""
import sys
import os
import time
import subprocess
from pathlib import Path

# Fix encoding for Windows console
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def start_backend():
    """Start backend server in background"""
    print("Starting backend server...")
    process = subprocess.Popen(
        [sys.executable, str(project_root / "start_backend.py")],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(project_root)
    )
    
    # Wait for server to be ready
    print("Waiting for server to initialize (loading ONNX models)...")
    time.sleep(10)
    
    # Test if server is responsive
    import requests
    for i in range(10):
        try:
            response = requests.get("http://localhost:8000/", timeout=2)
            if response.status_code == 200:
                print("[OK] Backend server is ready!")
                return process
        except:
            time.sleep(2)
    
    print("[WARN] Server may not be ready, but continuing with test...")
    return process

def run_evaluation():
    """Run QA evaluation script"""
    print("\n" + "="*60)
    print("Starting QA Evaluation")
    print("="*60 + "\n")
    
    # Import and run evaluation
    from qa.run_evaluation import run_evaluation as run_eval
    run_eval()

if __name__ == "__main__":
    backend_process = None
    try:
        backend_process = start_backend()
        run_evaluation()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
    except Exception as e:
        print(f"\n[ERROR] Error during testing: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if backend_process:
            print("\n\nStopping backend server...")
            backend_process.terminate()
            backend_process.wait()
            print("Backend stopped.")
