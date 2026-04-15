"""
Scan Agent (The Scout)
Persona: A specialized network reconnaissance expert.
Goal: Perform simulated port scanning and service discovery.
"""

import random
import time
from typing import List, Dict, Any

class ScanAgent:
    def __init__(self):
        self.name = "The Scout"
        self.persona = "Network Reconnaissance Expert"

    def run_virtual_scan(self, ip_address: str) -> Dict[str, Any]:
        """
        Conducts a virtual Nmap scan on the provided IP.
        Identifies open ports and specific versions of services.
        """
        print(f"📡 [The Scout] Initializing reconnaissance on {ip_address}...")
        
        # Simulate network latency
        time.sleep(1)
        
        # Deterministic but varied results based on IP
        ip_last_octet = int(ip_address.split('.')[-1]) if ip_address and '.' in ip_address else 0
        
        # Define some common service configurations
        scenarios = [
            {
                "ports": [22, 80, 443],
                "services": "SSH 7.2, Apache 2.4.41, OpenSSL 1.1.1"
            },
            {
                "ports": [80, 8080],
                "services": "Apache 2.4.49, OpenSSL 1.1.1k" # Triggers Critical CVE-2021-41773
            },
            {
                "ports": [22, 3306],
                "services": "SSH 8.0, MySQL 8.0.23"
            },
            {
                "ports": [80, 443],
                "services": "Apache 2.4.50, OpenSSL 1.1.1" # Another Critical one
            }
        ]
        
        # Pick a scenario based on IP octet to make it repeatable for demo
        scenario = scenarios[ip_last_octet % len(scenarios)]
        
        # Format the structured list for the Vulnerability Agent
        scan_report = {
            "ip": ip_address,
            "ports": scenario["ports"],
            "services": scenario["services"],
            "scan_time": time.time(),
            "status": "Success",
            "agent": self.name
        }
        
        print(f"✅ [The Scout] Scan complete. Found ports: {scenario['ports']}")
        print(f"📊 [The Scout] Service fingerprint: {scenario['services']}")
        
        return scan_report

# Singleton instance
scout = ScanAgent()

def run_virtual_scan(ip_address: str) -> Dict[str, Any]:
    """Helper function to run scan via the Scout agent."""
    return scout.run_virtual_scan(ip_address)
