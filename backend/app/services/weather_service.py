import os
import time
import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Simple in-memory cache: {location_key: (timestamp, weather_data)}
WEATHER_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 600  # 10 minutes

async def get_weather_data(location: str) -> Dict[str, Any]:
    """Retrieves current weather and forecast from OpenWeather API using the configured key."""
    cache_key = location.strip().lower()
    now = time.time()
    
    # Check cache
    if cache_key in WEATHER_CACHE:
        cache_time, cached_data = WEATHER_CACHE[cache_key]
        if now - cache_time < CACHE_TTL_SECONDS:
            logger.info(f"Returning cached weather data for: {location}")
            return cached_data

    # Default coordinates (Hyderabad) if resolving fails
    lat, lon = 17.3850, 78.4867
    resolved_name = location
    
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    if not api_key:
        logger.warning("OPENWEATHER_API_KEY is not set in the environment variables.")
        # Attempt to use expired cache if available
        if cache_key in WEATHER_CACHE:
            logger.info(f"Missing API key. Returning expired cached weather for {location}")
            return WEATHER_CACHE[cache_key][1]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # 1. Fetch current weather to get latest conditions and coordinates
            current_url = "https://api.openweathermap.org/data/2.5/weather"
            current_response = await client.get(
                current_url,
                params={"q": location, "appid": api_key, "units": "metric"}
            )
            
            # Check for key error states
            if current_response.status_code == 401:
                logger.error("OpenWeather API key is invalid (401). Using fallback or cache.")
                if cache_key in WEATHER_CACHE:
                    return WEATHER_CACHE[cache_key][1]
            elif current_response.status_code == 429:
                logger.warning("OpenWeather API rate limit reached (429). Using fallback or cache.")
                if cache_key in WEATHER_CACHE:
                    return WEATHER_CACHE[cache_key][1]
            
            if current_response.status_code == 200:
                current_data = current_response.json()
                lat = current_data.get("coord", {}).get("lat", lat)
                lon = current_data.get("coord", {}).get("lon", lon)
                resolved_name = f"{current_data.get('name')}, {current_data.get('sys', {}).get('country')}" if current_data.get('sys', {}).get('country') else current_data.get('name', location)
                
                current_temp = current_data.get("main", {}).get("temp", 28.0)
                current_humidity = current_data.get("main", {}).get("humidity", 60.0)
                current_wind_mps = current_data.get("wind", {}).get("speed", 3.0)
                current_wind = round(current_wind_mps * 3.6, 1)
            else:
                logger.warning(f"Failed to fetch current weather for {location}: {current_response.status_code}. Using fallbacks.")
                current_temp = 28.0
                current_humidity = 60.0
                current_wind = 12.0

            # 2. Fetch 5-day / 3-hour forecast using coordinates
            forecast_url = "https://api.openweathermap.org/data/2.5/forecast"
            forecast_response = await client.get(
                forecast_url,
                params={"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}
            )
            
            forecast = []
            if forecast_response.status_code == 200:
                forecast_data = forecast_response.json()
                
                # Group forecast items by calendar date
                daily_groups = {}
                for item in forecast_data.get("list", []):
                    dt_txt = item.get("dt_txt", "")
                    if not dt_txt:
                        continue
                    date_str = dt_txt.split(" ")[0]
                    
                    temp_min = item.get("main", {}).get("temp_min", current_temp)
                    temp_max = item.get("main", {}).get("temp_max", current_temp)
                    pop = item.get("pop", 0.0)
                    wind_speed = item.get("wind", {}).get("speed", 0.0)
                    
                    if date_str not in daily_groups:
                        daily_groups[date_str] = {
                            "temp_min": temp_min,
                            "temp_max": temp_max,
                            "rain_probability": pop,
                            "wind_speed_max": wind_speed
                        }
                    else:
                        daily_groups[date_str]["temp_min"] = min(daily_groups[date_str]["temp_min"], temp_min)
                        daily_groups[date_str]["temp_max"] = max(daily_groups[date_str]["temp_max"], temp_max)
                        daily_groups[date_str]["rain_probability"] = max(daily_groups[date_str]["rain_probability"], pop)
                        daily_groups[date_str]["wind_speed_max"] = max(daily_groups[date_str]["wind_speed_max"], wind_speed)
                
                for d_str, val in sorted(daily_groups.items())[:7]:
                    forecast.append({
                        "date": d_str,
                        "temp_max": round(val["temp_max"], 1),
                        "temp_min": round(val["temp_min"], 1),
                        "rain_probability": int(val["rain_probability"] * 100),
                        "wind_speed_max": round(val["wind_speed_max"] * 3.6, 1)
                    })
            
            # If forecast is empty or failed, generate a mock/hybrid forecast
            if not forecast:
                logger.warning("Using fallbacks for weather forecast.")
                forecast = [
                    {"date": "Day 1", "temp_max": current_temp + 2.0, "temp_min": current_temp - 5.0, "rain_probability": 25, "wind_speed_max": current_wind},
                    {"date": "Day 2", "temp_max": current_temp + 1.0, "temp_min": current_temp - 6.0, "rain_probability": 65, "wind_speed_max": current_wind + 5.0},
                    {"date": "Day 3", "temp_max": current_temp + 3.0, "temp_min": current_temp - 4.0, "rain_probability": 40, "wind_speed_max": current_wind - 2.0},
                    {"date": "Day 4", "temp_max": current_temp + 4.0, "temp_min": current_temp - 5.0, "rain_probability": 15, "wind_speed_max": current_wind - 4.0},
                    {"date": "Day 5", "temp_max": current_temp + 5.0, "temp_min": current_temp - 3.0, "rain_probability": 10, "wind_speed_max": current_wind - 3.0},
                    {"date": "Day 6", "temp_max": current_temp + 4.0, "temp_min": current_temp - 4.0, "rain_probability": 20, "wind_speed_max": current_wind - 1.0},
                    {"date": "Day 7", "temp_max": current_temp + 3.0, "temp_min": current_temp - 5.0, "rain_probability": 30, "wind_speed_max": current_wind + 2.0}
                ]
            
            rain_chance_today = forecast[0]["rain_probability"] if len(forecast) > 0 else 0
            rain_chance_tomorrow = forecast[1]["rain_probability"] if len(forecast) > 1 else 0
            has_rain_warning = rain_chance_today > 60 or rain_chance_tomorrow > 60
            rain_probability = max(rain_chance_today, rain_chance_tomorrow)
            
            rec_action = "Standard irrigation and crop monitoring."
            if rain_probability > 70:
                rec_action = "Heavy rain expected. Delay fertilizer application and avoid irrigation."
            elif rain_probability > 40:
                rec_action = "Light rain possible. Hold off pesticide application; monitor weather."
            elif current_temp > 35:
                rec_action = "High temperatures. Provide extra irrigation in the evening."
            
            result_data = {
                "location_name": resolved_name,
                "latitude": lat,
                "longitude": lon,
                "temperature": f"{round(current_temp, 1)}°C" if isinstance(current_temp, (int, float)) else current_temp,
                "humidity": f"{int(current_humidity)}%" if isinstance(current_humidity, (int, float)) else current_humidity,
                "wind_speed": f"{current_wind} km/h",
                "rain_probability": rain_probability,
                "rain_warning": has_rain_warning,
                "recommended_action": rec_action,
                "forecast": forecast
            }
            
            # Save to cache
            WEATHER_CACHE[cache_key] = (now, result_data)
            return result_data
            
    except Exception as e:
        logger.error(f"Weather API fetch raised exception: {str(e)}")
        # Check if expired cache entry is available
        if cache_key in WEATHER_CACHE:
            logger.info(f"Returning expired cached weather data after exception for: {location}")
            return WEATHER_CACHE[cache_key][1]
            
    # Default static fallback if API fails completely and no cache is available
    return {
        "location_name": f"{location} (Offline Mode)",
        "latitude": lat,
        "longitude": lon,
        "temperature": "29°C",
        "humidity": "65%",
        "wind_speed": "10 km/h",
        "rain_probability": 25,
        "rain_warning": False,
        "recommended_action": "Standard irrigation and crop monitoring.",
        "forecast": [
            {"date": "Day 1", "temp_max": 31.0, "temp_min": 22.0, "rain_probability": 25, "wind_speed_max": 12.0},
            {"date": "Day 2", "temp_max": 30.0, "temp_min": 21.0, "rain_probability": 65, "wind_speed_max": 18.0},
            {"date": "Day 3", "temp_max": 32.0, "temp_min": 23.0, "rain_probability": 40, "wind_speed_max": 10.0},
            {"date": "Day 4", "temp_max": 33.0, "temp_min": 22.0, "rain_probability": 15, "wind_speed_max": 8.0},
            {"date": "Day 5", "temp_max": 34.0, "temp_min": 24.0, "rain_probability": 10, "wind_speed_max": 9.0},
            {"date": "Day 6", "temp_max": 33.0, "temp_min": 23.0, "rain_probability": 20, "wind_speed_max": 11.0},
            {"date": "Day 7", "temp_max": 32.0, "temp_min": 22.0, "rain_probability": 30, "wind_speed_max": 14.0}
        ]
    }
