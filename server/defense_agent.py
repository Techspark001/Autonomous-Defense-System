"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  DEFENSE AGENT  ·  "The Enforcer"                                          ║
║  Rapid-response system engineer focused on automated mitigation.           ║
║                                                                            ║
║  Input  → Mitigation strategy from the Reasoning Agent                     ║
║  Output → Block simulation, Supabase status update, summary report         ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

from __future__ import annotations

import json
import hashlib
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

try:
    from db import supabase
except ImportError:
    supabase = None


# ── Firewall Command Generators ───────────────────────────────────────────────

def _generate_iptables_block(source_ip: str) -> str:
    """Generate an iptables command to DROP all traffic from the source IP."""
    return f"iptables -A INPUT -s {source_ip} -j DROP"


def _generate_iptables_rate_limit(source_ip: str, limit: str = "5/min") -> str:
    """Generate an iptables rate-limit rule for the source IP."""
    return (
        f"iptables -A INPUT -s {source_ip} -m limit --limit {limit} "
        f"--limit-burst 10 -j ACCEPT && "
        f"iptables -A INPUT -s {source_ip} -j DROP"
    )


def _generate_sql_block(source_ip: str) -> str:
    """Generate a SQL command to insert the IP into a blocklist table."""
    return (
        f"INSERT INTO ip_blocklist (ip_address, blocked_at, reason) "
        f"VALUES ('{source_ip}', NOW(), 'Automated block by Defense Agent');"
    )


def _generate_nft_block(source_ip: str) -> str:
    """Generate an nftables command to block the source IP."""
    return f"nft add rule inet filter input ip saddr {source_ip} drop"


def _generate_ufw_block(source_ip: str) -> str:
    """Generate a UFW deny rule for the source IP."""
    return f"ufw deny from {source_ip} to any"


# ── Mitigation Strategy Map ──────────────────────────────────────────────────

MITIGATION_STRATEGIES = {
    # attack_type_keyword → (action_label, command_generator, severity_override)
    "SQL":              ("BLOCK",        _generate_iptables_block,       "Critical"),
    "SQL_INJECTION":    ("BLOCK",        _generate_iptables_block,       "Critical"),
    "XSS":              ("BLOCK",        _generate_iptables_block,       "High"),
    "XSS_ATTEMPT":      ("BLOCK",        _generate_iptables_block,       "High"),
    "BRUTE_FORCE":      ("RATE_LIMIT",   _generate_iptables_rate_limit,  "High"),
    "BRUTE FORCE":      ("RATE_LIMIT",   _generate_iptables_rate_limit,  "High"),
    "PORT_SCAN":        ("BLOCK",        _generate_nft_block,            "Medium"),
    "DATA_EXFIL":       ("BLOCK",        _generate_iptables_block,       "Critical"),
    "MALWARE":          ("ISOLATE",      _generate_iptables_block,       "Critical"),
    "MALWARE_DETECTED": ("ISOLATE",      _generate_iptables_block,       "Critical"),
    "DNS_TUNNELING":    ("BLOCK",        _generate_iptables_block,       "High"),
    "PRIVILEGE_ESC":    ("BLOCK",        _generate_iptables_block,       "Critical"),
    "FIREWALL_BYPASS":  ("BLOCK",        _generate_nft_block,            "High"),
    "AUTH_ANOMALY":     ("CHALLENGE",    _generate_iptables_rate_limit,  "High"),
    "DDOS":             ("RATE_LIMIT",   _generate_iptables_rate_limit,  "Critical"),
    "RANSOMWARE":       ("ISOLATE",      _generate_iptables_block,       "Critical"),
}

# ── Defense Agent Core ────────────────────────────────────────────────────────


class DefenseReport:
    """Structured summary report for a defense action."""

    def __init__(
        self,
        source_ip: str,
        attack_type: str,
        action: str,
        commands: List[str],
        status: str,
        threat_level: str,
        description: str,
        log_id: Optional[str] = None,
    ):
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.source_ip = source_ip
        self.attack_type = attack_type
        self.action = action
        self.commands = commands
        self.status = status
        self.threat_level = threat_level
        self.description = description
        self.log_id = log_id
        self.block_id = hashlib.sha256(
            f"{source_ip}:{attack_type}:{self.timestamp}".encode()
        ).hexdigest()[:12]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "block_id": self.block_id,
            "timestamp": self.timestamp,
            "source_ip": self.source_ip,
            "attack_type": self.attack_type,
            "action": self.action,
            "commands_generated": self.commands,
            "mitigation_status": self.status,
            "threat_level": self.threat_level,
            "description": self.description,
            "log_id": self.log_id,
        }

    def __str__(self) -> str:
        lines = [
            "╔══════════════════════════════════════════════════════════╗",
            "║           🛡️  DEFENSE AGENT — ENFORCEMENT REPORT        ║",
            "╠══════════════════════════════════════════════════════════╣",
            f"║  Block ID     : {self.block_id:<40} ║",
            f"║  Timestamp    : {self.timestamp:<40} ║",
            f"║  Source IP    : {self.source_ip:<40} ║",
            f"║  Attack Type  : {self.attack_type:<40} ║",
            f"║  Action Taken : {self.action:<40} ║",
            f"║  Status       : {self.status:<40} ║",
            f"║  Threat Level : {self.threat_level:<40} ║",
            "╠══════════════════════════════════════════════════════════╣",
            "║  Commands Executed:                                      ║",
        ]
        for cmd in self.commands:
            # Truncate long commands for display
            display = cmd[:54] if len(cmd) > 54 else cmd
            lines.append(f"║  > {display:<54} ║")
        lines.append("╠══════════════════════════════════════════════════════════╣")
        lines.append(f"║  Summary: {self.description[:46]:<46} ║")
        lines.append("╚══════════════════════════════════════════════════════════╝")
        return "\n".join(lines)


def _resolve_strategy(attack_type: str):
    """
    Match an attack_type string to a mitigation strategy.
    Tries exact match first, then keyword containment.
    """
    upper = attack_type.upper().strip()

    # Exact match
    if upper in MITIGATION_STRATEGIES:
        return MITIGATION_STRATEGIES[upper]

    # Keyword containment
    for keyword, strategy in MITIGATION_STRATEGIES.items():
        if keyword in upper:
            return strategy

    # Default: block anyway for unknown attack types
    return ("BLOCK", _generate_iptables_block, "Medium")


def execute_defense(
    source_ip: str,
    attack_type: str,
    threat_level: str = "High",
    log_id: Optional[str] = None,
    dry_run: bool = True,
) -> DefenseReport:
    """
    Core Defense Agent execution.

    1. Determines the mitigation strategy based on attack type.
    2. Generates the specific Bash/SQL commands to block the source IP.
    3. Simulates execution (or logs for real execution in production).
    4. Updates the threat_logs table mitigation_status → 'Blocked'.
    5. Returns a structured DefenseReport.

    Args:
        source_ip:    The attacking IP address.
        attack_type:  The classification of the attack.
        threat_level: Severity level (may be overridden by strategy).
        log_id:       Optional Supabase threat_logs row ID to update.
        dry_run:      If True (default), only simulate. If False, would
                      execute the commands on the host (not implemented).

    Returns:
        DefenseReport with full action summary.
    """
    if not source_ip:
        return DefenseReport(
            source_ip="UNKNOWN",
            attack_type=attack_type,
            action="SKIPPED",
            commands=[],
            status="Skipped — No source IP provided",
            threat_level=threat_level,
            description="Defense Agent skipped: no source IP to block.",
            log_id=log_id,
        )

    # 1. Resolve strategy
    action_label, cmd_generator, severity_override = _resolve_strategy(attack_type)
    resolved_level = severity_override or threat_level

    # 2. Generate commands
    commands = []
    commands.append(cmd_generator(source_ip))
    commands.append(_generate_sql_block(source_ip))  # Also add to SQL blocklist

    # For ISOLATE actions, add extra network isolation
    if action_label == "ISOLATE":
        commands.append(f"iptables -A OUTPUT -s {source_ip} -j DROP")
        commands.append(f"# Quarantine host {source_ip} — notify SOC team")

    # For RATE_LIMIT, also generate a UFW rule as backup
    if action_label == "RATE_LIMIT":
        commands.append(_generate_ufw_block(source_ip))

    # 3. Simulate execution
    sim_status = "Blocked"
    if action_label == "RATE_LIMIT":
        sim_status = "Rate-Limited"
    elif action_label == "CHALLENGE":
        sim_status = "Challenged"
    elif action_label == "ISOLATE":
        sim_status = "Isolated"

    description = (
        f"Defense Agent executed {action_label} on {source_ip} for "
        f"{attack_type} attack. {len(commands)} command(s) generated. "
        f"Status: {sim_status}."
    )

    # 4. Update Supabase
    db_update_success = _update_supabase_status(log_id, sim_status, description)
    if not db_update_success:
        sim_status += " (DB update pending)"

    # 5. Build report
    report = DefenseReport(
        source_ip=source_ip,
        attack_type=attack_type,
        action=action_label,
        commands=commands,
        status=sim_status,
        threat_level=resolved_level,
        description=description,
        log_id=log_id,
    )

    # Print the report to server console
    print(f"\n🛡️  DEFENSE AGENT ACTIVATED — {action_label} on {source_ip}")
    print(report)

    return report


def _update_supabase_status(
    log_id: Optional[str],
    mitigation_status: str,
    description: str,
) -> bool:
    """
    Update the mitigation_status and description in the threat_logs table.
    Returns True on success, False on failure.
    """
    if not log_id or supabase is None:
        return False

    try:
        response = (
            supabase.table("threat_logs")
            .update({
                "mitigation_status": mitigation_status,
                "description": description,
            })
            .eq("id", log_id)
            .execute()
        )
        if response.data:
            print(f"   ✅ Supabase updated: log {log_id} → {mitigation_status}")
            return True
        else:
            print(f"   ⚠️ Supabase update returned no data for log {log_id}")
            return False
    except Exception as exc:
        print(f"   ❌ Supabase update failed for log {log_id}: {exc}")
        return False


# ── Batch Defense (for processing multiple threats) ───────────────────────────

def execute_batch_defense(
    threats: List[Dict[str, Any]],
) -> List[DefenseReport]:
    """
    Process multiple threats through the Defense Agent.

    Each threat dict should have: source_ip, attack_type, threat_level, id (optional).
    """
    reports = []
    for threat in threats:
        report = execute_defense(
            source_ip=threat.get("source_ip", ""),
            attack_type=threat.get("attack_type", threat.get("event_type", "Unknown")),
            threat_level=threat.get("threat_level", threat.get("severity", "Medium")),
            log_id=str(threat.get("id", "")),
        )
        reports.append(report)

    # Print batch summary
    blocked = sum(1 for r in reports if "Blocked" in r.status or "Isolated" in r.status)
    rate_limited = sum(1 for r in reports if "Rate-Limited" in r.status)
    challenged = sum(1 for r in reports if "Challenged" in r.status)
    skipped = sum(1 for r in reports if "Skipped" in r.status)

    print(f"\n📊 BATCH DEFENSE SUMMARY: "
          f"{blocked} blocked, {rate_limited} rate-limited, "
          f"{challenged} challenged, {skipped} skipped "
          f"(out of {len(threats)} threats)")

    return reports
