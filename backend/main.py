from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.responses import StreamingResponse
from backend.core.config import get_settings
from backend.core.search import LocalSearchEngine
from backend.core.prompts import DEFAULT_SYSTEM_PROMPT
from backend.schemas import ChatRequest, ChatResponse, Source
import logging
import json
import httpx

settings = get_settings()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

app = FastAPI(title=settings.APP_NAME)

# Initialize Search Engine (Singleton-ish)
search_engine = LocalSearchEngine()

@app.get("/")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}

@app.post(settings.API_V1_STR + "/chat")
async def chat_endpoint(
    request: ChatRequest, 
    x_user_region: str = Header(default="Global", alias="X-User-Region")
):
    try:
        logger.info(f"Received query: {request.query} | Region: {x_user_region}")
        
        # 1. Retrieval (RAG)
        sources, latency = search_engine.search(request.query)
        logger.info(f"Retrieval finished in {latency:.4f}s with {len(sources)} sources")
        
        # 2. Setup Generator for Streaming
        async def event_generator():
            # A) Send Sources immediately
            # We emit a custom 'sources' event usually, but to help frontend display reference info, 
            # we can also send a system meta event or just logging.
            # Ideally, we follow up with a 'references' event or similar.
            sources_data = [s.dict() for s in sources]
            yield f"event: sources\ndata: {json.dumps(sources_data)}\n\n"

            # B) Determine Provider
            if x_user_region == "CN":
                api_url = f"{settings.SILICONFLOW_BASE_URL}/chat/completions"
                api_key = settings.SILICONFLOW_API_KEY
                model = "deepseek-ai/DeepSeek-V3"
            else:
                api_url = "https://api.deepseek.com/chat/completions"
                api_key = settings.DEEPSEEK_API_KEY
                model = "deepseek-chat"

            if not api_key:
                err_msg = f"API Key missing for region {x_user_region}"
                yield f"event: conversation.message.delta\ndata: {json.dumps({'type': 'answer', 'content': err_msg})}\n\n"
                yield f"event: conversation.chat.failed\ndata: {json.dumps({'msg': err_msg})}\n\n"
                return

            # Construct Prompt
            context_str = "\n\n".join([f"Source: {s.title}\n{s.content}" for s in sources])
            # User message combines context and query
            user_message = f"Context:\n{context_str}\n\nQuestion: {request.query}"

            # C) Call LLM Stream
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    api_url,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": DEFAULT_SYSTEM_PROMPT},
                            {"role": "user", "content": user_message}
                        ],
                        "temperature": 0.3,
                        "stream": True
                    },
                    timeout=30.0
                ) as response:
                    if response.status_code != 200:
                        err_text = await response.aread()
                        logger.error(f"LLM Error: {err_text}")
                        yield f"event: conversation.chat.failed\ndata: {json.dumps({'msg': 'Upstream Provider Error'})}\n\n"
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                content = chunk['choices'][0]['delta'].get('content', '')
                                if content:
                                    # Convert to Coze Format
                                    coze_payload = {"type": "answer", "content": content}
                                    yield f"event: conversation.message.delta\ndata: {json.dumps(coze_payload)}\n\n"
                            except Exception:
                                pass
            
            # D) Finish
            yield f"event: conversation.message.completed\ndata: {json.dumps({'type': 'answer'})}\n\n"
            yield f"event: conversation.chat.completed\ndata: {json.dumps({})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        # We can't raise HTTPException inside a StreamingResponse easily if it started, 
        # but here we haven't started yielding yet.
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
