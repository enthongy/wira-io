"""
Simulation Tool — Live Transaction Feed
Picks random rows from the CSV to simulate a real-time transaction stream.
Called by the streaming API to make the dashboard feel alive.
"""

import json
import sys
from pathlib import Path
from typing import Optional

try:
    # pyre-ignore[21]
    from .mcp_server import MCPServer
except ImportError:
    # pyre-ignore[21]
    from mcp_server import MCPServer

def get_live_transaction(csv_path: Optional[str] = None) -> str:
    """Return a single random transaction as JSON to simulate real-time feed via MCP."""
    if csv_path is None:
        csv_path = str(Path(__file__).parent / "data" / "credit_card_fraud_10k.csv")

    server = MCPServer(csv_path)
    res = server.query("get_random_sample", {"count": 1})
    arr = json.loads(res)
    return json.dumps(arr[0] if arr else {})

def get_batch_transactions(csv_path: Optional[str] = None, count: int = 3) -> str:
    """Return multiple random transactions for burst simulation via MCP."""
    if csv_path is None:
        csv_path = str(Path(__file__).parent / "data" / "credit_card_fraud_10k.csv")

    server = MCPServer(csv_path)
    return server.query("get_random_sample", {"count": count})


if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    if count == 1:
        print(get_live_transaction())
    else:
        print(get_batch_transactions(count=count))
