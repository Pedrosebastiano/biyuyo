from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import json
import os
import subprocess
import joblib
from supabase import create_client, Client

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Financial Prediction API", description="API to predict expenses based on category, income, and savings per user.")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Configuration
SUPABASE_URL = "https://pmjjguyibxydzxnofcjx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI"
BUCKET_NAME = "MLmodels"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Data model for prediction input
class PredictionInput(BaseModel):
    user_id: str
    macrocategoria: str
    ingreso_mensual: float
    ahorro_actual: float

import io

def download_from_supabase(remote_name):
    try:
        print(f"DEBUG: Downloading {remote_name} from Supabase Storage...")
        res = supabase.storage.from_(BUCKET_NAME).download(remote_name)
        if res:
            print(f"DEBUG: Successfully downloaded {remote_name} ({len(res)} bytes)")
        else:
            print(f"DEBUG: Download result for {remote_name} is empty or None")
        return res
    except Exception as e:
        print(f"DEBUG: Error downloading {remote_name}: {type(e).__name__} - {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def load_resources(user_id):
    model_name = f"{user_id}.pkl"
    mapping_name = f"mapping_{user_id}.json"
    
    # Stateless: Load directly from binary
    model_bytes = download_from_supabase(model_name)
    mapping_bytes = download_from_supabase(mapping_name)
    
    if not model_bytes:
        print(f"DEBUG: Failed to get model_bytes for {user_id}")
    if not mapping_bytes:
        print(f"DEBUG: Failed to get mapping_bytes for {user_id}")
    
    if not model_bytes or not mapping_bytes:
        return None, None
            
    try:
        # Load model using BytesIO
        print(f"DEBUG: Loading joblib model for {user_id}...")
        model = joblib.load(io.BytesIO(model_bytes))
        # Load mapping from bytes
        print(f"DEBUG: Decoding mapping for {user_id}...")
        mapping = json.loads(mapping_bytes.decode('utf-8'))
        
        return model, mapping
    except Exception as e:
        print(f"DEBUG: Error loading resources in-memory for {user_id}: {e}")
        return None, None

@app.get("/")
def read_root():
    return {"message": "Financial Prediction API (Personalized) is running"}

@app.post("/predict")
def predict(data: PredictionInput):
    model, mapping = load_resources(data.user_id)
    
    if model is None or mapping is None:
        raise HTTPException(status_code=404, detail=f"Model or mapping for user '{data.user_id}' not found. Please train the model for this user first.")
    
    if data.macrocategoria not in mapping:
        # Fallback to a default or show all available
        available = ", ".join(list(mapping.keys()))
        raise HTTPException(status_code=400, detail=f"Category '{data.macrocategoria}' not recognized for this user. Available: {available}")
    
    category_encoded = mapping[data.macrocategoria]
    
    # Prepare input for prediction
    input_df = pd.DataFrame([{
        'categoria_encoded': category_encoded,
        'income': data.ingreso_mensual,
        'savings': data.ahorro_actual
    }])
    
    prediction = model.predict(input_df)[0]
    
    return {
        "user_id": data.user_id,
        "macrocategoria": data.macrocategoria,
        "prediccion_gasto": float(prediction),
        "currency": "USD"
    }

@app.post("/train/{user_id}")
def train_model(user_id: str):
    try:
        # Run the training script with user_id argument
        result = subprocess.run(['py', 'ML/train_model.py', user_id], capture_output=True, text=True)
        if result.returncode == 0:
            return {"message": f"Model for {user_id} trained successfully", "output": result.stdout}
        else:
            raise HTTPException(status_code=500, detail=f"Training failed: {result.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
