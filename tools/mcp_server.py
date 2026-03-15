"""
MCP Server — The Bridge Tool
Reads the CSV and returns only what the agent asks for.
Acts as a structured data gateway between the dataset and the agent swarm.
"""

import pandas as pd
import json
import sys
from pathlib import Path
from typing import Optional


class MCPServer:
    """Minimal MCP-style server for fraud transaction data."""

    def __init__(self, csv_path: Optional[str] = None):
        if csv_path is None:
            csv_path = str(Path(__file__).parent / "data" / "credit_card_fraud_10k.csv")
        self.df = pd.read_csv(csv_path)

    def get_transaction(self, tx_id: int) -> Optional[dict]:
        """Fetch a single transaction by ID."""
        row = self.df[self.df["transaction_id"] == tx_id]
        if row.empty:
            return None
        return row.iloc[0].to_dict()

    def get_random_sample(self, count: int = 1) -> list[dict]:
        """Return random transactions for simulation."""
        return self.df.sample(min(count, len(self.df))).to_dict(orient="records")

    def get_high_risk(self, amount_threshold: float = 500) -> list[dict]:
        """Return transactions above a given amount threshold."""
        high = self.df[self.df["amount"] > amount_threshold]
        return high.to_dict(orient="records")

    def get_by_category(self, category: str) -> list[dict]:
        """Return all transactions for a specific merchant category."""
        filtered = self.df[self.df["merchant_category"] == category]
        return filtered.to_dict(orient="records")

    def get_flagged_fraud(self) -> list[dict]:
        """Return all transactions labeled as fraud."""
        fraud = self.df[self.df["is_fraud"] == 1]
        return fraud.to_dict(orient="records")

    def query(self, tool_name: str, params: Optional[dict] = None) -> str:
        """Unified query interface — agents call this with a tool name."""
        params = params or {}

        if tool_name == "get_transaction":
            result = self.get_transaction(params.get("tx_id", 0))
        elif tool_name == "get_random_sample":
            result = self.get_random_sample(params.get("count", 1))
        elif tool_name == "get_high_risk":
            result = self.get_high_risk(params.get("threshold", 500))
        elif tool_name == "get_by_category":
            result = self.get_by_category(params.get("category", ""))
        elif tool_name == "get_flagged_fraud":
            result = self.get_flagged_fraud()
        else:
            result = {"error": f"Unknown tool: {tool_name}"}

        return json.dumps(result, default=str)


if __name__ == "__main__":
    server = MCPServer()
    # Demo: get a random transaction
    print(server.query("get_random_sample", {"count": 1}))
