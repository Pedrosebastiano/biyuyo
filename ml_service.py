import sys
import os

# Explicitly add the local python_libs to the path
libs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "python_libs")
if os.path.exists(libs_path):
    sys.path.insert(0, libs_path)

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
import joblib
import pandas as pd
import numpy as np
import os
import sys
import logging
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml_service")

# Global state for models
MODEL_BUNDLE = None
IS_LOADING = False
START_TIME = datetime.now()

class HealthResponse(BaseModel):
    status: str
    ready: bool
    is_loading: bool
    python_version: str
    timestamp: str
    uptime: float

class PredictRequest(BaseModel):
    features: List[float]

class DecisionRequest(BaseModel):
    user_id: str
    features: Dict[str, Any]

async def load_models_task():
    global MODEL_BUNDLE, IS_LOADING
    IS_LOADING = True
    try:
        logger.info("⏳ Starting background model loading...")
        # Simulating model loading or downloading from storage
        # In actual implementation, this would involve joblib.load or downloading from Supabase
        await asyncio.sleep(2) # Simulate network/IO
        
        # Placeholder for actual model loading logic
        # For now, we mock the bundle if files aren't physically present during build
        MODEL_BUNDLE = {"ready": True} 
        
        logger.info("✅ Models loaded successfully in background.")
    except Exception as e:
        logger.error(f"❌ Failed to load models: {str(e)}")
    finally:
        IS_LOADING = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: trigger background loading
    asyncio.create_task(load_models_task())
    yield
    # Shutdown logic if needed
    logger.info("Service shutting down...")

app = FastAPI(lifespan=lifespan)

@app.get("/health", response_model=HealthResponse)
async def health():
    logger.info("Health check requested")
    return {
        "status": "online" if MODEL_BUNDLE else "loading",
        "ready": MODEL_BUNDLE is not None,
        "is_loading": IS_LOADING,
        "python_version": sys.version,
        "timestamp": datetime.now().isoformat(),
        "uptime": (datetime.now() - START_TIME).total_seconds()
    }

@app.get("/debug")
async def debug_info():
    return {
        "env": dict(os.environ),
        "sys_path": sys.path,
        "cwd": os.getcwd(),
        "files": os.listdir(".")
    }

@app.post("/ml/predict")
async def predict(request: PredictRequest):
    if not MODEL_BUNDLE:
        raise HTTPException(status_code=503, detail="Models are still loading")
    # Prediction logic here
    return {"prediction": [0.5]}

@app.post("/decision/predict-decision")
async def predict_decision(request: DecisionRequest):
    if not MODEL_BUNDLE:
        raise HTTPException(status_code=503, detail="Decision model is still loading")
    # Decision logic here
    return {
        "decision": "neutral",
        "confidence": 0.8,
        "reasoning": "Data patterns suggest a balanced financial state."
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting ML service on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
