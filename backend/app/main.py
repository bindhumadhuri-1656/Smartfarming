import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environmental variables from .env file
load_dotenv()

# Import routers
from app.routes.crop import router as crop_router
from app.routes.weather import router as weather_router
from app.routes.disease import router as disease_router
from app.routes.market import router as market_router
from app.routes.schemes import router as schemes_router
from app.routes.chat import router as chat_router
from app.routes.voice import router as voice_router

app = FastAPI(
    title="AgriPilot AI API",
    description="Multilingual Agricultural AI Co-Pilot platform backend",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production security if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers under the /api prefix
app.include_router(crop_router, prefix="/api", tags=["Crop Recommendations"])
app.include_router(weather_router, prefix="/api", tags=["Weather Alerts"])
app.include_router(disease_router, prefix="/api", tags=["Disease Scanner"])
app.include_router(market_router, prefix="/api", tags=["Market Intelligence"])
app.include_router(schemes_router, prefix="/api", tags=["Government Benefits"])
app.include_router(chat_router, prefix="/api", tags=["Conversational Chat"])
app.include_router(voice_router, prefix="/api", tags=["Voice & Translation Services"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "AgriPilot AI Platform API",
        "supported_languages": ["English", "Telugu", "Hindi", "Tamil", "Kannada"]
    }
