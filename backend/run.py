import uvicorn
import os
from dotenv import load_dotenv

load_dotenv(override=True)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"Starting AgriPilot AI Backend on http://{host}:{port}...")
    is_dev = os.environ.get("ENVIRONMENT", "development").lower() == "development"
    uvicorn.run("app.main:app", host=host, port=port, reload=is_dev)
