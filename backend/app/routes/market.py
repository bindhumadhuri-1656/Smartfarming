import os
import json
import logging
from fastapi import APIRouter, Query
from typing import List, Optional
from app.services.translation_service import translate_message

logger = logging.getLogger(__name__)
router = APIRouter()

def load_market_data() -> List[dict]:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "data", "market_prices.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading market_prices.json: {str(e)}")
        return []

@router.get("/market-prices")
async def get_market_prices(
    language: str = Query("English", description="Target translation language")
):
    try:
        raw_prices = load_market_data()
        
        if language.lower() == "english":
            return raw_prices
            
        translated_prices = []
        for p in raw_prices:
            translated_prices.append({
                "crop": await translate_message(p["crop"], language),
                "market": await translate_message(p["market"], language),
                "current_price": p["current_price"], # e.g. "₹3,200 / Quintal" -> currency, no need to translate
                "trend": await translate_message(p["trend"], language),
                "prediction": await translate_message(p["prediction"], language),
                "best_selling_market": await translate_message(p["best_selling_market"], language)
            })
        return translated_prices
        
    except Exception as e:
        logger.error(f"Error in market-prices route: {str(e)}")
        return load_market_data()
