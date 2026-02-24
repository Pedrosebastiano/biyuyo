"""
decision_api.py  —  Biyuyo ML Decision API (Cloud / Render)
============================================================
Carga el modelo RandomForest desde Supabase Storage.
Sin dependencia de archivos locales → funciona en Render (efímero).

Endpoints:
    GET  /health
    POST /predict-decision
    POST /retrain
    POST /reload-model
    GET  /model-info
"""

import sys
import os

# Path optimization for Render - MUST BE AT THE TOP
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PYTHON_LIBS = os.path.join(PROJECT_ROOT, 'python_libs')

if os.path.exists(PYTHON_LIBS):
    sys.path.insert(0, PYTHON_LIBS)
    print(f"🐍 DEBUG: Added {PYTHON_LIBS} to sys.path")
else:
    print(f"🐍 DEBUG: {PYTHON_LIBS} does NOT exist!")

import io
import json
import pickle
import logging
from datetime import datetime

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# ─── Supabase ─────────────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://pmjjguyibxydzxnofcjx.supabase.co",
)
# Usar variable de entorno si existe, de lo contrario usar el fallback
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI"
ML_BUCKET    = os.getenv("ML_BUCKET", "MLmodels")

MODEL_REMOTE = "decision_model.pkl"
META_REMOTE  = "decision_model_meta.json"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Biyuyo Decision Model API",
    description="Predice si un gasto será buena, neutral o mala decisión financiera.",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # restringir al dominio de Vercel en producción
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Supabase Storage helpers ─────────────────────────────────────────────────

def download_bytes(remote_name: str) -> bytes | None:
    try:
        data = supabase.storage.from_(ML_BUCKET).download(remote_name)
        log.info(f"✅ Descargado {remote_name} ({len(data):,} bytes)")
        return data
    except Exception as e:
        log.error(f"❌ Error descargando {remote_name}: {e}")
        return None


def upload_bytes(data: bytes, remote_name: str) -> bool:
    try:
        supabase.storage.from_(ML_BUCKET).upload(
            path=remote_name,
            file=data,
            file_options={"cache-control": "3600", "upsert": "true"},
        )
        log.info(f"✅ Subido {remote_name} ({len(data):,} bytes)")
        return True
    except Exception as e:
        log.error(f"❌ Error subiendo {remote_name}: {e}")
        return False


def load_model_bundle() -> dict | None:
    raw = download_bytes(MODEL_REMOTE)
    if not raw:
        return None
    try:
        bundle = pickle.load(io.BytesIO(raw))
        log.info(f"✅ Modelo en memoria (entrenado: {bundle.get('trained_at', '?')})")
        return bundle
    except Exception as e:
        log.error(f"❌ Error deserializando modelo: {e}")
        return None


def load_meta() -> dict | None:
    raw = download_bytes(META_REMOTE)
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception as e:
        log.error(f"❌ Error leyendo metadata: {e}")
        return None


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    global MODEL_BUNDLE
    log.info("🚀 Servidor iniciando (lifespan) — cargando modelo desde Supabase Storage…")
    MODEL_BUNDLE = load_model_bundle()
    if MODEL_BUNDLE is None:
        log.warning(
            "⚠️  Modelo no encontrado. "
            "Ejecuta upload_model_to_supabase.py o llama a POST /retrain."
        )
    yield
    # Lógica de cierre si fuera necesaria
    log.info("🛑 Servidor cerrándose (lifespan)...")

app = FastAPI(
    title="Biyuyo ML Decision API",
    description="Microservicio para evaluar si un gasto es una buena decisión.",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # restringir al dominio de Vercel en producción
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Schemas ──────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    user_id: str
    expense_id: str | None = None

    macrocategoria: str          = Field(..., description="Ej: '🧾 Alimentos y bebidas'")
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


class PredictResponse(BaseModel):
    prediction: int
    prediction_label: str
    prediction_emoji: str
    confidence: float
    probabilities: dict
    advice: str
    model_trained_at: str


# ─── Mapas ────────────────────────────────────────────────────────────────────
LABEL_MAP = {
     1: {"label": "buena_decision", "emoji": "😊"},
     0: {"label": "neutral",        "emoji": "😐"},
    -1: {"label": "arrepentido",    "emoji": "😰"},
}

ADVICE_MAP = {
     1: "Este gasto está alineado con tus hábitos. ¡Adelante!",
     0: "Gasto dentro de lo normal. Evalúalo antes de confirmar.",
    -1: "Cuidado: gastos similares te han generado arrepentimiento. ¿Es necesario ahora?",
}


# ─── Feature builder ─────────────────────────────────────────────────────────

def build_feature_vector(req: PredictRequest, bundle: dict) -> np.ndarray:
    macro_encoder = bundle["macro_encoder"]
    feature_cols  = bundle["feature_columns"]

    try:
        macro_encoded = int(macro_encoder.transform([req.macrocategoria])[0])
    except ValueError:
        log.warning(f"Macrocategoría desconocida: '{req.macrocategoria}' → usando 0")
        macro_encoded = 0

    raw = {
        "amount":                        req.amount,
        "category_necessity_score":      req.category_necessity_score,
        "balance_at_time":               req.balance_at_time,
        "amount_to_balance_ratio":       req.amount_to_balance_ratio,
        "monthly_income_avg":            req.monthly_income_avg,
        "monthly_expense_avg":           req.monthly_expense_avg,
        "savings_rate":                  req.savings_rate,
        "upcoming_reminders_amount":     req.upcoming_reminders_amount,
        "overdue_reminders_count":       req.overdue_reminders_count,
        "reminders_to_balance_ratio":    req.reminders_to_balance_ratio,
        "day_of_month":                  req.day_of_month,
        "day_of_week":                   req.day_of_week,
        "days_to_end_of_month":          req.days_to_end_of_month,
        "is_weekend":                    int(req.is_weekend),
        "times_bought_this_category":    req.times_bought_this_category,
        "avg_amount_this_category":      req.avg_amount_this_category,
        "amount_vs_category_avg":        req.amount_vs_category_avg,
        "days_since_last_same_category": req.days_since_last_same_category,
        "macrocategoria_encoded":        macro_encoded,
    }

    return np.array([[raw[col] for col in feature_cols]])


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "Decision API is running"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL_BUNDLE is not None,
        "model_trained_at": MODEL_BUNDLE["trained_at"] if MODEL_BUNDLE else None,
        "supabase_bucket": ML_BUCKET,
    }


@app.post("/predict-decision", response_model=PredictResponse)
def predict_decision(req: PredictRequest):
    if MODEL_BUNDLE is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo no cargado. Llama a POST /retrain o sube el modelo manualmente.",
        )

    model = MODEL_BUNDLE["model"]
    X     = build_feature_vector(req, MODEL_BUNDLE)

    pred_class = int(model.predict(X)[0])
    proba      = model.predict_proba(X)[0]
    confidence = float(max(proba))
    prob_dict  = {str(int(c)): float(p) for c, p in zip(model.classes_, proba)}

    log.info(
        f"[PREDICT] user={req.user_id} | {req.macrocategoria} | "
        f"${req.amount} | pred={pred_class} | conf={confidence:.2f}"
    )

    return PredictResponse(
        prediction=pred_class,
        prediction_label=LABEL_MAP[pred_class]["label"],
        prediction_emoji=LABEL_MAP[pred_class]["emoji"],
        confidence=confidence,
        probabilities=prob_dict,
        advice=ADVICE_MAP[pred_class],
        model_trained_at=MODEL_BUNDLE["trained_at"],
    )


@app.post("/retrain")
def retrain():
    """Re-entrena el modelo desde Supabase DB y sube el resultado a Supabase Storage."""
    log.info("🔄 Re-entrenamiento solicitado…")
    from train_decision_model import main as train_model_main
    try:
        train_model_main()

        global MODEL_BUNDLE
        MODEL_BUNDLE = load_model_bundle()
        if MODEL_BUNDLE is None:
            raise RuntimeError("Entrenamiento ok pero modelo no pudo recargarse.")

        log.info("✅ Re-entrenamiento completado y modelo recargado")
        return {"success": True, "trained_at": MODEL_BUNDLE["trained_at"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/reload-model")
def reload_model():
    """Recarga el modelo desde Supabase Storage sin re-entrenar."""
    global MODEL_BUNDLE
    MODEL_BUNDLE = load_model_bundle()
    if MODEL_BUNDLE is None:
        raise HTTPException(status_code=503, detail="No se pudo recargar el modelo.")
    return {"success": True, "trained_at": MODEL_BUNDLE["trained_at"]}


@app.get("/model-info")
def model_info():
    meta = load_meta()
    if meta is None:
        raise HTTPException(status_code=404, detail="Metadata no encontrada en Supabase.")
    return meta


if __name__ == "__main__":
    import uvicorn
    # Use fixed local port so it doesn't conflict with server.js's Render assigned PORT
    uvicorn.run(app, host="0.0.0.0", port=8001)