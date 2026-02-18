"""
verify_decision_model.py
========================
Script de verificación — carga el modelo entrenado y hace
una predicción de prueba para confirmar que funciona correctamente.

Uso:
    python verify_decision_model.py
"""

import pickle
import json
import numpy as np

MODEL_PATH = "decision_model.pkl"
META_PATH  = "decision_model_meta.json"

def main():
    print("=" * 55)
    print("🔍 Verificando modelo de decisión de Biyuyo")
    print("=" * 55)

    # ── Cargar modelo ──────────────────────────────────────
    with open(MODEL_PATH, "rb") as f:
        bundle = pickle.load(f)

    model         = bundle["model"]
    macro_encoder = bundle["macro_encoder"]
    features      = bundle["feature_columns"]
    label_map     = bundle["label_map"]
    trained_at    = bundle["trained_at"]

    print(f"\n✅ Modelo cargado (entrenado: {trained_at})")
    print(f"   Features: {len(features)}")
    print(f"   Clases:   {model.classes_}")

    # ── Cargar métricas ────────────────────────────────────
    with open(META_PATH, "r") as f:
        meta = json.load(f)

    m = meta["metrics"]
    print(f"\n📊 Métricas del modelo:")
    print(f"   Accuracy:    {m['test_accuracy']:.1%}")
    print(f"   F1 Score:    {m['test_f1_weighted']:.1%}")
    print(f"   CV F1 Media: {m['cv_f1_mean']:.1%} ± {m['cv_f1_std']:.1%}")
    print(f"   Train / Test: {m['n_train']} / {m['n_test']} muestras")

    # ── Predicción de prueba ───────────────────────────────
    print("\n🧪 Predicción de prueba (gasto de supermercado, balance saludable):")

    # Simular un gasto "normal" en Alimentos con balance cómodo
    macro_cat = "🧾 Alimentos y bebidas"
    try:
        macro_encoded = macro_encoder.transform([macro_cat])[0]
    except ValueError:
        # Si la categoría no estaba en el entrenamiento, usar la primera disponible
        macro_encoded = 0
        print(f"   ⚠️  Macrocategoría no vista en entrenamiento → usando código 0")

    sample = {
        "amount": 45.0,
        "category_necessity_score": 100,
        "balance_at_time": 800.0,
        "amount_to_balance_ratio": 0.056,
        "monthly_income_avg": 1200.0,
        "monthly_expense_avg": 700.0,
        "savings_rate": 0.417,
        "upcoming_reminders_amount": 150.0,
        "overdue_reminders_count": 0,
        "reminders_to_balance_ratio": 0.187,
        "day_of_month": 15,
        "day_of_week": 2,
        "days_to_end_of_month": 16,
        "is_weekend": 0,
        "times_bought_this_category": 12,
        "avg_amount_this_category": 40.0,
        "amount_vs_category_avg": 1.125,
        "days_since_last_same_category": 7,
        "macrocategoria_encoded": macro_encoded,
    }

    X_sample = np.array([[sample[f] for f in features]])
    pred = model.predict(X_sample)[0]
    proba = model.predict_proba(X_sample)[0]

    label_names = {1: "😊 Buena decisión", 0: "😐 Neutral", -1: "😰 Me arrepentí"}
    print(f"   Predicción: {label_names.get(pred, str(pred))}")
    print(f"   Probabilidades por clase:")
    for cls, prob in zip(model.classes_, proba):
        print(f"      {label_names.get(cls, str(cls))}: {prob:.1%}")

    # ── Top features ───────────────────────────────────────
    fi = meta["metrics"]["feature_importance"]
    top = sorted(fi.items(), key=lambda x: x[1], reverse=True)[:5]
    print(f"\n🏆 Top 5 features más importantes:")
    for feat, imp in top:
        bar = "█" * int(imp * 50)
        print(f"   {feat:<35} {imp:.4f} {bar}")

    print("\n✅ Verificación completada. El modelo está listo para la Fase 3.")
    print("=" * 55)


if __name__ == "__main__":
    main()