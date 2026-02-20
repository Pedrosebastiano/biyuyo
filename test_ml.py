import urllib.request
import json

def test_api(income, savings):
    url = 'http://localhost:8000/predict'
    data = {'user_id': '7fca39e4-44c8-4ae4-b964-c8418ce2d9aa', 'macrocategoria': '🧾 Alimentos y bebidas', 'ingreso_mensual': income, 'ahorro_actual': savings}
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers={'Content-Type': 'application/json'})
    try:
        response = urllib.request.urlopen(req)
        d = json.loads(response.read().decode())
        print(f'Income: {income}, Savings: {savings} -> Prediccion: {d.get("prediccion_gasto")}, Ratio: {d.get("ratio_of_income")}')
    except Exception as e:
        print(f'Error -> {e}')

test_api(1000, 0)
test_api(1500, 0)
test_api(2000, 0)
test_api(4000, 0)
