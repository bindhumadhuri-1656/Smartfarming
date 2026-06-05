import httpx
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

async def fetch_coordinates(location: str) -> Optional[Dict[str, float]]:
    """Fetches latitude and longitude for a given location name using Open-Meteo Geocoding API."""
    url = f"https://geocoding-api.open-meteo.com/v1/search?name={location}&count=1&language=en&format=json"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 200:
                data = response.json()
                results = data.get("results")
                if results and len(results) > 0:
                    first_match = results[0]
                    return {
                        "lat": float(first_match["latitude"]),
                        "lon": float(first_match["longitude"]),
                        "name": first_match.get("name", location),
                        "country": first_match.get("country", "")
                    }
    except Exception as e:
        logger.error(f"Geocoding failed for {location}: {str(e)}")
    return None

async def get_weather_data(location: str) -> Dict[str, Any]:
    """Retrieves 7-day weather forecast from Open-Meteo API using geocoded coordinates."""
    # Default coordinates (Hyderabad) if geocoding fails
    lat, lon = 17.3850, 78.4867
    resolved_name = "Hyderabad"
    
    geo_data = await fetch_coordinates(location)
    if geo_data:
        lat = geo_data["lat"]
        lon = geo_data["lon"]
        resolved_name = f"{geo_data['name']}, {geo_data['country']}" if geo_data.get("country") else geo_data["name"]
    else:
        logger.warning(f"Using default coordinates for {location} (Hyderabad).")
        resolved_name = f"{location} (Using Default Location)"

    # Query Open-Meteo API
    weather_url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,wind_speed_10m"
        f"&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max"
        f"&timezone=auto"
    )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(weather_url)
            if response.status_code == 200:
                w_data = response.json()
                current = w_data.get("current", {})
                daily = w_data.get("daily", {})
                
                # Format current data
                current_temp = current.get("temperature_2m", 28.0)
                current_humidity = current.get("relative_humidity_2m", 60.0)
                current_wind = current.get("wind_speed_10m", 12.0)
                
                # Forecast formatting (7 days)
                forecast = []
                days = daily.get("time", [])
                temp_max = daily.get("temperature_2m_max", [])
                temp_min = daily.get("temperature_2m_min", [])
                rain_prob = daily.get("precipitation_probability_max", [])
                wind_max = daily.get("wind_speed_10m_max", [])
                
                for idx in range(min(7, len(days))):
                    forecast.append({
                        "date": days[idx],
                        "temp_max": temp_max[idx] if idx < len(temp_max) else 30.0,
                        "temp_min": temp_min[idx] if idx < len(temp_min) else 20.0,
                        "rain_probability": rain_prob[idx] if idx < len(rain_prob) else 10,
                        "wind_speed_max": wind_max[idx] if idx < len(wind_max) else 15.0
                    })
                
                # Check for rain warning in the next 2 days
                rain_chance_tomorrow = forecast[1]["rain_probability"] if len(forecast) > 1 else 0
                rain_chance_today = forecast[0]["rain_probability"] if len(forecast) > 0 else 0
                has_rain_warning = rain_chance_tomorrow > 60 or rain_chance_today > 60
                
                # Build simple indicators for UI
                rain_probability = max(rain_chance_today, rain_chance_tomorrow)
                
                # Recommended action rules
                rec_action = "Standard irrigation and crop monitoring."
                if rain_probability > 70:
                    rec_action = "Heavy rain expected. Delay fertilizer application and avoid irrigation."
                elif rain_probability > 40:
                    rec_action = "Light rain possible. Hold off pesticide application; monitor weather."
                elif current_temp > 35:
                    rec_action = "High temperatures. Provide extra irrigation in the evening."
                
                return {
                    "location_name": resolved_name,
                    "latitude": lat,
                    "longitude": lon,
                    "temperature": f"{current_temp}°C",
                    "humidity": f"{current_humidity}%",
                    "wind_speed": f"{current_wind} km/h",
                    "rain_probability": rain_probability,
                    "rain_warning": has_rain_warning,
                    "recommended_action": rec_action,
                    "forecast": forecast
                }
    except Exception as e:
        logger.error(f"Weather API fetch failed: {str(e)}")
        
    # Standard static fallback if api fails
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
