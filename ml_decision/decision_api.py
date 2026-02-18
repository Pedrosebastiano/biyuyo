"""
decision_api.py
===============
Fase 3 — Microservicio FastAPI que sirve predicciones del modelo de decisión.

Uso:
    uvicorn decision_api:app --reload --port 8001

Endpoints:
    GET  /health            → Estado del servicio
    POST /predict-decision  → Predicción para un gasto antes de guardarlo
    POST /retrain           → Re-entrena el modelo con datos actuales de la BD
    GET  /model-info        → Métricas y metadata del modelo activo
"""

import os
import json
import pickle
import logging
import subprocess
from pathlib import Path
from datetime import datetime

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── Configuración ────────────────────────────────────────────────────────────

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

MODEL_PATH = Path("decision_model.pkl")
META_PATH  = Path("decision_model_meta.json")

app = FastAPI(
    title="Biyuyo Decision Model API",
    description="Predice si un gasto será una buena, neutral o mala decisión financiera.",
    version="2.0.0",
)

# Permitir llamadas desde el frontend / server.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Carga del modelo ─────────────────────────────────────────────────────────

def load_model():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "decision_model.pkl no encontrado. "
            "Ejecuta primero: python train_decision_model.py"
        )
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

# Carga en memoria al iniciar el servidor
try:
    MODEL_BUNDLE = load_model()
    log.info(f"✅ Modelo cargado (entrenado: {MODEL_BUNDLE['trained_at']})")
except FileNotFoundError as e:
    log.error(f"❌ {e}")
    MODEL_BUNDLE = None

# ─── Schemas ──────────────────────────────────────────────────────────────────

class PredictRequest(BaseModel):
    """
    Los mismos datos que calcula mlFeatures.js.
    El frontend/server.js los envía antes de guardar el gasto.
    """
    # Identificadores (no son features, solo para logging)
    user_id: str
    expense_id: str | None = None

    # Features del gasto
    macrocategoria: str = Field(..., description="Ej: '🧾 Alimentos y bebidas'")
    amount: float
    category_necessity_score: float

    # Contexto financiero
    balance_at_time: float
    amount_to_balance_ratio: float
    monthly_income_avg: float
    monthly_expense_avg: float
    savings_rate: float

    # Recordatorios
    upcoming_reminders_amount: float = 0.0
    overdue_reminders_count: int = 0
    reminders_to_balance_ratio: float = 0.0

    # Temporales
    day_of_month: int
    day_of_week: int
    days_to_end_of_month: int
    is_weekend: bool

    # Historial de categoría
    times_bought_this_category: int = 0
    avg_amount_this_category: float = 0.0
    amount_vs_category_avg: float = 1.0
    days_since_last_same_category: int = -1


class PredictResponse(BaseModel):
    prediction: int                  # -1, 0 ó 1
    prediction_label: str            # "buena_decision" | "neutral" | "arrepentido"
    prediction_emoji: str            # 😊 | 😐 | 😰
    confidence: float                # Probabilidad de la clase predicha (0-1)
    probabilities: dict              # {"-1": x, "0": y, "1": z}
    advice: str                      # Mensaje corto para mostrar al usuario
    model_trained_at: str


# ─── Lógica de predicción ─────────────────────────────────────────────────────

LABEL_MAP = {
    1:  {"label": "buena_decision", "emoji": "😊"},
    0:  {"label": "neutral",        "emoji": "😐"},
    -1: {"label": "arrepentido",    "emoji": "😰"},
}

ADVICE_MAP = {
    1:  "Este gasto está alineado con tus hábitos. ¡Adelante!",
    0:  "Gasto dentro de lo normal. Evalúalo antes de confirmar.",
    -1: "Cuidado: gastos similares te han generado arrepentimiento. ¿Es necesario ahora?",
}

def build_feature_vector(req: PredictRequest, bundle: dict) -> np.ndarray:
    """
    Construye el vector de features en el mismo orden que usó el entrenamiento.
    """
    model         = bundle["model"]
    macro_encoder = bundle["macro_encoder"]
    feature_cols  = bundle["feature_columns"]

    # Codificar macrocategoria (si es nueva/desconocida, usa 0)
    try:
        macro_encoded = int(macro_encoder.transform([req.macrocategoria])[0])
    except ValueError:
        log.warning(f"Macrocategoria desconocida: '{req.macrocategoria}' → usando 0")
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

    # Respetar el orden exacto con el que fue entrenado
    vector = [raw[col] for col in feature_cols]
    return np.array([vector])


# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": MODEL_BUNDLE is not None,
        "model_trained_at": MODEL_BUNDLE["trained_at"] if MODEL_BUNDLE else None,
    }


@app.post("/predict-decision", response_model=PredictResponse)
def predict_decision(req: PredictRequest):
    if MODEL_BUNDLE is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo no cargado. Ejecuta train_decision_model.py primero."
        )

    model = MODEL_BUNDLE["model"]

    # Construir vector
    X = build_feature_vector(req, MODEL_BUNDLE)

    # Predicción
    pred_class = int(model.predict(X)[0])
    proba      = model.predict_proba(X)[0]
    confidence = float(max(proba))

    # Mapear probabilidades a sus clases reales
    prob_dict = {str(int(c)): float(p) for c, p in zip(model.classes_, proba)}

    log.info(
        f"[PREDICT] user={req.user_id} | "
        f"macro={req.macrocategoria} | "
        f"amount=${req.amount} | "
        f"pred={pred_class} | conf={confidence:.2f}"
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
    """
    Re-entrena el modelo con los datos más recientes de la BD.
    Útil para llamar manualmente o via cron cuando haya suficientes datos nuevos.
    """
    log.info("🔄 Re-entrenamiento solicitado...")
    try:
        result = subprocess.run(
            ["python", "train_decision_model.py"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr)

        # Recargar el modelo en memoria
        global MODEL_BUNDLE
        MODEL_BUNDLE = load_model()

        log.info("✅ Re-entrenamiento completado y modelo recargado")
        return {
            "success": True,
            "message": "Modelo re-entrenado y recargado exitosamente",
            "trained_at": MODEL_BUNDLE["trained_at"],
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="El entrenamiento tardó demasiado (>120s)")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-info")
def model_info():
    if not META_PATH.exists():
        raise HTTPException(status_code=404, detail="decision_model_meta.json no encontrado")

    with open(META_PATH, "r") as f:
        meta = json.load(f)

    return meta