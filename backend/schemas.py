from pydantic import BaseModel, Field
from typing import List, Optional, Literal

class ChatRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    history: List[dict] = [] # List of previous messages {"role": "user", "content": "..."}
    stream: bool = False

class Source(BaseModel):
    title: str
    url: str
    content: str
    score: float
    source_type: Literal["local", "web"]

class ChatResponse(BaseModel):
    answer: str
    sources: List[Source]
    latency: float

class Chunk(BaseModel):
    id: str
    content: str
    metadata: dict
    score: float = 0.0
