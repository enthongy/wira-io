
import pandas as pd
import json
from pathlib import Path
from sklearn.ensemble import IsolationForest

def run_analysis():
    try:
        _default_csv = Path(__file__).parent / "data" / "credit_card_fraud_10k.csv"
        df = pd.read_csv(str(_default_csv))
        features = ['amount', 'transaction_hour', 'foreign_transaction', 'location_mismatch', 'device_trust_score', 'velocity_last_24h', 'cardholder_age']
        
        # Guard against empty features
        if not features:
            print(json.dumps({"error": "No numerical features found for analysis."}))
            return
            
        # The "Forge" Logic
        model = IsolationForest(contamination=0.05, random_state=42)
        df['anomaly'] = model.fit_predict(df[features])
        
        # Extract the anomalies
        anomalies = df[df['anomaly'] == -1].copy()
        
        # Format the output for the Orchestrator
        results = []
        for _, row in anomalies.iterrows():
            tx_dict = row.to_dict()
            results.append(tx_dict)
            
        print(json.dumps(results, default=str))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    run_analysis()
