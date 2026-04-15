import requests
import json

url = "http://127.0.0.1:8000/detect"
payload = {
    "source_ip": "192.168.1.50",
    "attack_type": "SQL Injection"
}
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
