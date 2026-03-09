"""
ml_service.py  —  Consolidated Biyuyo ML API
==========================================
Combines Financial Prediction (Simulador) and Decision Model APIs.
Reduces memory footprint on Render.
"""

import sys
import os
import io
import json
import pickle
import logging
import datetime
import asyncio
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
import xgboost as xgb
import joblib
import psycopg2
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client

# --- Path Optimization ---
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON_LIBS = os.path.join(SCRIPT_DIR, 'python_libs')
if os.path.exists(PYTHON_LIBS):
    sys.path.insert(0, PYTHON_LIBS)

# --- Logging ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# --- Configuration ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://pmjjguyibxydzxnofcjx.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI"
ML_BUCKET    = os.getenv("ML_BUCKET", "MLmodels")
DB_URL       = os.getenv("DATABASE_URL") or "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
MODEL_BUNDLE = None # Global for Decision Model

# --- LIFESPAN (Non-blocking) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global MODEL_BUNDLE
    log.info("🚀 Consolidated ML Service starting...")
    
    # Initialize background model loading
    async def load_models_bg():
        global MODEL_BUNDLE
        log.info("📡 [BG] Iniciando carga de modelos desde Supabase...")
        try:
            res = load_decision_model_bundle()
            MODEL_BUNDLE = res
            if MODEL_BUNDLE:
                log.info("✅ [BG] Modelo de decisión cargado con éxito.")
            else:
                log.error("❌ [BG] No se pudo cargar el modelo de decisión.")
        except Exception as e:
            log.error(f"💥 [BG] Error crítico cargando modelos: {e}")

    asyncio.create_task(load_models_bg())
    yield
    log.info("🛑 Consolidated ML Service shutting down.")

app = FastAPI(title="Biyuyo Consolidated ML API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# --- SHARED HELPERS ---
def download_bytes(remote_name: str) -> bytes | None:
    try:
        data = supabase.storage.from_(ML_BUCKET).download(remote_name)
        return data
    except Exception as e:
        log.error(f"❌ Error downloading {remote_name}: {e}")
        return None

# --- DECISION MODEL LOGIC ---
DECISION_MODEL_REMOTE = "decision_model.pkl"
DECISION_META_REMOTE  = "decision_model_meta.json"

def load_decision_model_bundle():
    raw = download_bytes(DECISION_MODEL_REMOTE)
    if not raw: return None
    try:
        bundle = pickle.load(io.BytesIO(raw))
        log.info(f"✅ Decision Model loaded (trained: {bundle.get('trained_at', '?')})")
        return bundle
    except Exception as e:
        log.error(f"❌ Error deserializing decision model: {e}")
        return None

class DecisionPredictRequest(BaseModel):
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

LABEL_MAP = { 1: {"label": "buena_decision", "emoji": "😊"}, 0: {"label": "neutral", "emoji": "😐"}, -1: {"label": "arrepentido", "emoji": "😰"} }
ADVICE_MAP = { 1: "Este gasto está alineado con tus hábitos. ¡Adelante!", 0: "Gasto dentro de lo normal. Evalúalo antes de confirmar.", -1: "Cuidado: gastos similares te han generado arrepentimiento. ¿Es necesario ahora?" }

def build_decision_feature_vector(req: DecisionPredictRequest, bundle: dict) -> np.ndarray:
    macro_encoder = bundle["macro_encoder"]
    feature_cols  = bundle["feature_columns"]
    try:
        macro_encoded = int(macro_encoder.transform([req.macrocategoria])[0])
    except:
        macro_encoded = 0
    raw = {
        "amount": req.amount, "category_necessity_score": req.category_necessity_score, "balance_at_time": req.balance_at_time,
        "amount_to_balance_ratio": req.amount_to_balance_ratio, "monthly_income_avg": req.monthly_income_avg, "monthly_expense_avg": req.monthly_expense_avg,
        "savings_rate": req.savings_rate, "upcoming_reminders_amount": req.upcoming_reminders_amount, "overdue_reminders_count": req.overdue_reminders_count,
        "reminders_to_balance_ratio": req.reminders_to_balance_ratio, "day_of_month": req.day_of_month, "day_of_week": req.day_of_week,
        "days_to_end_of_month": req.days_to_end_of_month, "is_weekend": int(req.is_weekend), "times_bought_this_category": req.times_bought_this_category,
        "avg_amount_this_category": req.avg_amount_this_category, "amount_vs_category_avg": req.amount_vs_category_avg,
        "days_since_last_same_category": req.days_since_last_same_category, "macrocategoria_encoded": macro_encoded,
    }
    return np.array([[raw[col] for col in feature_cols]])

# --- SIMULADOR MODEL LOGIC ---
class SimuladorInput(BaseModel):
    user_id: str
    macrocategoria: str
    ingreso_mensual: float | None = None
    ahorro_actual: float | None = None
    monto_planeado: float | None = None

def get_temporal_insight(user_id, cursor):
    today = datetime.date.today()
    day_of_week = today.weekday()
    query = "SELECT AVG(daily_sum) FROM (SELECT DATE(created_at), SUM(total_amount) as daily_sum FROM expenses WHERE user_id = %s AND EXTRACT(DOW FROM created_at) = %s GROUP BY DATE(created_at) LIMIT 4) as sub"
    cursor.execute(query, (user_id, day_of_week))
    avg_day_spending = cursor.fetchone()[0] or 0.0
    day_name = today.strftime("%A")
    if avg_day_spending > 0:
        return f"Los {day_name} sueles gastar ${avg_day_spending:,.2f}. Tenlo en cuenta."
    return "Sigue registrando para detectar patrones."

# --- ENDPOINTS ---

@app.get("/health")
def health():
    log.info("📢 Health check request received")
    return {
        "status": "ok", 
        "service": "consolidated", 
        "decision_model_loaded": MODEL_BUNDLE is not None,
        "python_version": sys.version,
        "startup_time": datetime.datetime.now().isoformat()
    }

@app.get("/debug")
def debug_info():
    import importlib.metadata
    packages = ["fastapi", "uvicorn", "xgboost", "pandas", "scikit-learn", "psycopg2-binary", "supabase"]
    installed = {}
    for p in packages:
        try:
            installed[p] = importlib.metadata.version(p)
        except importlib.metadata.PackageNotFoundError:
            installed[p] = "NOT_FOUND"

    return {
        "sys_path": sys.path,
        "cwd": os.getcwd(),
        "python_libs_exists": os.path.exists(PYTHON_LIBS),
        "installed_packages": installed,
        "env_vars_present": {
            "SUPABASE_URL": bool(os.getenv("SUPABASE_URL")),
            "SUPABASE_KEY": bool(os.getenv("SUPABASE_KEY")),
            "DATABASE_URL": bool(os.getenv("DATABASE_URL"))
        }
    }

# Decision Model Routes
@app.post("/decision/predict-decision")
def predict_decision(req: DecisionPredictRequest):
    if MODEL_BUNDLE is None:
        raise HTTPException(status_code=503, detail="Decision model not loaded")
    model = MODEL_BUNDLE["model"]
    X = build_decision_feature_vector(req, MODEL_BUNDLE)
    pred_class = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    prob_dict = {str(int(c)): float(p) for c, p in zip(model.classes_, proba)}
    return {
        "prediction": pred_class, "prediction_label": LABEL_MAP[pred_class]["label"], "prediction_emoji": LABEL_MAP[pred_class]["emoji"],
        "confidence": float(max(proba)), "probabilities": prob_dict, "advice": ADVICE_MAP[pred_class], "model_trained_at": MODEL_BUNDLE["trained_at"]
    }

@app.post("/decision/retrain")
def retrain_decision():
    sys.path.append(os.path.join(SCRIPT_DIR, 'ml_decision'))
    from train_decision_model import main as train_main
    try:
        train_main()
        global MODEL_BUNDLE
        MODEL_BUNDLE = load_decision_model_bundle()
        return {"success": True, "trained_at": MODEL_BUNDLE["trained_at"] if MODEL_BUNDLE else None}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

@app.get("/decision/model-info")
def decision_model_info():
    raw = download_bytes(DECISION_META_REMOTE)
    if not raw: raise HTTPException(status_code=404, detail="Meta not found")
    return json.loads(raw.decode("utf-8"))

# Simulador Model Routes
@app.post("/predict")
def predict_simulador(data: SimuladorInput):
    model_name = f"{data.user_id}.pkl"
    mapping_name = f"mapping_{data.user_id}.json"
    model_bytes = download_bytes(model_name)
    mapping_bytes = download_bytes(mapping_name)
    
    if not model_bytes or not mapping_bytes:
         raise HTTPException(status_code=404, detail="Model not found for user. Please train first.")
    
    model = joblib.load(io.BytesIO(model_bytes))
    mapping = json.loads(mapping_bytes.decode('utf-8'))

    # Simplified DB logic for briefness, focusing on structural consolidation
    income = data.ingreso_mensual
    savings = data.ahorro_actual
    avg_spending = 0.0
    temporal_insight = ""
    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=5)
        cur = conn.cursor()
        if income is None:
            cur.execute("SELECT SUM(total_amount) FROM incomes WHERE user_id = %s AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())", (data.user_id,))
            income = cur.fetchone()[0] or 0.0
        if savings is None:
            cur.execute("SELECT SUM(savings) FROM accounts WHERE user_id = %s", (data.user_id,))
            savings = cur.fetchone()[0] or 0.0
        cur.execute("SELECT AVG(total_amount) FROM expenses WHERE user_id = %s", (data.user_id,))
        avg_spending = cur.fetchone()[0] or 0.0
        temporal_insight = get_temporal_insight(data.user_id, cur)
        cur.close()
        conn.close()
    except: pass

    if data.macrocategoria not in mapping:
        return {"new_category": True, "macrocategoria": data.macrocategoria, "total_flow": float(income or 0) + float(savings or 0)}

    category_encoded = mapping[data.macrocategoria]
    input_data = {'categoria_encoded': category_encoded, 'income': float(income or 0), 'savings': float(savings or 0), 'avg_spending': float(avg_spending)}
    
    # Adapt to XGBoost feature names if present
    try:
        expected = model.get_booster().feature_names
        input_df = pd.DataFrame([input_data])[expected] if expected else pd.DataFrame([input_data])[['categoria_encoded', 'income', 'savings']]
    except:
        input_df = pd.DataFrame([input_data])
    
    prediction = float(model.predict(input_df)[0])
    return {"user_id": data.user_id, "prediccion_gasto": prediction, "behavioral_insight": temporal_insight}

@app.post("/train/{user_id}")
def train_simulador(user_id: str):
    sys.path.append(os.path.join(SCRIPT_DIR, 'ML'))
    from train_model import train
    try:
        if train(user_id): return {"message": "Success"}
        else: raise HTTPException(status_code=400, detail="Insufficient data")
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
