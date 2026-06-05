import os
import json
import logging
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from google.generativeai.types import GenerationConfig

logger = logging.getLogger(__name__)

# Configure the API key from environment variable
api_key = os.environ.get("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY is not set in the environment variables.")

# Supported languages list
SUPPORTED_LANGUAGES = {
    "English": "en",
    "Telugu": "te",
    "Hindi": "hi",
    "Tamil": "ta",
    "Kannada": "kn"
}

SYSTEM_PROMPT = """
Act as AgriPilot AI.
You are a multilingual agricultural assistant designed for farmers.
Always provide practical, farmer-friendly, and simple advice.
Avoid overly technical jargon or complex terminology. Focus strictly on direct, actionable instructions.
Always structure recommendations by answering:
1. What to do (Action)
2. Why to do it (Reason)
3. When to do it (Timeline)

Keep responses short, engaging, and highly actionable.
You support Telugu, Hindi, Tamil, Kannada, and English.
You must write your response in the language requested by the user. If they ask in English but request Telugu, translate the whole output into Telugu.
"""

def get_model(model_name: str = "gemini-2.5-flash") -> genai.GenerativeModel:
    """Helper to load a GenerativeModel with a fallback to gemini-1.5-flash if 2.5 is unavailable or errors out."""
    try:
        # Check if API key is set, if not, try reading from env again in case it was loaded late
        current_key = os.environ.get("GEMINI_API_KEY", "")
        if current_key:
            genai.configure(api_key=current_key)
        
        return genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_PROMPT
        )
    except Exception as e:
        logger.warning(f"Failed to load {model_name}: {str(e)}. Falling back to gemini-1.5-flash.")
        return genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT
        )

async def generate_chat_response(message: str, language: str, chat_history: Optional[List[Dict[str, str]]] = None) -> str:
    """General chat completion with AgriPilot persona in the target language."""
    try:
        model = get_model()
        
        # Prepare contents including history if available
        contents = []
        if chat_history:
            for turn in chat_history:
                role = "user" if turn.get("role") == "user" else "model"
                contents.append({"role": role, "parts": [turn.get("content", "")]})
        
        # Add the current message with language instruction
        lang_instruction = f" Respond in {language} language."
        contents.append({"role": "user", "parts": [message + lang_instruction]})
        
        response = model.generate_content(contents)
        return response.text
    except Exception as e:
        logger.error(f"Error in generate_chat_response: {str(e)}")
        # Return a simple mock fallback if API is not configured
        fallback_msg = f"[Demo Mode] Here is AgriPilot. To help you with your query: '{message}' in {language}, please set up your GEMINI_API_KEY. Always irrigate timely and check soil moisture."
        return await translate_text(fallback_msg, language)

async def explain_crop_recommendations(user_input: Dict[str, Any], recommended_crops: List[Dict[str, Any]], language: str) -> List[Dict[str, Any]]:
    """Generates farmer-friendly Gemini explanations for why each crop is recommended based on the user's input."""
    model = get_model()
    
    enriched_recommendations = []
    for crop in recommended_crops:
        prompt = f"""
        User Input:
        - Location: {user_input.get('location')}
        - Soil Type: {user_input.get('soil_type')}
        - Water Availability: {user_input.get('water_availability')}
        - Budget: {user_input.get('budget')}
        - Experience Level: {user_input.get('experience')}
        
        Recommended Crop: {crop['crop_name']}
        Average Profit: {crop['average_profit_per_acre']}
        Difficulty: {crop['difficulty']}
        Market Demand: {crop['market_demand']}
        
        Explain why this crop is a good fit for this farmer. Highlight:
        - What they should do to get started
        - Why it matches their soil and water level
        - When they should plant it (season)
        
        Respond ONLY with a short, 3-4 sentence paragraph. Write it in {language}.
        """
        try:
            response = model.generate_content(prompt)
            explanation = response.text.strip()
        except Exception as e:
            logger.error(f"Error explaining crop recommendation for {crop['crop_name']}: {str(e)}")
            explanation = f"Recommended based on your soil type ({user_input.get('soil_type')}) and {crop['water_requirement']} water requirement. Suitable for beginner-to-intermediate level."
            explanation = await translate_text(explanation, language)
            
        enriched_crop = crop.copy()
        enriched_crop["why_recommended"] = explanation
        enriched_recommendations.append(enriched_crop)
        
    return enriched_recommendations

async def detect_crop_disease(image_bytes: bytes, mime_type: str, language: str) -> Dict[str, Any]:
    """Analyzes crop image using Gemini Vision (Gemini 2.5/1.5 Flash) and returns structured analysis."""
    model = get_model()
    
    prompt = f"""
    Analyze this image of a plant/crop leaf. Identify if there is a disease.
    Provide a JSON response with the following keys. Ensure it is valid JSON and nothing else:
    {{
      "disease_name": "Name of the disease (or 'Healthy Plant' if no disease is found)",
      "confidence": "Estimated confidence percentage (e.g., '85%')",
      "severity": "Severity level (Low, Medium, or High)",
      "treatment": "Practical, step-by-step treatment plan for the farmer (What to do, why, and when)",
      "preventive_measures": "Actions to prevent this in future crops",
      "explanation": "Short, reassuring summary of the condition in plain words"
    }}
    
    Translate all text values (disease_name, severity, treatment, preventive_measures, explanation) into {language}.
    """
    
    try:
        # Prepare image parts for Gemini
        image_part = {
            "mime_type": mime_type,
            "data": image_bytes
        }
        
        # Configure output as JSON if supported
        response = model.generate_content(
            [prompt, image_part],
            generation_config=GenerationConfig(response_mime_type="application/json")
        )
        
        result = json.loads(response.text)
        return result
    except Exception as e:
        logger.error(f"Error in detect_crop_disease: {str(e)}")
        # Provide a fallback JSON structure
        fallback_data = {
            "disease_name": "Leaf Spot (Demo)",
            "confidence": "70% (Demo Mode)",
            "severity": "Medium",
            "treatment": "1. Spray Neem oil mixed with water. 2. Remove infected lower leaves. 3. Avoid overhead watering to prevent spore spreading.",
            "preventive_measures": "Ensure proper crop spacing, rotation, and use disease-resistant seeds.",
            "explanation": "Your crop is showing signs of leaf spot. This is common and manageable with immediate organic spraying."
        }
        # Translate values
        translated_fallback = {}
        for k, v in fallback_data.items():
            if k == "confidence":
                translated_fallback[k] = v
            else:
                translated_fallback[k] = await translate_text(v, language)
        return translated_fallback

async def translate_text(text: str, target_language: str) -> str:
    """Helper to translate any system text to the target language using Gemini."""
    if target_language.lower() == "english":
        return text
        
    try:
        model = get_model()
        prompt = f"Translate the following agricultural text to {target_language}. Keep it natural, warm, and farmer-friendly. Do not add any conversational introduction, only return the translation:\n\n{text}"
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error in translate_text: {str(e)}")
        return text
