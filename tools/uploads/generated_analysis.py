
import pandas as pd
import json
from sklearn.ensemble import IsolationForest

def run_analysis():
    try:
        df = pd.read_csv(r'C:\Users\User\Downloads\fintech-fraud-swarm\tools\uploads\1773498350539_credit_card_fraud_10k.csv')
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
