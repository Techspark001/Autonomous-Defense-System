"""
Reasoning Agent (The Brain)
Persona: A strategic security architect capable of complex logic and exploitability checks.
Goal: Determine if a threat is actionable and generate a "Thought Trace" for the dashboard.
"""

from typing import Dict, List, Any, Optional
import datetime

class ReasoningAgent:
    def __init__(self):
        self.name = "The Brain"
        # Strategy mapping for mitre/attack types
        self.mitigation_strategies = {
            "CRITICAL": "BLOCK",
            "HIGH": "BLOCK",
            "MEDIUM": "CHALLENGE",
            "LOW": "MONITOR",
            "INFO": "LOG"
        }

    def evaluate(self, log_payload: Dict[str, Any], vuln_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Main entry point for the Reasoning Agent.
        Evaluates the threat and returns enriched data with a Thought Trace.
        """
        attack_type = log_payload.get("attack_type", "Unknown")
        source_ip = log_payload.get("source_ip", "0.0.0.0")
        dest_ip = log_payload.get("destination_ip", "10.0.0.5")
        
        # 1. Start Reasoning Steps
        steps = []
        steps.append({
            "step": 1,
            "text": f"Analyzing {attack_type} attempt from {source_ip} targeting {dest_ip}.",
            "severity": "info"
        })

        # 2. Assess Exploitability based on Vulnerability Data
        exploit_score = self._calculate_exploit_score(vuln_data)
        
        if vuln_data and vuln_data.get("cve") != "None Detected":
            steps.append({
                "step": 2,
                "text": f"Mapped vulnerability {vuln_data.get('cve')} found on target. Exploit type: {vuln_data.get('exploit_type')}.",
                "severity": "high"
            })
            steps.append({
                "step": 3,
                "text": f"Vulnerability description: {vuln_data.get('details')}",
                "severity": "medium"
            })
        else:
            steps.append({
                "step": 2,
                "text": "No specific CVE match found for target services. Assessing based on behavior pattern.",
                "severity": "low"
            })

        # 3. Decision Logic
        is_actionable = exploit_score > 6.0 or log_payload.get("threat_level") in ["Critical", "High"]
        
        strategy = self._determine_strategy(exploit_score, log_payload.get("threat_level", "Medium"), attack_type)
        
        steps.append({
            "step": 4,
            "text": f"Calculated Exploitability Score: {exploit_score}/10.0. Actionability status: {'ARMED' if is_actionable else 'OBSERVE'}.",
            "severity": "high" if is_actionable else "medium"
        })
        
        action_text = f"Immediate {strategy} required" if is_actionable else f"Continue {strategy} and logging"
        steps.append({
            "step": 5,
            "text": f"Strategic Decision: {action_text} based on risk profile.",
            "severity": "critical" if is_actionable else "info"
        })

        # 4. Assembly
        thought_trace = " ➜ ".join([s["text"] for s in steps])
        
        return {
            "thought_trace": thought_trace,
            "exploitability_score": exploit_score,
            "is_actionable": is_actionable,
            "mitigation_strategy": strategy,
            "reasoning_steps": steps
        }

    def _calculate_exploit_score(self, vuln_data: Optional[Dict[str, Any]]) -> float:
        """Calculates a numerical exploitability score."""
        if not vuln_data:
            return 4.0
        
        severity_map = {
            "Critical": 9.5,
            "High": 8.0,
            "Medium": 5.0,
            "Low": 2.5
        }
        
        score = severity_map.get(vuln_data.get("severity"), 4.0)
        
        # Adjust based on findings count if available
        if vuln_data.get("findings_count", 0) > 1:
            score = min(10.0, score + 0.5 * vuln_data["findings_count"])
            
        return score

    def _determine_strategy(self, score: float, threat_level: str, attack_type: str) -> str:
        """Determines the best mitigation strategy."""
        threat_level = threat_level.upper()
        
        if score >= 9.0 or threat_level == "CRITICAL":
            return "BLOCK"
        if score >= 7.0 or threat_level == "HIGH":
            # For data exfiltration or malware, isolate is better
            if any(k in attack_type.upper() for k in ["MALWARE", "EXFIL", "RANSOMWARE"]):
                return "ISOLATE"
            return "BLOCK"
        if score >= 5.0 or threat_level == "MEDIUM":
            return "CHALLENGE"
        
        return "MONITOR"

# Singleton
brain = ReasoningAgent()

def run_reasoning_analysis(log_payload: Dict[str, Any], vuln_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Helper function to run the Reasoning Agent."""
    return brain.evaluate(log_payload, vuln_data)
