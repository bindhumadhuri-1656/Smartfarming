import os
import json
import logging
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.gemini_service import get_model, translate_text
from app.services.translation_service import translate_message

logger = logging.getLogger(__name__)
router = APIRouter()

class SchemeExplanationRequest(BaseModel):
    scheme_name: str
    language: Optional[str] = "English"

def load_schemes_data() -> List[dict]:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "data", "government_schemes.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading government_schemes.json: {str(e)}")
        return []

@router.get("/government-schemes")
async def get_government_schemes(
    language: str = Query("English", description="Target translation language")
):
    try:
        raw_schemes = load_schemes_data()
        
        if language.lower() == "english":
            return raw_schemes
            
        translated_schemes = []
        for s in raw_schemes:
            translated_schemes.append({
                "scheme_name": await translate_message(s["scheme_name"], language),
                "eligibility": await translate_message(s["eligibility"], language),
                "benefits": await translate_message(s["benefits"], language),
                "deadline": await translate_message(s["deadline"], language),
                "application_link": s["application_link"]
            })
        return translated_schemes
        
    except Exception as e:
        logger.error(f"Error in government-schemes route: {str(e)}")
        return load_schemes_data()

@router.post("/government-schemes/explain")
async def explain_government_scheme(req: SchemeExplanationRequest):
    schemes = load_schemes_data()
    
    # Try to find the matching scheme (fuzzy match in case it was already translated)
    selected_scheme = None
    for s in schemes:
        if s["scheme_name"].lower() in req.scheme_name.lower() or req.scheme_name.lower() in s["scheme_name"].lower():
            selected_scheme = s
            break
            
    if not selected_scheme:
        # Default fallback context
        scheme_context = f"Scheme Name: {req.scheme_name}"
    else:
        scheme_context = (
            f"Scheme Name: {selected_scheme['scheme_name']}\n"
            f"Eligibility: {selected_scheme['eligibility']}\n"
            f"Benefits: {selected_scheme['benefits']}\n"
            f"Deadline: {selected_scheme['deadline']}"
        )
        
    prompt = f"""
    You are AgriPilot AI. A farmer is asking about this government scheme:
    {scheme_context}
    
    Explain this scheme to them in a very simple, clear, and reassuring way.
    Detail exactly:
    - What benefits they will get
    - Who is eligible
    - How they can apply (mention link {selected_scheme['application_link'] if selected_scheme else 'the government portal'})
    
    Keep the tone helpful and write the response in {req.language}. Avoid bureaucratic language. Keep it under 5 sentences.
    """
    
    try:
        model = get_model()
        response = model.generate_content(prompt)
        explanation = response.text.strip()
    except Exception as e:
        logger.error(f"Gemini scheme explanation failed: {str(e)}")
        explanation = f"This scheme provides support for farmers. Please check eligibility and register by the deadline."
        explanation = await translate_text(explanation, req.language)
        
    return {"explanation": explanation}
