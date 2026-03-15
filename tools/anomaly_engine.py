import pandas as pd
import os
import json

def generate_detection_script(file_path, error_traceback=None):
    """
    Reads the schema of any uploaded CSV and generates a custom 
    IsolationForest script specifically for that data structure.
    Includes Self-Healing Logic if an error_traceback is provided.
    """
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return json.dumps({"error": f"Failed to read CSV: {str(e)}"})
        
    columns = list(df.columns)
    
    # The "Intelligence" - Identify numerical columns for math
    # Ignore IDs or binary flags if possible to keep the model clean
    num_cols = df.select_dtypes(include=['number']).columns.tolist()
    
    # Filter out common ID columns which confuse the ML 
    filtered_cols = [c for c in num_cols if 'id' not in c.lower() and 'is_fraud' not in c.lower()]
    
    # Generate a custom script string
    script_content = f"""
import pandas as pd
import json
from sklearn.ensemble import IsolationForest

def run_analysis():
    try:
        df = pd.read_csv(r'{file_path}')
        features = {filtered_cols}
        
        # Guard against empty features
        if not features:
            print(json.dumps({{"error": "No numerical features found for analysis."}}))
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
        print(json.dumps({{"error": str(e)}}))

if __name__ == "__main__":
    run_analysis()
"""

    if error_traceback:
        # Self-Healing Logic: Fallback to a highly robust script if the first one failed
        script_content = f"""
import pandas as pd
import json
from sklearn.ensemble import IsolationForest

def run_analysis():
    try:
        df = pd.read_csv(r'{file_path}')
        # SELF-HEALING: Force numeric only and fill NaNs to guarantee execution
        numeric_df = df.select_dtypes(include=['number']).fillna(0)
        
        model = IsolationForest(contamination=0.05, random_state=42)
        df['anomaly'] = model.fit_predict(numeric_df)
        
        anomalies = df[df['anomaly'] == -1].copy()
        results = [row.to_dict() for _, row in anomalies.iterrows()]
        
        print(json.dumps(results, default=str))
    except Exception as e:
        print(json.dumps({{"error": str(e)}}))

if __name__ == "__main__":
    run_analysis()
"""
    # Save the autonomous script in the same directory as the file
    script_path = os.path.join(os.path.dirname(file_path), "generated_analysis.py")
    with open(script_path, "w") as f:
        f.write(script_content)
        
    return script_path

if __name__ == "__main__":
    # Demo
    import sys
    if len(sys.argv) > 1:
        print(generate_detection_script(sys.argv[1]))
    else:
        print(json.dumps({"error": "Please provide a file path"}))
