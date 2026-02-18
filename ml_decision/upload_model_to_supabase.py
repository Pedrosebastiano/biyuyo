"""
upload_model_to_supabase.py
===========================
Script de migración ONE-TIME.

Toma los archivos locales:
    decision_model.pkl
    decision_model_meta.json

...y los sube al bucket MLmodels en Supabase Storage.

Ejecución (desde la carpeta ml_decision/ de tu proyecto):
    python upload_model_to_supabase.py

Requisito:
    pip install supabase
"""

import os
from supabase import create_client

# ─── Configuración ────────────────────────────────────────────────────────────
SUPABASE_URL = "https://pmjjguyibxydzxnofcjx.supabase.co"
SUPABASE_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtampndXlpYnh5ZHp4bm9mY2p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODE2NTAsImV4cCI6MjA4NTY1NzY1MH0."
    "ZYTzwvzdcjgiiJHollA7vyNZ7ZF8hIN1NuTOq5TdtjI"
)
BUCKET = "MLmodels"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pares (archivo_local, nombre_en_supabase)
FILES = [
    ("decision_model.pkl",       "decision_model.pkl"),
    ("decision_model_meta.json", "decision_model_meta.json"),
]

# ─── Lógica de subida ─────────────────────────────────────────────────────────
def upload(local_path: str, remote_name: str) -> bool:
    if not os.path.exists(local_path):
        print(f"⚠️  No encontrado localmente: {local_path}  (¿estás en la carpeta correcta?)")
        return False

    with open(local_path, "rb") as f:
        data = f.read()

    try:
        supabase.storage.from_(BUCKET).upload(
            path=remote_name,
            file=data,
            file_options={"cache-control": "3600", "upsert": "true"},
        )
        kb = len(data) / 1024
        print(f"✅  {local_path}  →  {BUCKET}/{remote_name}  ({kb:,.1f} KB)")
        return True
    except Exception as e:
        print(f"❌  Error subiendo {remote_name}: {e}")
        return False


if __name__ == "__main__":
    print("=" * 55)
    print("🚀  Biyuyo — Migración modelo → Supabase Storage")
    print("=" * 55)

    ok = all(upload(local, remote) for local, remote in FILES)

    print("=" * 55)
    if ok:
        print("🎉  Listo. Ahora puedes continuar con el Paso 2 (deploy en Render).")
    else:
        print("⚠️  Algunos archivos no se subieron. Revisa los errores arriba.")