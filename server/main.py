from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Any, Dict, List
from datetime import datetime
import uvicorn
import sys

# Import supabase from your db.py
try:
    from db import supabase
except ImportError as e:
    print(f"❌ CRITICAL: Could not import supabase from db.py. Error: {e}")
    sys.exit(1)

# Import the PHAROS Agents
try:
    from vulnerability_agent import run_vulnerability_analysis
    print("🔍 Vulnerability Mapping Agent (The Analyst) loaded.")
except ImportError as e:
    print(f"⚠️  WARNING: Vulnerability Agent not available. Error: {e}")
    run_vulnerability_analysis = None

try:
    from scan_agent import run_virtual_scan
    print("📡 Scan Agent (The Scout) loaded.")
except ImportError as e:
    print(f"⚠️  WARNING: Scan Agent not available. Error: {e}")
    run_virtual_scan = None

try:
    from reasoning_agent import run_reasoning_analysis
    print("🧠 Reasoning Agent (The Brain) loaded.")
except ImportError as e:
    print(f"⚠️  WARNING: Reasoning Agent not available. Error: {e}")
    run_reasoning_analysis = None

try:
    from defense_agent import execute_defense, execute_batch_defense
    print("🛡️  Defense Agent (The Enforcer) loaded.")
except ImportError as e:
    print(f"⚠️  WARNING: Defense Agent not available. Error: {e}")
    execute_defense = None
    execute_batch_defense = None

app = FastAPI(
    title="PHAROS Multi-Agent Defense API",
    description="Orchestrated Security Pipeline: Scan -> Vulnerability -> Reasoning -> Defense",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class SecurityLog(BaseModel):
    # Change these to Optional so the 422 error disappears
    source_ip: Optional[str] = "0.0.0.0"
    destination_ip: Optional[str] = "10.0.0.5"
    attack_type: Optional[str] = "General"
    threat_level: Optional[str] = "Info"
    description: Optional[str] = "No description provided"

# --- AGENT SIMULATION ENGINES ---

def scan_agent_logic(ip: str):
    """PHAROS Reconnaissance: Executes a virtual Nmap scan to identify services."""
    if run_virtual_scan:
        return run_virtual_scan(ip)
    
    # Fallback simulation
    return {"ports": [80, 443, 8080], "services": "Apache 2.4.41, OpenSSL 1.1.1"}

def vulnerability_agent_logic(scan_data: dict):
    """PHAROS Intelligence: Maps detected services to known CVEs and OWASP categories."""
    if run_vulnerability_analysis:
        return run_vulnerability_analysis(scan_data)
    
    # Fallback to simulation if import failed
    return {"cve": "CVE-2021-41773", "severity": "High", "exploit_type": "Path Traversal"}

def reasoning_agent_logic(log_payload: dict, vuln_data: dict):
    """The 'Brain' logic: Generates Thought Traces and decides mitigation."""
    if run_reasoning_analysis:
        return run_reasoning_analysis(log_payload, vuln_data)
    
    # Fallback simulation if import failed
    severity_scores = {"Critical": 9.5, "High": 8.0, "Medium": 5.0, "Low": 2.0}
    vuln_score = severity_scores.get(vuln_data.get("severity"), 4.0)
    is_actionable = vuln_score > 6.0
    
    steps = [
        {"step": 1, "text": f"Scan Agent detected active services.", "severity": "info"},
        {"step": 2, "text": f"Vulnerability Agent mapped {vuln_data.get('cve', 'N/A')} to target.", "severity": "medium"},
        {"step": 3, "text": f"Reasoning Agent evaluated Risk Score: {vuln_score}/10.0.", "severity": "high"},
        {"step": 4, "text": f"Decision: { 'IMMEDIATE MITIGATION' if is_actionable else 'CONTINUED MONITORING' } mandated.", "severity": "critical" if is_actionable else "info"}
    ]
    
    trace = " ➜ ".join([s["text"] for s in steps])
    strategy = "BLOCK" if is_actionable else "MONITOR"
    
    return {
        "thought_trace": trace,
        "exploitability_score": vuln_score,
        "is_actionable": is_actionable,
        "mitigation_strategy": strategy,
        "reasoning_steps": steps
    }

# --- ROUTES ---

@app.post("/detect", tags=["Multi-Agent Pipeline"])
def detect_and_defend(log: SecurityLog):
    """
    INGESTS -> SCANS -> MAPS -> REASONS -> DEFENDS
    This route executes the full multi-agent chain.
    """
    try:
        # 1. Trigger Scan Agent
        scan_results = scan_agent_logic(log.source_ip)
        
        # 2. Trigger Vulnerability Agent
        vuln_results = vulnerability_agent_logic(scan_results)
        
        # 3. Trigger Reasoning Agent (The Brain)
        payload_dict = log.model_dump() # Convert pydantic model to dict
        reasoning = reasoning_agent_logic(payload_dict, vuln_results)
        
        # 4. Prepare Enriched Payload for Supabase
        payload = {
            "source_ip": log.source_ip,
            "destination_ip": log.destination_ip,
            "attack_type": log.attack_type,
            "threat_level": "Critical" if reasoning["is_actionable"] else log.threat_level,
            "description": f"PHAROS Intelligence: {reasoning['mitigation_strategy']} command issued.",
            "mitigation_status": "SUCCESS" if reasoning["is_actionable"] else "LOGGED",
            "thought_trace": reasoning["thought_trace"],
            "exploitability_score": reasoning["exploitability_score"],
            "is_actionable": reasoning["is_actionable"],
            "mitigation_strategy": reasoning["mitigation_strategy"],
            "reasoning_steps": reasoning["reasoning_steps"] # JSONB column
        }

        # 5. Save to Supabase (Initial Insert to get ID)
        response = supabase.table("threat_logs").insert(payload).execute()
        
        if response.data and execute_defense and reasoning["mitigation_strategy"] == "BLOCK":
            log_id = response.data[0].get("id")
            # 6. Trigger Defense Agent (The Enforcer)
            defense_report = execute_defense(
                source_ip=log.source_ip,
                attack_type=log.attack_type,
                threat_level=payload["threat_level"],
                log_id=log_id
            )
            # Update local payload for the return object
            payload["mitigation_status"] = "Blocked"
            payload["defense_report"] = defense_report.to_dict()

        return {
            "success": True,
            "agent_chain_complete": True,
            "data": payload
        }
    except Exception as exc:
        print(f"❌ PIPELINE ERROR: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/detect")
def get_logs():
    response = supabase.table("threat_logs").select("*").order("created_at", desc=True).limit(50).execute()
    return {"data": response.data or []}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)