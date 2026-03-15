import json
import sys
from pathlib import Path

# Add /tools and /agents to path
root = Path(__file__).parent.parent
sys.path.insert(0, str(root / "tools"))
sys.path.insert(0, str(root / "agents"))

from simulation_tool import get_live_transaction
from swarm_logic import get_swarm_analysis

def stream_one(csv_path: str = None) -> dict:
    """Simulate one live transaction and run simplified A2A logic on it."""
    if csv_path is None:
        csv_path = str(root / "credit_card_fraud_10k.csv")

    raw = get_live_transaction(csv_path)
    tx = json.loads(raw)
    
    analysis = get_swarm_analysis(tx)

    return {
        "transaction": tx,
        "debate": analysis,
    }

if __name__ == "__main__":
    result = stream_one()
    print(json.dumps(result))
