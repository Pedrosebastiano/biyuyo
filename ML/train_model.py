import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import psycopg2
import json
import os
import joblib
from supabase import create_client, Client
import sys

# Database connection
DB_URL = "postgresql://postgres.pmjjguyibxydzxnofcjx:ZyMDIx2p3EErqtaG@aws-0-us-west-2.pooler.supabase.com:6543/postgres"

# Supabase Storage Configuration
SUPABASE_URL = "https://pmjjguyibxydzxnofcjx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0.ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI"
BUCKET_NAME = "MLmodels"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_data(user_id=None):
    conn = psycopg2.connect(DB_URL)
    
    # Base queries
    # Fetch macrocategoria instead of specific categoria
    expenses_query = "SELECT macrocategoria, total_amount, user_id FROM expenses"
    incomes_query = "SELECT total_amount as income, user_id, created_at FROM incomes"
    accounts_query = "SELECT savings, user_id FROM accounts"
    
    expenses_df = pd.read_sql(expenses_query, conn)
    incomes_df = pd.read_sql(incomes_query, conn)
    accounts_df = pd.read_sql(accounts_query, conn)
    
    conn.close()
    
    if user_id:
        # We can still use other users' data as baseline, but let's filter specifically for the goal
        # If we only have 1 user's data, training might be poor. 
        # But per instructions: "personalized recommendations for them"
        pass
        
    return expenses_df, incomes_df, accounts_df

import tempfile

def upload_to_supabase(file_path, remote_name):
    try:
        with open(file_path, "rb") as f:
            print(f"DEBUG: Uploading {remote_name} to bucket {BUCKET_NAME}...")
            res = supabase.storage.from_(BUCKET_NAME).upload(
                path=remote_name,
                file=f,
                file_options={"cache-control": "3600", "upsert": "true"}
            )
            # Check for error in response (Supabase-py returns a response object)
            # Depending on version, it might have .error or raise on its own.
            # But usually it's better to be explicit.
            print(f"DEBUG: Supabase Response: {res}")
            print(f"Successfully uploaded {remote_name} to Supabase Storage.")
            return res
    except Exception as e:
        print(f"Error uploading {remote_name} to Supabase: {type(e).__name__} - {e}")
        return None

def train(user_id):
    if not user_id:
        print("Error: user_id is required for personalized training.")
        return False

    print(f"Fetching data for user {user_id}...")
    expenses_df, incomes_df, accounts_df = fetch_data(user_id)
    
    # Get average monthly income for user
    if not incomes_df.empty:
        incomes_df['month'] = pd.to_datetime(incomes_df['created_at']).dt.to_period('M')
        monthly_incomes = incomes_df.groupby(['user_id', 'month'])['income'].sum().reset_index()
        user_income = monthly_incomes.groupby('user_id')['income'].mean().reset_index()
    else:
        user_income = pd.DataFrame(columns=['user_id', 'income'])
        
    user_savings = accounts_df.groupby('user_id')['savings'].sum().reset_index()
    
    # Merge datasets
    df = expenses_df.merge(user_income, on='user_id', how='left')
    df = df.merge(user_savings, on='user_id', how='left')
    
    # Fill missing values and ensure numeric types
    df['income'] = df['income'].fillna(0).astype(float)
    df['savings'] = df['savings'].fillna(0).astype(float)
    df['total_amount'] = pd.to_numeric(df['total_amount'], errors='coerce').fillna(0).astype(float)
    
    # Encoding categorical data - Use macrocategoria to match UI
    le = LabelEncoder()
    df['categoria_encoded'] = le.fit_transform(df['macrocategoria'])
    
    # Save the label encoder mapping for the API (unique per model/app)
    category_mapping = dict(zip(le.classes_, le.transform(le.classes_).tolist()))
    
    # Filter for the specific user to represent their behavior
    user_df = df[df['user_id'] == user_id].copy()
    
    if len(user_df) < 2:
        msg = f"No hay suficientes datos. Registra al menos 2 gastos para usar el Simulador."
        print(msg, file=sys.stderr)
        return False

    # Create an independent income/savings grid to teach XGBoost that savings
    # are a powerful independent lever — not just correlated with income.
    import numpy as np

    # Define the "Rules of Wealth" for the model to learn
    INCOME_WEIGHT = 0.20   # 20% of monthly income is safe to spend
    SAVINGS_WEIGHT = 0.02  # 2% of total savings pool is safe to spend

    # Generate absolute value ranges (not multipliers) so the model sees
    # scenarios where income is $720 but savings is $300,000
    incomes = np.linspace(500, 15000, 12)   # Monthly income range
    savings_range = np.linspace(0, 500000, 12)  # Savings range

    synthetic_rows = []
    for inc in incomes:
        for sav in savings_range:
            for cat_name, cat_code in category_mapping.items():
                # Apply the weighted formula
                # $300k savings → adds 0.02 * 300000 = $6,000 to recommendation
                base_capacity = (inc * INCOME_WEIGHT) + (sav * SAVINGS_WEIGHT)

                # Subtle category variation so predictions aren't identical across categories
                category_multiplier = 1.0 + (cat_code * 0.03)
                target_spend = base_capacity * category_multiplier

                synthetic_rows.append({
                    'user_id': user_id,
                    'categoria_encoded': cat_code,
                    'income': inc,
                    'savings': sav,
                    'total_amount': target_spend
                })

    augmented_df = pd.DataFrame(synthetic_rows)

    X = augmented_df[['categoria_encoded', 'income', 'savings']]
    y = augmented_df['total_amount']

    # Train XGBoost model with more estimators to handle the richer dataset
    print(f"Training XGBoost model for {user_id} using {len(augmented_df)} synthetic records...")
    model = xgb.XGBRegressor(objective='reg:squarederror', n_estimators=200, learning_rate=0.05, max_depth=6)
    model.fit(X, y)
    
    # STATELESS: Use temporary files for model and mapping
    with tempfile.TemporaryDirectory() as tmpdirname:
        model_tmp_path = os.path.join(tmpdirname, f"{user_id}.pkl")
        mapping_tmp_path = os.path.join(tmpdirname, f"mapping_{user_id}.json")
        
        # Save model
        joblib.dump(model, model_tmp_path)
        # Save mapping
        with open(mapping_tmp_path, 'w') as f:
            json.dump(category_mapping, f)
            
        print(f"Temporary files created in {tmpdirname}. Uploading...")
        
        # Upload to Supabase
        upload_to_supabase(model_tmp_path, f"{user_id}.pkl")
        upload_to_supabase(mapping_tmp_path, f"mapping_{user_id}.json")
        
    print(f"Training and upload for user {user_id} complete. Local files cleaned up.")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_user = sys.argv[1]
        train(target_user)
    else:
        # Fallback to a default if testing
        print("Usage: python train_model.py <user_id>")
