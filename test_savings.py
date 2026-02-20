import urllib.request
import json

def test_api(income, savings):
    url = 'http://localhost:8000/predict'
    data = {'user_id': '7fca39e4-44c8-4ae4-b964-c8418ce2d9aa', 'macrocategoria': '🧾 Alimentos y bebidas', 'ingreso_mensual': income, 'ahorro_actual': savings}
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        d = json.loads(response.read().decode())
        print(f'Income: {income:>6}, Savings: {savings:>8} -> ${d.get("prediccion_gasto"):>10.2f}  | {d.get("impact_analysis")}')
    except Exception as e:
        print(f'Error -> {e}')

print("=== Fixed Income, Varying Savings ===")
test_api(720, 0)
test_api(720, 50000)
test_api(720, 300000)

print("\n=== Fixed Savings, Varying Income ===")
test_api(500, 100000)
test_api(2000, 100000)
test_api(5000, 100000)
