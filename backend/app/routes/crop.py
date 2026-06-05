import os
import json
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.gemini_service import explain_crop_recommendations

logger = logging.getLogger(__name__)
router = APIRouter()

class CropRecommendationRequest(BaseModel):
    location: str
    soil_type: str
    water_availability: str
    budget: str
    experience: str
    language: Optional[str] = "English"

class CropRecommendationResponse(BaseModel):
    crop_name: str
    expected_profit: str
    growing_difficulty: str
    market_demand: str
    why_recommended: str

def load_crop_data() -> List[dict]:
    """Helper to load crops JSON database."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(base_dir, "data", "crop_recommendations.json")
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading crop_recommendations.json: {str(e)}")
        # Quick fallback data in case of disk read issues
        return [
            {
                "crop_name": "Tomato",
                "soil_types": ["Sandy", "Red", "Loamy"],
                "water_requirement": "Medium",
                "difficulty": "Easy",
                "market_demand": "High",
                "average_profit_per_acre": 28000,
                "budget_requirement": "Medium",
                "experience_level": "Beginner"
            }
        ]

@router.post("/crop-recommendation", response_model=List[CropRecommendationResponse])
async def get_crop_recommendations(req: CropRecommendationRequest):
    crops = load_crop_data()
    
    # Matching logic: filter crops based on compatibility
    matched_crops = []
    for c in crops:
        # Check soil type compatibility
        soil_match = any(st.lower() in req.soil_type.lower() for st in c["soil_types"]) or req.soil_type.lower() == "any"
        
        # Check water availability compatibility
        water_req = c["water_requirement"].lower()
        water_avail = req.water_availability.lower()
        water_match = False
        if water_avail == "high" or water_avail == "any":
            water_match = True
        elif water_avail == "medium":
            water_match = water_req in ["medium", "low"]
        elif water_avail == "low":
            water_match = water_req == "low"
            
        if soil_match and water_match:
            matched_crops.append(c)
            
    # If no crops match exactly, relax the filter and return top 3 crops
    if not matched_crops:
        matched_crops = crops[:3]
    else:
        # Sort matched crops by average profit
        matched_crops = sorted(matched_crops, key=lambda x: x["average_profit_per_acre"], reverse=True)[:3]
        
    # Standardize output format
    formatted_crops = []
    for c in matched_crops:
        formatted_crops.append({
            "crop_name": c["crop_name"],
            "average_profit_per_acre": f"₹{c['average_profit_per_acre']:,}",
            "difficulty": c["difficulty"],
            "market_demand": c["market_demand"],
            "water_requirement": c["water_requirement"]
        })
        
    # Generate Gemini explanations in target language
    try:
        enriched_recommendations = await explain_crop_recommendations(
            user_input=req.dict(),
            recommended_crops=formatted_crops,
            language=req.language
        )
    except Exception as e:
        logger.error(f"Error enriching crop recommendations: {str(e)}")
        enriched_recommendations = [
            {
                **c,
                "why_recommended": f"Ideal crop recommendation for your soil ({req.soil_type}) and budget."
            } for c in formatted_crops
        ]
        
    # Return matched crops formatted for response
    response_data = []
    for item in enriched_recommendations:
        response_data.append(CropRecommendationResponse(
            crop_name=item["crop_name"],
            expected_profit=item["average_profit_per_acre"],
            growing_difficulty=item["difficulty"],
            market_demand=item["market_demand"],
            why_recommended=item["why_recommended"]
        ))
        
    return response_data
