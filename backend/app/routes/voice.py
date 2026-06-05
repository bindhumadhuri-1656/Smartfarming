import logging
import base64
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.translation_service import translate_message
from app.services.gemini_service import get_model

logger = logging.getLogger(__name__)
router = APIRouter()

class TranslationRequest(BaseModel):
    text: str
    target_language: str

class TranslationResponse(BaseModel):
    translated_text: str

class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "English"

class TTSResponse(BaseModel):
    audio_base64: str
    content_type: str

@router.post("/translate", response_model=TranslationResponse)
async def translate_text_endpoint(req: TranslationRequest):
    try:
        translated = await translate_message(req.text, req.target_language)
        return TranslationResponse(translated_text=translated)
    except Exception as e:
        logger.error(f"Translation endpoint failed: {str(e)}")
        return TranslationResponse(translated_text=req.text)

@router.post("/speech-to-text")
async def speech_to_text(
    file: UploadFile = File(...),
    language: Optional[str] = Form("English")
):
    try:
        # Read the audio bytes
        audio_bytes = await file.read()
        mime_type = file.content_type or "audio/webm"
        
        # We can pass the audio bytes to Gemini to transcribe it!
        model = get_model()
        prompt = f"Transcribe this audio. The speaker is talking in {language}. Return ONLY the transcribed text. Do not add any explanation or notes."
        
        audio_part = {
            "mime_type": mime_type,
            "data": audio_bytes
        }
        
        response = model.generate_content([prompt, audio_part])
        transcription = response.text.strip()
        
        return {"text": transcription}
    except Exception as e:
        logger.error(f"Speech-to-text failed: {str(e)}")
        # Provide a fallback mock response based on language
        fallback_queries = {
            "Telugu": "రేపు వర్షం పడుతుందా?",
            "Hindi": "कल बारिश होगी क्या?",
            "Tamil": "நாளை மழை பெய்யுமா?",
            "Kannada": "ನಾಳೆ ಮಳೆ ಬರುತ್ತಾ?",
            "English": "Will it rain tomorrow?"
        }
        return {"text": fallback_queries.get(language, "Will it rain tomorrow?"), "note": "Demo fallback"}

@router.post("/text-to-speech", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest):
    # Returns a dummy base64 silent WAV so the API remains functional.
    # The client-side will prioritize Browser Speech Synthesis for high-fidelity native audio.
    # Silent 1-second WAV base64
    silent_wav_b64 = (
        "UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA"
    )
    return TTSResponse(
        audio_base64=silent_wav_b64,
        content_type="audio/wav"
    )
