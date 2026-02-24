from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import json
import os
import subprocess
import joblib
from supabase import create_client, Client
import io
import psycopg2
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Financial Prediction API", description="API to predict expenses based on category, income, and savings per user.")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
SUPABASE_URL = "https://pmjjguyibxydzxnofcjx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI"
BUCKET_NAME = "MLmodels"
DB_URL = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class PredictionInput(BaseModel):
    user_id: str
    macrocategoria: str
    ingreso_mensual: float | None = None
    ahorro_actual: float | None = None
    monto_planeado: float | None = None

def download_from_supabase(remote_name):
    try:
        res = supabase.storage.from_(BUCKET_NAME).download(remote_name)
        return res
    except Exception as e:
        print(f"DEBUG: Error downloading {remote_name}: {e}")
        return None

def load_resources(user_id):
    model_name = f"{user_id}.pkl"
    mapping_name = f"mapping_{user_id}.json"
    model_bytes = download_from_supabase(model_name)
    mapping_bytes = download_from_supabase(mapping_name)
    
    if not model_bytes or not mapping_bytes:
        return None, None
            
    try:
        model = joblib.load(io.BytesIO(model_bytes))
        mapping = json.loads(mapping_bytes.decode('utf-8'))
        return model, mapping
    except Exception as e:
        print(f"DEBUG: Error loading resources for {user_id}: {e}")
        return None, None

@app.get("/")
def read_root():
    return {"message": "Financial Prediction API is running"}

def get_temporal_insight(user_id, cursor):
    """Checks if today is a high-spending day (e.g., Friday) based on history."""
    import datetime
    today = datetime.date.today()
    day_name = today.strftime("%A")
    day_of_week = today.weekday() # 4 is Friday
    
    # Query last 4 same-day-of-week spending
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
    
    if day_of_week == 4: # Friday
        return f"Basado en tus últimos viernes, hoy sueles gastar un promedio de ${avg_day_spending:,.2f}. ¡Mantén tu presupuesto a raya!"
    elif avg_day_spending > 0:
        return f"Los {day_name} sueles gastar ${avg_day_spending:,.2f}. Tenlo en cuenta para tus planes de hoy."
    return "No tenemos suficientes datos para detectar un patrón hoy, ¡sigue registrando!"

@app.post("/predict")
def predict(data: PredictionInput):
    # Always retrain the model before prediction
    import subprocess
    try:
        result = subprocess.run(['py', 'train_model.py', data.user_id], capture_output=True, text=True)
        if result.returncode != 0:
            # If the error is about insufficient data, return a user-friendly message
            if "No hay suficientes datos" in result.stderr:
                raise HTTPException(status_code=400, detail="No hay suficientes datos para entrenar el modelo. Por favor, registra al menos 2 transacciones antes de usar el simulador de gastos.")
            else:
                raise HTTPException(status_code=500, detail=f"Error al entrenar el modelo: {result.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inesperado al entrenar el modelo: {e}")

    # Load the newly trained model
    model, mapping = load_resources(data.user_id)
    if model is None or mapping is None:
        raise HTTPException(status_code=404, detail=f"No se pudo cargar el modelo para el usuario '{data.user_id}'. Intenta registrar más transacciones y vuelve a intentarlo.")

    # Only allow predictions for categories the user has actually registered in their expenses
    try:
        conn = psycopg2.connect(DB_URL, connect_timeout=5)
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT macrocategoria FROM expenses WHERE user_id = %s", (data.user_id,))
        user_categories = set(row[0] for row in cur.fetchall())
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DEBUG: DB Fetch failed for user categories: {e}")
        user_categories = set()

    if data.macrocategoria not in user_categories:
        # Fetch income and savings from DB if not provided
        income_val = data.ingreso_mensual
        savings_val = data.ahorro_actual
        if income_val is None or savings_val is None:
            try:
                conn2 = psycopg2.connect(DB_URL, connect_timeout=5)
                cur2 = conn2.cursor()
                if income_val is None:
                    cur2.execute(
                        "SELECT SUM(total_amount) FROM incomes WHERE user_id = %s "
                        "AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())",
                        (data.user_id,)
                    )
                    income_val = cur2.fetchone()[0] or 0.0
                if savings_val is None:
                    cur2.execute(
                        "SELECT SUM(savings) FROM accounts WHERE user_id = %s",
                        (data.user_id,)
                    )
                    savings_val = cur2.fetchone()[0] or 0.0
                cur2.close()
                conn2.close()
            except Exception:
                if income_val is None: income_val = 0.0
                if savings_val is None: savings_val = 0.0

        total_flow = float(income_val) + float(savings_val)
        tiers = {
            "conservative": {
                "label": "Camino Conservador",
                "pct": 0.20,
                "amount": round(total_flow * 0.20, 2),
                "description": "Un toque ligero. Perfecto si estás priorizando el ahorro ahora mismo."
            },
            "balanced": {
                "label": "Enfoque Equilibrado",
                "pct": 0.40,
                "amount": round(total_flow * 0.40, 2),
                "description": "Nuestro 'punto ideal'. Encaja cómodamente en tu estilo de vida actual."
            },
            "aggressive": {
                "label": "Gasto Agresivo",
                "pct": 0.60,
                "amount": round(total_flow * 0.60, 2),
                "description": "¿Yendo con todo? Este es el límite superior según tu capital disponible."
            }
        }
        return {
            "new_category": True,
            "macrocategoria": data.macrocategoria,
            "total_flow": round(total_flow, 2),
            "tiers": tiers
        }

    # ...existing code for context retrieval, analytics, and prediction logic...
    avg_spending = 0.0
    income = data.ingreso_mensual
    savings = data.ahorro_actual
    category_count = 0
    total_count = 0
    current_month_expenses = 0.0
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
        cur.execute("SELECT SUM(total_amount) FROM expenses WHERE user_id = %s AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())", (data.user_id,))
        current_month_expenses = cur.fetchone()[0] or 0.0
        if income is None:
            cur.execute("SELECT SUM(total_amount) FROM incomes WHERE user_id = %s AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())", (data.user_id,))
            income = cur.fetchone()[0] or 0.0
        if savings is None:
            cur.execute("SELECT SUM(savings) FROM accounts WHERE user_id = %s", (data.user_id,))
            savings = cur.fetchone()[0] or 0.0
        temporal_insight = get_temporal_insight(data.user_id, cur)
        cur.close()
        conn.close()
    except Exception as e:
        print(f"DEBUG: DB Fetch failed: {e}")
        if income is None: income = 0.0
        if savings is None: savings = 0.0

    category_encoded = mapping[data.macrocategoria]
    input_data = {
        'categoria_encoded': category_encoded,
        'income': float(income),
        'savings': float(savings),
        'avg_spending': float(avg_spending)
    }

    try:
        expected_features = model.get_booster().feature_names
        if expected_features:
            features_to_use = [f for f in expected_features if f in input_data]
            input_df = pd.DataFrame([input_data])[features_to_use]
        else:
            input_df = pd.DataFrame([input_data])[['categoria_encoded', 'income', 'savings']]
    except Exception:
        input_df = pd.DataFrame([input_data])

    prediction = float(model.predict(input_df)[0])

    trust_score = min(40 + (category_count * 10), 98) if total_count > 0 else 30
    savings_f = float(savings)
    income_f = float(income)
    current_month_expenses_f = float(current_month_expenses)

    impact_analysis = None
    if data.monto_planeado:
        planned = float(data.monto_planeado)
        projected_balance = savings_f + income_f - current_month_expenses_f - planned
        risk_increase = 0
        if projected_balance < 0:
            risk_increase = 100
        elif projected_balance < (income_f * 0.1):
            risk_increase = 75
        elif projected_balance < (income_f * 0.3):
            risk_increase = 30
        impact_analysis = {
            "monto_planeado": planned,
            "saldo_proyectado": float(projected_balance),
            "riesgo_negativo_score": risk_increase,
            "mensaje": f"Si compras eso de ${planned:,.2f}, tu probabilidad de saldo negativo aumenta un {risk_increase}%." if risk_increase > 0 else "Esta compra parece segura para tu flujo de caja actual."
        }

    income_val = float(data.ingreso_mensual) if data.ingreso_mensual else income_f
    savings_val = float(data.ahorro_actual) if data.ahorro_actual else savings_f
    total_liquidity = income_val + savings_val

    income_ratio = (prediction / income_val * 100) if income_val > 0 else 0
    liquidity_ratio = (prediction / total_liquidity * 100) if total_liquidity > 0 else 0

    if savings_val > 0:
        impact_msg = (
            f"Representa el {income_ratio:.1f}% de tu ingreso mensual, "
            f"pero solo el {liquidity_ratio:.2f}% de tu capital total."
        )
    else:
        impact_msg = f"Representa el {income_ratio:.1f}% de tu ingreso mensual."

    return {
        "user_id": data.user_id,
        "macrocategoria": data.macrocategoria,
        "prediccion_gasto": prediction,
        "ratio_of_income": income_ratio / 100,
        "income_ratio": round(income_ratio, 1),
        "liquidity_ratio": round(liquidity_ratio, 2),
        "trust_score": trust_score,
        "impact_analysis": impact_msg,
        "behavioral_insight": temporal_insight,
        "currency": "USD"
    }

@app.post("/train/{user_id}")
def train_endpoint(user_id: str):
    try:
        result = subprocess.run(['py', 'train_model.py', user_id], capture_output=True, text=True)
        if result.returncode == 0:
            return {"message": "Success", "output": result.stdout}
        else:
            raise HTTPException(status_code=500, detail=result.stderr)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
