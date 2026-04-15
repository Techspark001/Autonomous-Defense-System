"""
Backfill Script: Reasoning Agent
Iterates through existing threat logs and generates Thought Traces for them.
"""

import sys
import os
from typing import List, Dict, Any

# Ensure we can import from the current directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from db import supabase
    from vulnerability_agent import run_vulnerability_analysis
    from reasoning_agent import run_reasoning_analysis
except ImportError as e:
    print(f"❌ Error importing components: {e}")
    sys.exit(1)

def backfill():
    print("Starting Reasoning Agent backfill...")
    
    # 1. Fetch all logs that don't have a thought_trace yet
    try:
        response = (
            supabase.table("threat_logs")
            .select("*")
            .is_("thought_trace", "null")
            .execute()
        )
        logs = response.data or []
        print(f"Found {len(logs)} logs to process.")
    except Exception as e:
        print(f"Error fetching logs: {e}")
        return

    if not logs:
        print("No logs require backfilling.")
        return

    completed = 0
    failed = 0

    for log in logs:
        log_id = log.get("id")
        attack_type = log.get("attack_type", "Unknown")
        source_ip = log.get("source_ip", "0.0.0.0")
        
        print(f"Processing log {str(log_id)[:8]}... ({attack_type} from {source_ip})")
        
        try:
            # A. Simulate scan data for vulnerability analysis
            scan_results = {"ports": "80, 443, 8080", "services": "Apache 2.4.41, OpenSSL 1.1.1"}
            
            # B. Vulnerability Analysis
            vuln_results = run_vulnerability_analysis(scan_results)
            
            # C. Reasoning Analysis
            reasoning = run_reasoning_analysis(log, vuln_results)
            
            # D. Update Supabase
            update_payload = {
                "thought_trace": reasoning["thought_trace"],
                "exploitability_score": reasoning["exploitability_score"],
                "is_actionable": reasoning["is_actionable"],
                "mitigation_strategy": reasoning["mitigation_strategy"],
                "reasoning_steps": reasoning["reasoning_steps"]
            }
            
            update_res = (
                supabase.table("threat_logs")
                .update(update_payload)
                .eq("id", log_id)
                .execute()
            )
            
            if update_res.data:
                completed += 1
            else:
                print(f"Warning: Update for log {log_id} returned no data.")
                failed += 1
                
        except Exception as e:
            print(f"Error processing log {log_id}: {e}")
            failed += 1

    print(f"\nBackfill Complete!")
    print(f"Successfully updated: {completed}")
    print(f"Failed: {failed}")

if __name__ == "__main__":
    backfill()
