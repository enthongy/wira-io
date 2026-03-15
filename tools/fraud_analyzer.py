"""
Fraud Analyzer Tool — The Quantitative Engine
Called by agents in /agents to detect anomalous transactions using Isolation Forest.
"""

import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest


def analyze_transactions(file_path: str) -> str:
    """
    Runs Isolation Forest anomaly detection on the transaction dataset.
    Returns a JSON string of high-risk (CRITICAL) transactions.
    """
    df = pd.read_csv(file_path)

    # Core fintech features for anomaly detection
    features = ['amount', 'transaction_hour', 'location_mismatch']

    # The "Forge" Logic: Isolation Forest detects outliers (fraud)
    model = IsolationForest(contamination=0.03, random_state=42)
    df['anomaly_score'] = model.fit_predict(df[features])

    # Filter for high-risk only
    high_risk = df[df['anomaly_score'] == -1].copy()
    high_risk['risk_level'] = 'CRITICAL'

    return high_risk[['transaction_id', 'amount', 'risk_level']].to_json(orient='records')


if __name__ == "__main__":
    # Test it against the project CSV
    print(analyze_transactions(str(Path(__file__).parent / "data" / "credit_card_fraud_10k.csv")))
