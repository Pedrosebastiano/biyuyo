"""
train_decision_model.py
=======================
Fase 2 — Entrenamiento del Modelo de Decisión de Biyuyo
--------------------------------------------------------
Entrena un clasificador Random Forest con los datos de expense_ml_features
y los labels de user_feedback para predecir si un gasto fue:
  1  → Buena decisión
  0  → Neutral
 -1  → Me arrepentí

Uso:
    pip install -r requirements_decision.txt
    python train_decision_model.py

Salida:
    decision_model.pkl  → Modelo entrenado serializado
    decision_model_meta.json → Métricas + metadata del modelo
"""

import os
import json
import pickle
import logging
from datetime import datetime

import numpy as np
import pandas as pd
import psycopg2
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score,
)
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import warnings
warnings.filterwarnings("ignore")

# ─── Configuración ────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# Conexión a Supabase (PostgreSQL)
DB_CONNECTION_STRING = os.getenv(
    "SUPABASE_DB_URL",
    "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres"
)

# Rutas de salida
MODEL_OUTPUT_PATH = "decision_model.pkl"
META_OUTPUT_PATH  = "decision_model_meta.json"

# Features que usa el modelo (deben coincidir con mlFeatures.js)
FEATURE_COLUMNS = [
    "amount",
    "category_necessity_score",
    "balance_at_time",
    "amount_to_balance_ratio",
    "monthly_income_avg",
    "monthly_expense_avg",
    "savings_rate",
    "upcoming_reminders_amount",
    "overdue_reminders_count",
    "reminders_to_balance_ratio",
    "day_of_month",
    "day_of_week",
    "days_to_end_of_month",
    "is_weekend",
    "times_bought_this_category",
    "avg_amount_this_category",
    "amount_vs_category_avg",
    "days_since_last_same_category",
]

LABEL_COLUMN = "label"

# ─── 1. Carga de datos ────────────────────────────────────────────────────────

def load_data_from_db() -> pd.DataFrame:
    """
    Lee expense_ml_features y filtra solo las filas con label asignado.
    Incluye la macrocategoria para poder codificarla como feature extra.
    """
    log.info("📡 Conectando a Supabase...")
    query = """
        SELECT
            f.feature_id,
            f.user_id,
            f.macrocategoria,
            f.categoria,
            f.amount,
            f.category_necessity_score,
            f.balance_at_time,
            f.amount_to_balance_ratio,
            f.monthly_income_avg,
            f.monthly_expense_avg,
            f.savings_rate,
            f.upcoming_reminders_amount,
            f.overdue_reminders_count,
            f.reminders_to_balance_ratio,
            f.day_of_month,
            f.day_of_week,
            f.days_to_end_of_month,
            f.is_weekend,
            f.times_bought_this_category,
            f.avg_amount_this_category,
            f.amount_vs_category_avg,
            f.days_since_last_same_category,
            f.label
        FROM expense_ml_features f
        WHERE f.label IS NOT NULL
        ORDER BY f.updated_at DESC
    """

    try:
        conn = psycopg2.connect(DB_CONNECTION_STRING, sslmode="require")
        df = pd.read_sql(query, conn)
        conn.close()
        log.info(f"✅ Datos cargados: {len(df)} registros con label")
        return df
    except Exception as e:
        log.error(f"❌ Error conectando a la base de datos: {e}")
        raise

# ─── 2. Preprocesamiento ──────────────────────────────────────────────────────

def preprocess(df: pd.DataFrame):
    """
    Prepara el DataFrame para entrenamiento:
    - Codifica la macrocategoria como feature numérico
    - Convierte is_weekend a int
    - Maneja valores nulos con la mediana
    - Separa X e y
    Retorna: X (features), y (labels), encoder para macrocategoria
    """
    log.info("🔧 Preprocesando datos...")

    # Codificar macrocategoria (texto → número)
    macro_encoder = LabelEncoder()
    df["macrocategoria_encoded"] = macro_encoder.fit_transform(
        df["macrocategoria"].fillna("Desconocido")
    )

    # is_weekend viene como bool desde PostgreSQL
    df["is_weekend"] = df["is_weekend"].astype(int)

    # Lista final de features (incluye la macrocategoria codificada)
    all_features = FEATURE_COLUMNS + ["macrocategoria_encoded"]

    X = df[all_features].copy()
    y = df[LABEL_COLUMN].astype(int)

    # Rellenar NaN con la mediana de cada columna
    for col in X.columns:
        if X[col].isnull().any():
            median_val = X[col].median()
            X[col] = X[col].fillna(median_val)
            log.info(f"   ⚠️  Columna '{col}': {X[col].isnull().sum()} NaN → imputados con mediana ({median_val:.2f})")

    log.info(f"   Features finales: {list(X.columns)}")
    log.info(f"   Distribución de labels: {y.value_counts().to_dict()}")

    return X, y, macro_encoder, all_features

# ─── 3. Entrenamiento ─────────────────────────────────────────────────────────

def train_model(X: pd.DataFrame, y: pd.Series):
    """
    Entrena un RandomForestClassifier con validación cruzada.
    Si hay suficientes datos, también evalúa un GradientBoosting y elige el mejor.
    """
    log.info("🤖 Entrenando modelo...")

    n_samples = len(X)
    n_classes = y.nunique()

    log.info(f"   Muestras: {n_samples} | Clases únicas: {n_classes} ({sorted(y.unique())})")

    # Validar mínimo de datos
    if n_samples < 15:
        raise ValueError(
            f"Solo hay {n_samples} muestras con feedback. "
            "Necesitas al menos 15 para entrenar el modelo."
        )

    # Split (80/20), estratificado para respetar proporciones de clases
    test_size = 0.2 if n_samples >= 30 else 0.15
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=42, stratify=y
    )

    # Definir modelos candidatos
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",   # Importante si hay desbalance de clases
        random_state=42,
        n_jobs=-1,
    )

    # Validación cruzada con 5 folds (o menos si hay pocos datos)
    n_splits = min(5, n_samples // max(n_classes, 3))
    n_splits = max(n_splits, 2)

    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    cv_scores = cross_val_score(rf_model, X_train, y_train, cv=cv, scoring="f1_weighted")

    log.info(f"   CV F1 (weighted): {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    # Entrenar con todos los datos de entrenamiento
    rf_model.fit(X_train, y_train)

    # Evaluación en test set
    y_pred = rf_model.predict(X_test)
    test_accuracy = accuracy_score(y_test, y_pred)
    test_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    log.info(f"   Test Accuracy: {test_accuracy:.3f}")
    log.info(f"   Test F1 (weighted): {test_f1:.3f}")

    # Reporte detallado
    label_names = {1: "Buena decisión", 0: "Neutral", -1: "Me arrepentí"}
    target_names = [label_names.get(c, str(c)) for c in sorted(y.unique())]
    report = classification_report(y_test, y_pred, target_names=target_names, zero_division=0)
    log.info(f"\n{report}")

    # Importancia de features
    feature_importance = dict(zip(X.columns, rf_model.feature_importances_))
    top_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)[:10]
    log.info("   🏆 Top 10 features más importantes:")
    for feat, imp in top_features:
        log.info(f"      {feat}: {imp:.4f}")

    metrics = {
        "cv_f1_mean": float(cv_scores.mean()),
        "cv_f1_std": float(cv_scores.std()),
        "test_accuracy": float(test_accuracy),
        "test_f1_weighted": float(test_f1),
        "n_train": len(X_train),
        "n_test": len(X_test),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "feature_importance": {k: float(v) for k, v in feature_importance.items()},
        "classification_report": report,
    }

    return rf_model, metrics

# ─── 4. Guardar modelo ────────────────────────────────────────────────────────

def save_model(model, macro_encoder, all_features, metrics, df):
    """
    Guarda el modelo + encoder + metadata en archivos separados.
    El .pkl contiene todo lo necesario para hacer predicciones.
    El .json contiene métricas y configuración legible por humanos.
    """
    log.info("💾 Guardando modelo...")

    # El bundle agrupa todo lo necesario para predecir
    model_bundle = {
        "model": model,
        "macro_encoder": macro_encoder,
        "feature_columns": all_features,
        "label_map": {1: "buena_decision", 0: "neutral", -1: "arrepentido"},
        "trained_at": datetime.utcnow().isoformat(),
    }

    with open(MODEL_OUTPUT_PATH, "wb") as f:
        pickle.dump(model_bundle, f)
    log.info(f"   ✅ Modelo guardado: {MODEL_OUTPUT_PATH}")

    # Metadata en JSON (legible, para monitoreo)
    meta = {
        "model_type": "RandomForestClassifier",
        "trained_at": datetime.utcnow().isoformat(),
        "n_total_samples": len(df),
        "label_distribution": df["label"].value_counts().to_dict(),
        "features": all_features,
        "metrics": metrics,
        "version": "2.0",
    }

    with open(META_OUTPUT_PATH, "w") as f:
        json.dump(meta, f, indent=2, default=str)
    log.info(f"   ✅ Metadata guardada: {META_OUTPUT_PATH}")

# ─── 5. Flujo principal ───────────────────────────────────────────────────────

def main():
    log.info("=" * 60)
    log.info("🧠 BIYUYO — Entrenamiento Modelo de Decisión v2.0")
    log.info("=" * 60)

    # 1. Cargar
    df = load_data_from_db()

    # 2. Preprocesar
    X, y, macro_encoder, all_features = preprocess(df)

    # 3. Entrenar
    model, metrics = train_model(X, y)

    # 4. Guardar
    save_model(model, macro_encoder, all_features, metrics, df)

    log.info("=" * 60)
    log.info(f"🎉 Entrenamiento completado")
    log.info(f"   Accuracy: {metrics['test_accuracy']:.1%}")
    log.info(f"   F1 Score: {metrics['test_f1_weighted']:.1%}")
    log.info("=" * 60)


if __name__ == "__main__":
    main()