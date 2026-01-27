import sys
import os
import logging
from pathlib import Path

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from backend.core.config import get_settings
from backend.core.search import LocalSearchEngine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("delivery_test")

def check_file(path_str: str, description: str) -> bool:
    path = Path(path_str)
    if path.exists():
        logger.info(f"[OK] {description} found at {path.absolute()}")
        return True
    else:
        logger.error(f"[FAIL] {description} NOT found at {path.absolute()}")
        return False

def verify_delivery():
    logger.info("=== Starting Delivery Verification ===")
    settings = get_settings()
    all_passed = True

    # 1. Environment & Config
    if not settings.DEEPSEEK_API_KEY:
        logger.warning("[WARN] DEEPSEEK_API_KEY not set (LLM Generation will fail/mock)")
    else:
        logger.info("[OK] DEEPSEEK_API_KEY is set")

    # 2. Model Files
    model_path = Path(settings.MODEL_PATH)
    # Check for likely ONNX files if using onnx models
    # This assumes the folder structure. Adjust if 'model_path' points to a specific file.
    if not check_file(settings.MODEL_PATH, "Model Directory"):
        all_passed = False

    # 3. Database
    if not check_file(settings.KNOWLEDGE_DB_PATH, "Knowledge Database"):
        all_passed = False
    
    # 4. Functional Test (RAG)
    if all_passed:
        logger.info(">>> Running Smoke Test: Query 'CS 440'")
        try:
            engine = LocalSearchEngine()
            results, latency = engine.search("CS 440")
            
            logger.info(f"Search completed in {latency:.2f}s")
            logger.info(f"Found {len(results)} results")
            
            if len(results) > 0:
                logger.info(f"[OK] Top Result: {results[0].title} (Score: {results[0].score:.2f})")
            else:
                logger.warning("[WARN] No results found. Database might be empty.")
                
        except Exception as e:
            logger.error(f"[FAIL] Search Engine crashed: {e}")
            all_passed = False

    if all_passed:
        logger.info("\n✅ DELIVERY TEST PASSED (Backend is ready to serve)")
    else:
        logger.error("\n❌ DELIVERY TEST FAILED (Fix missing files/configs)")

if __name__ == "__main__":
    verify_delivery()
