"""
FinTech Fraud Analysis Backend — Agent Logic
This script is called by the Next.js API route for ML-powered fraud detection.
"""

import json
import sys
import csv
from pathlib import Path


def load_transactions(csv_path: str) -> list[dict]:
    """Load transactions from CSV file."""
    transactions = []
    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            transactions.append({
                "transaction_id": int(row["transaction_id"]),
                "amount": float(row["amount"]),
                "transaction_hour": int(row["transaction_hour"]),
                "merchant_category": row["merchant_category"],
                "foreign_transaction": int(row["foreign_transaction"]),
                "location_mismatch": int(row["location_mismatch"]),
                "device_trust_score": int(row["device_trust_score"]),
                "velocity_last_24h": int(row["velocity_last_24h"]),
                "cardholder_age": int(row["cardholder_age"]),
                "is_fraud": int(row["is_fraud"]),
            })
    return transactions


def compute_risk_score(tx: dict) -> float:
    """Compute a heuristic risk score for a transaction."""
    score = 0.0

    # Amount risk
    if tx["amount"] > 500:
        score += 25
    elif tx["amount"] > 200:
        score += 15
    elif tx["amount"] > 100:
        score += 8

    # Time risk
    if 0 <= tx["transaction_hour"] <= 5:
        score += 15
    elif tx["transaction_hour"] >= 22:
        score += 10

    # Foreign + location mismatch
    if tx["foreign_transaction"]:
        score += 20
    if tx["location_mismatch"]:
        score += 20

    # Device trust
    if tx["device_trust_score"] < 30:
        score += 20
    elif tx["device_trust_score"] < 50:
        score += 12
    elif tx["device_trust_score"] < 70:
        score += 5

    # Velocity
    if tx["velocity_last_24h"] >= 6:
        score += 15
    elif tx["velocity_last_24h"] >= 4:
        score += 8
    elif tx["velocity_last_24h"] >= 3:
        score += 4

    return min(100, score)


def analyze(csv_path: str) -> dict:
    """Run fraud analysis on the dataset."""
    transactions = load_transactions(csv_path)

    results = []
    for tx in transactions:
        tx["risk_score"] = compute_risk_score(tx)
        results.append(tx)

    total = len(results)
    fraud_count = sum(1 for r in results if r["is_fraud"])
    high_risk = sum(1 for r in results if r["risk_score"] >= 50)

    return {
        "total_transactions": total,
        "fraud_count": fraud_count,
        "fraud_rate": round(fraud_count / total * 100, 2) if total else 0,
        "high_risk_count": high_risk,
        "transactions": results[:100],  # Return top 100 for analysis
    }


if __name__ == "__main__":
    # Default path: look for CSV in the /app directory (sibling to /agents)
    csv_path = sys.argv[1] if len(sys.argv) > 1 else str(
        Path(__file__).parent.parent / "app" / "credit_card_fraud_10k.csv"
    )
    result = analyze(csv_path)
    print(json.dumps(result, indent=2))
