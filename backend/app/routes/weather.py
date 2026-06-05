import logging
from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
from app.services.weather_service import get_weather_data
from app.services.translation_service import translate_message

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/weather")
async def get_weather(
    location: str = Query("Hyderabad", description="Location name to fetch weather for"),
    language: str = Query("English", description="Target language for translation")
):
    try:
        weather_details = await get_weather_data(location)
        
        # Translate the main actionable recommendation
        original_action = weather_details.get("recommended_action", "")
        translated_action = await translate_message(original_action, language)
        weather_details["recommended_action"] = translated_action
        
        # Translate days / text keys in forecast if appropriate
        forecast = weather_details.get("forecast", [])
        for f in forecast:
            # If standard day name (like Day 1, Day 2), translate
            if "Day" in f.get("date", ""):
                f["date"] = await translate_message(f["date"], language)
                
        return weather_details
    except Exception as e:
        logger.error(f"Error in weather route: {str(e)}")
        return {
            "location_name": f"{location} (Offline)",
            "temperature": "28°C",
            "humidity": "60%",
            "wind_speed": "12 km/h",
            "rain_probability": 30,
            "rain_warning": False,
            "recommended_action": await translate_message("Standard irrigation and crop monitoring.", language),
            "forecast": []
        }
