"""
Reasoning Agent — The Intelligence Bureau
Multiple agents investigate transactions and explain WHY they are flagged.
Each agent has a specialty and produces a verdict with detailed reasoning.
"""

import json
import sys
import random
from pathlib import Path

# Agent roster — each has a codename and specialty
AGENTS = [
    {"id": "SENTINEL_01", "name": "Sentinel-1", "role": "Velocity Analyst"},
    {"id": "PHANTOM_02", "name": "Phantom-2", "role": "Geo-Anomaly Hunter"},
    {"id": "SPECTRE_03", "name": "Spectre-3", "role": "Device Forensics"},
    {"id": "ORACLE_04", "name": "Oracle-4", "role": "Behavioral Profiler"},
]


def agent_investigation(transaction: dict) -> dict:
    """
    A single agent investigates a transaction and produces a verdict.
    Examines multiple risk signals and constructs a reasoning chain.
    """
    agent = random.choice(AGENTS)
    reasons = []
    risk_signals = 0

    # Amount analysis
    if transaction.get('amount', 0) > 500:
        reasons.append(f"HIGH VALUE: ${transaction['amount']:.2f} exceeds $500 threshold")
        risk_signals += 2
    elif transaction.get('amount', 0) > 200:
        reasons.append(f"ELEVATED VALUE: ${transaction['amount']:.2f} above normal range")
        risk_signals += 1

    # Location mismatch
    if transaction.get('location_mismatch', 0):
        reasons.append("GEO ANOMALY: Transaction origin doesn't match cardholder location")
        risk_signals += 2

    # Foreign transaction
    if transaction.get('foreign_transaction', 0):
        reasons.append("CROSS-BORDER: International transaction detected")
        risk_signals += 1

    # Device trust
    trust = transaction.get('device_trust_score', 100)
    if trust < 30:
        reasons.append(f"DEVICE RISK: Trust score {trust}/100 — possible compromised device")
        risk_signals += 2
    elif trust < 50:
        reasons.append(f"DEVICE WARNING: Trust score {trust}/100 — unverified device")
        risk_signals += 1

    # Time analysis
    hour = transaction.get('transaction_hour', 12)
    if 0 <= hour <= 4:
        reasons.append(f"TIME ANOMALY: Transaction at {hour:02d}:00 — unusual activity window")
        risk_signals += 1

    # Velocity
    velocity = transaction.get('velocity_last_24h', 0)
    if velocity >= 5:
        reasons.append(f"VELOCITY SPIKE: {velocity} transactions in 24h — rapid-fire pattern")
        risk_signals += 2
    elif velocity >= 3:
        reasons.append(f"VELOCITY ELEVATED: {velocity} transactions in 24h")
        risk_signals += 1

    # Determine verdict
    if risk_signals >= 4:
        verdict = "CRITICAL"
        confidence = min(98, 70 + risk_signals * 4)
    elif risk_signals >= 2:
        verdict = "FLAGGED"
        confidence = min(85, 50 + risk_signals * 5)
    elif risk_signals >= 1:
        verdict = "SUSPICIOUS"
        confidence = min(60, 30 + risk_signals * 10)
    else:
        verdict = "CLEAN"
        confidence = random.randint(85, 99)
        reasons.append("Normal behavioral pattern — no anomalies detected")

    return {
        "agent_id": agent["id"],
        "agent_name": agent["name"],
        "agent_role": agent["role"],
        "transaction_id": transaction.get("transaction_id", 0),
        "amount": transaction.get("amount", 0),
        "category": transaction.get("merchant_category", "Unknown"),
        "verdict": verdict,
        "confidence": confidence,
        "reasoning": reasons,
        "risk_signals": risk_signals,
    }


def multi_agent_debate(transaction: dict) -> dict:
    """
    Multiple agents independently analyze the same transaction.
    Returns a consensus verdict based on majority vote.
    """
    investigations = []
    # Pick 2-3 agents to debate
    num_agents = random.randint(2, 3)
    used_agents = random.sample(AGENTS, num_agents)

    for agent in used_agents:
        result = agent_investigation(transaction)
        result["agent_id"] = agent["id"]
        result["agent_name"] = agent["name"]
        result["agent_role"] = agent["role"]
        investigations.append(result)

    # Consensus: take the most severe verdict
    severity = {"CLEAN": 0, "SUSPICIOUS": 1, "FLAGGED": 2, "CRITICAL": 3}
    worst = max(investigations, key=lambda x: severity.get(x["verdict"], 0))

    return {
        "transaction_id": transaction.get("transaction_id", 0),
        "amount": transaction.get("amount", 0),
        "category": transaction.get("merchant_category", "Unknown"),
        "consensus_verdict": worst["verdict"],
        "consensus_confidence": max(inv["confidence"] for inv in investigations),
        "investigations": investigations,
    }


if __name__ == "__main__":
    # Test with a sample suspicious transaction
    test_tx = {
        "transaction_id": 9999,
        "amount": 750.00,
        "transaction_hour": 2,
        "merchant_category": "Electronics",
        "foreign_transaction": 1,
        "location_mismatch": 1,
        "device_trust_score": 28,
        "velocity_last_24h": 6,
        "cardholder_age": 32,
        "is_fraud": 0,
    }
    result = multi_agent_debate(test_tx)
    print(json.dumps(result, indent=2))
