import os
import sys
import json
import subprocess
from pathlib import Path
from tempfile import NamedTemporaryFile

# Make sure we can import tools and agents
root = Path(__file__).parent.parent
sys.path.insert(0, str(root))

from tools.anomaly_engine import generate_detection_script
from agents.swarm_logic import get_swarm_analysis

def process_upload(file_path: str):
    """
    The Orchestration flow for an uploaded file:
    1. Pass CSV to anomaly_engine -> gets a custom generated Python script.
    2. Execute the generated Python script to run IsolationForest on the columns.
    3. Push the resulting anomalies through the Swarm logic to create Alerts.
    """
    try:
        # 1. Zero-Shot Data Mapping -> Generate Script
        script_path = generate_detection_script(file_path)
        
        # Check if error returned
        if script_path.startswith("{"):
            print(script_path)
            return

        # 2. Run the newly minted agent script
        python_exe = str(root / "agents" / "venv" / "Scripts" / "python.exe")
        process = subprocess.run(
            [python_exe, script_path], 
            capture_output=True, 
            text=True,
            check=False
        )
        
        if process.returncode != 0:
            # TRIGGER SELF-HEALING RECOVERY
            script_path = generate_detection_script(file_path, error_traceback=process.stderr)
            process = subprocess.run([python_exe, script_path], capture_output=True, text=True, check=False)
            if process.returncode != 0:
                print(json.dumps({"error": f"Generated script crashed even after self-healing: {process.stderr}"}))
                return
            
        try:
            anomalies = json.loads(process.stdout)
        except json.JSONDecodeError:
            print(json.dumps({"error": "Generated script did not return valid JSON.", "stdout": process.stdout}))
            return

        # Handle empty/error outputs from the generated script
        if isinstance(anomalies, dict) and "error" in anomalies:
            print(json.dumps(anomalies))
            return
            
        # Limit to 5 anomalies so we don't blow up the UI
        sample_anomalies = anomalies[:5]
        
        # 3. Pass each anomaly through the reasoning agents (A2A Dialogue)
        alerts = []
        for index, row in enumerate(sample_anomalies):
            # Fill missing mock fields we need if the CSV didn't have them
            tx = row.copy()
            if "transaction_id" not in tx:
                tx["transaction_id"] = 999000 + index
            if "amount" not in tx and "Amt" in tx:
                tx["amount"] = tx["Amt"]
            elif "amount" not in tx:
                tx["amount"] = float(list(tx.values())[0]) if list(tx.values()) else 0.0
                
            if "merchant_category" not in tx:
                tx["merchant_category"] = "Unknown Merchant"
                
            debate = get_swarm_analysis(tx)
            
            priority = {"CRITICAL": 3, "FLAGGED": 2, "SUSPICIOUS": 1, "CLEAN": 0}.get(debate["verdict"], 0)
            alert = {
                "id": f"UPLOAD-{tx['transaction_id']}",
                "transaction": tx,
                "debate": debate,
                "status": "pending",
                "priority": priority,
            }
            
            if priority > 0:
                alerts.append(alert)
                
        # Return structured response
        print(json.dumps({
            "success": True, 
            "total_scanned": len(anomalies), 
            "alerts": alerts,
            "script_path": script_path
        }))

    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        process_upload(sys.argv[1])
    else:
        print(json.dumps({"error": "Usage: upload_handler.py <path_to_csv>"}))
