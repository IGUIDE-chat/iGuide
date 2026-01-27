import os
import requests
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("model_downloader")

# Base paths
BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True, parents=True)

# We use Xenova's ONNX exports as they are reliable and standard for web/edge
# You can swap these with other ONNX exports if needed.
FILES = {
    "embedding.onnx": "https://huggingface.co/Xenova/bge-m3/resolve/main/onnx/model_quantized.onnx",
    "embedding_tokenizer.json": "https://huggingface.co/Xenova/bge-m3/resolve/main/tokenizer.json",
    # Note: Reranker ONNX exports can be tricky. Using a standard compatible one.
    # If Xenova doesn't have the exact reranker, we might use a slightly different one or a specific export.
    # For now, let's use bge-reranker-base (smaller, faster) or similar available in ONNX.
    "reranker.onnx": "https://huggingface.co/Xenova/bge-reranker-base/resolve/main/onnx/model_quantized.onnx",
    "reranker_tokenizer.json": "https://huggingface.co/Xenova/bge-reranker-base/resolve/main/tokenizer.json",
}

def download_file(url: str, dest_path: Path):
    if dest_path.exists():
        logger.info(f"File already exists: {dest_path.name}")
        return

    logger.info(f"Downloading {dest_path.name} from {url}...")
    try:
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(dest_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        logger.info(f"Successfully downloaded {dest_path.name}")
    except Exception as e:
        logger.error(f"Failed to download {dest_path.name}: {e}")
        if dest_path.exists():
            dest_path.unlink() # Clean up partial

def main():
    print(f"Downloading ONNX models to {MODELS_DIR}...")
    for filename, url in FILES.items():
        download_file(url, MODELS_DIR / filename)
    print("\nDownload complete! You can now run the backend.")

if __name__ == "__main__":
    main()
