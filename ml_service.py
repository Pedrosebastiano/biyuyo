import sys
import os

# Explicitly add the local python_libs to the path (Render/Cloud safety)
libs_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "python_libs")
if os.path.exists(libs_path):
    sys.path.insert(0, libs_path)

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import joblib
import pandas as pd
import numpy as np
import logging
import asyncio
import io
import json
import pickle
import psycopg2
from datetime import datetime
from contextlib import asynccontextmanager
from supabase import create_client, Client
from fastapi.middleware.cors import CORSMiddleware

# ─── Configuration ──────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ml_service")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://pmjjguyibxydzxnofcjx.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI")
ML_BUCKET    = os.getenv("ML_BUCKET", "MLmodels")
DB_URL       = os.getenv("DB_URL", "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Global state
DECISION_BUNDLE = None
IS_LOADING = False
START_TIME = datetime.now()

# ─── Schemas ────────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    user_id: str
    macrocategoria: str
    ingreso_mensual: float | None = None
    ahorro_actual: float | None = None
    monto_planeado: float | None = None

class PredictDecisionRequest(BaseModel):
    user_id: str
    expense_id: str | None = None
    macrocategoria: str
    amount: float
    category_necessity_score: float
    balance_at_time: float
    amount_to_balance_ratio: float
    monthly_income_avg: float
    monthly_expense_avg: float
    savings_rate: float
    upcoming_reminders_amount: float = 0.0
    overdue_reminders_count: int     = 0
    reminders_to_balance_ratio: float = 0.0
    day_of_month: int
    day_of_week: int
    days_to_end_of_month: int
    is_weekend: bool
    times_bought_this_category: int    = 0
    avg_amount_this_category: float    = 0.0
    amount_vs_category_avg: float      = 1.0
    days_since_last_same_category: int = -1

# ─── Helpers ────────────────────────────────────────────────────────────────

def download_from_supabase(remote_name: str) -> bytes | None:
    try:
        return supabase.storage.from_(ML_BUCKET).download(remote_name)
    except Exception as e:
        logger.error(f"Error downloading {remote_name}: {e}")
        return None

def load_user_resources(user_id: str):
    model_bytes = download_from_supabase(f"{user_id}.pkl")
    mapping_bytes = download_from_supabase(f"mapping_{user_id}.json")
    if not model_bytes or not mapping_bytes:
        return None, None
    try:
        model = joblib.load(io.BytesIO(model_bytes))
        mapping = json.loads(mapping_bytes.decode('utf-8'))
        return model, mapping
    except Exception as e:
        logger.error(f"Error loading resources for {user_id}: {e}")
        return None, None

async def load_global_models():
    global DECISION_BUNDLE, IS_LOADING
    IS_LOADING = True
    try:
        logger.info("⏳ Loading Global Decision Model...")
        raw = download_from_supabase("decision_model.pkl")
        if raw:
            DECISION_BUNDLE = pickle.load(io.BytesIO(raw))
            logger.info("✅ Decision Model loaded.")
    except Exception as e:
        logger.error(f"❌ Failed to load Decision Model: {e}")
    finally:
        IS_LOADING = False

# ─── App Logic ──────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(load_global_models())
    yield

app = FastAPI(lifespan=lifespan, title="Biyuyo Consolidated ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {
        "status": "online",
        "ready": DECISION_BUNDLE is not None,
        "decision_ready": DECISION_BUNDLE is not None,
        "is_loading": IS_LOADING,
        "uptime": (datetime.now() - START_TIME).total_seconds()
    }

# ─── Simulator (Original ML/api.py) ────────────────────────────────────────

def get_temporal_insight(user_id, cursor):
    import datetime
    today = datetime.date.today()
    day_name = today.strftime("%A")
    day_of_week = today.weekday()
    query = """
        SELECT AVG(daily_sum) FROM (
            SELECT DATE(created_at), SUM(total_amount) as daily_sum
            FROM expenses 
            WHERE user_id = %s AND EXTRACT(DOW FROM created_at) = %s
            GROUP BY DATE(created_at)
            LIMIT 4
        ) as sub
    """
    cursor.execute(query, (user_id, day_of_week))
    avg_day_spending = cursor.fetchone()[0] or 0.0
    if day_of_week == 4:
        return f"Basado en tus últimos viernes, hoy sueles gastar un promedio de ${avg_day_spending:,.2f}."
    return f"Los {day_name} sueles gastar ${avg_day_spending:,.2f}."

@app.post("/predict")
async def predict_simulator(data: PredictionInput):
    model, mapping = load_user_resources(data.user_id)
    if not model or not mapping:
        raise HTTPException(status_code=404, detail="No se encontró modelo.")
    
    if data.macrocategoria not in mapping:
        # Simplified tier logic for unknown categories (Ported from ML/api.py)
        return {"new_category": True, "macrocategoria": data.macrocategoria, "total_flow": 0, "tiers": {}}

    avg_spending = 0.0
    income = data.ingreso_mensual
    savings = data.ahorro_actual
    category_count = 0
    total_count = 0
    temporal_insight = ""

    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT AVG(total_amount) FROM expenses WHERE user_id = %s", (data.user_id,))
        avg_spending = cur.fetchone()[0] or 0.0
        cur.execute("SELECT COUNT(*) FROM expenses WHERE user_id = %s AND macrocategoria = %s", (data.user_id, data.macrocategoria))
        category_count = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM expenses WHERE user_id = %s", (data.user_id,))
        total_count = cur.fetchone()[0]
        temporal_insight = get_temporal_insight(data.user_id, cur)
        cur.close()
        conn.close()
    except:
        pass

    cat_encoded = mapping[data.macrocategoria]
    input_data = {
        'categoria_encoded': cat_encoded,
        'income': float(income or 0),
        'savings': float(savings or 0),
        'avg_spending': float(avg_spending)
    }
    
    # Matching feature order exactly
    try:
        expected_features = model.get_booster().feature_names
        features_to_use = [f for f in expected_features if f in input_data]
        input_df = pd.DataFrame([input_data])[features_to_use]
    except:
        input_df = pd.DataFrame([input_data])[['categoria_encoded', 'income', 'savings']]

    prediction = float(model.predict(input_df)[0])
    trust_score = min(40 + (category_count * 10), 98) if total_count > 0 else 30
    
    income_val = float(income or 1)
    income_ratio = (prediction / income_val * 100)
    
    return {
        "user_id": data.user_id,
        "macrocategoria": data.macrocategoria,
        "prediccion_gasto": prediction,
        "income_ratio": round(income_ratio, 1),
        "trust_score": trust_score,
        "behavioral_insight": temporal_insight,
        "currency": "USD"
    }

@app.post("/train/{user_id}")
async def train_user(user_id: str):
    sys.path.append(os.path.join(os.getcwd(), 'ML'))
    try:
        from train_model import train
        success = train(user_id)
        if success: return {"success": True}
        else: raise HTTPException(status_code=400, detail="Data insufficient")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── Decision (Original ml_decision/decision_api.py) ─────────────────────────

@app.post("/predict-decision")
async def predict_decision(req: PredictDecisionRequest):
    if not DECISION_BUNDLE:
        raise HTTPException(status_code=503, detail="Decision model loading...")
    
    model = DECISION_BUNDLE["model"]
    macro_encoder = DECISION_BUNDLE["macro_encoder"]
    feature_cols = DECISION_BUNDLE["feature_columns"]
    
    try:
        macro_encoded = int(macro_encoder.transform([req.macrocategoria])[0])
    except:
        macro_encoded = 0
        
    raw_features = {
        "amount": req.amount, "category_necessity_score": req.category_necessity_score,
        "balance_at_time": req.balance_at_time, "amount_to_balance_ratio": req.amount_to_balance_ratio,
        "monthly_income_avg": req.monthly_income_avg, "monthly_expense_avg": req.monthly_expense_avg,
        "savings_rate": req.savings_rate, "upcoming_reminders_amount": req.upcoming_reminders_amount,
        "overdue_reminders_count": req.overdue_reminders_count, "reminders_to_balance_ratio": req.reminders_to_balance_ratio,
        "day_of_month": req.day_of_month, "day_of_week": req.day_of_week,
        "days_to_end_of_month": req.days_to_end_of_month, "is_weekend": int(req.is_weekend),
        "times_bought_this_category": req.times_bought_this_category, "avg_amount_this_category": req.avg_amount_this_category,
        "amount_vs_category_avg": req.amount_vs_category_avg, "days_since_last_same_category": req.days_since_last_same_category,
        "macrocategoria_encoded": macro_encoded
    }
    
    X = np.array([[raw_features[col] for col in feature_cols]])
    pred_class = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    
    labels = {1: "buena_decision", 0: "neutral", -1: "arrepentido"}
    emojis = {1: "😊", 0: "😐", -1: "😰"}
    advices = {1: "¡Adelante!", 0: "Evalúalo.", -1: "Cuidado."}
    
    prob_dict = {str(int(c)): float(p) for c, p in zip(model.classes_, proba)}
    
    return {
        "prediction": pred_class,
        "prediction_label": labels.get(pred_class, "unknown"),
        "prediction_emoji": emojis.get(pred_class, "❓"),
        "confidence": float(max(proba)),
        "probabilities": prob_dict,
        "advice": advices.get(pred_class, ""),
        "model_trained_at": DECISION_BUNDLE.get("trained_at", "unknown")
    }

@app.get("/model-info")
async def model_info():
    raw = download_from_supabase("decision_model_meta.json")
    if not raw: raise HTTPException(status_code=404, detail="Meta not found")
    return json.loads(raw.decode("utf-8"))

@app.post("/reload-model")
async def reload_model():
    await load_global_models()
    return {"success": True}

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)))
    args = parser.parse_args()
    uvicorn.run(app, host="0.0.0.0", port=args.port)
