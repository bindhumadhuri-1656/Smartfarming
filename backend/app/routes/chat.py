import logging
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.gemini_service import generate_chat_response

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "English"
    history: Optional[List[Dict[str, str]]] = None # List of {"role": "user"|"model", "content": "..."}

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def chat_with_agripilot(req: ChatRequest):
    try:
        reply = await generate_chat_response(
            message=req.message,
            language=req.language,
            chat_history=req.history
        )
        return ChatResponse(response=reply)
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return ChatResponse(response="AgriPilot is currently offline. Please check your network connection.")
