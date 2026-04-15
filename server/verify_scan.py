import requests
import json
import time
import sys

# Set encoding to utf-8 if possible
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_detect_pipeline(ip):
    print(f"\n--- Testing Pipeline for {ip} ---")
    payload = {
        "source_ip": ip,
        "attack_type": "SQL Injection Attempt",
        "destination_ip": "10.0.0.5",
        "threat_level": "Medium",
        "description": "Manual Test"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/detect", json=payload)
        if response.status_code == 200:
            data = response.json()
            print("[SUCCESS]")
            print(f"Mitigation Strategy: {data['data']['mitigation_strategy']}")
            print(f"Exploitability Score: {data['data']['exploitability_score']}")
            print(f"Thought Trace: {data['data']['thought_trace'][:100]}...")
            
            # Check for defense report if applicable
            if "defense_report" in data["data"]:
                print(f"[DEFENSE] Status: {data['data']['defense_report']['mitigation_status']}")
        else:
            print(f"[ERROR] {response.status_code}: {response.text}")
    except Exception as e:
        print(f"[FAILED] Connection Failed: {e}")

if __name__ == "__main__":
    # Test with different IPs to trigger different scenarios in Scan Agent
    # Scenario 1 (ip ending in .1) -> Apache 2.4.49 (Critical)
    test_detect_pipeline("192.168.1.1")
    
    time.sleep(2)
    
    # Scenario 2 (ip ending in .0) -> Apache 2.4.41 (Vulnerable but maybe not Critical in check)
    test_detect_pipeline("192.168.1.0")
