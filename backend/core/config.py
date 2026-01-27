from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path
import os

# Get project root (Ask/ directory)
PROJECT_ROOT = Path(__file__).parent.parent.parent.absolute()

class Settings(BaseSettings):
    APP_NAME: str = "IlliniGuide Core"
    API_V1_STR: str = "/api/v1"
    
    # Paths (using absolute paths from project root)
    KNOWLEDGE_DB_PATH: str = str(PROJECT_ROOT / "knowledge.db")
    MODEL_PATH: str = str(PROJECT_ROOT / "backend" / "models")
    
    # API Keys
    TAVILY_API_KEY: str | None = None
    DEEPSEEK_API_KEY: str | None = None
    
    # CN Route (SiliconFlow)
    SILICONFLOW_API_KEY: str | None = None
    SILICONFLOW_BASE_URL: str = "https://api.siliconflow.cn/v1"

    
    # Search Config
    RAG_CONFIDENCE_THRESHOLD: float = 0.4
    TOP_K_RETRIEVAL: int = 60
    TOP_K_RERANK: int = 5

    class Config:
        env_file = str(PROJECT_ROOT / ".env")

@lru_cache()
def get_settings():
    return Settings()
