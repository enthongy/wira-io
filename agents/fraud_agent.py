"""
Fraud Agent — Reasoning Layer
Calls the fraud_analyzer tool in /tools and summarizes the 'WHY' behind flagged transactions.
"""

import sys
import json
from pathlib import Path

# Add /tools to the import path so we can call the analyzer
sys.path.insert(0, str(Path(__file__).parent.parent / "tools"))
from fraud_analyzer import analyze_transactions


def call_tool(tool_name: str, csv_path: str = None) -> str:
    """Dispatch to the appropriate tool in /tools."""
    if csv_path is None:
        csv_path = str(Path(__file__).parent.parent / "credit_card_fraud_10k.csv")

    if tool_name == "fraud_analyzer":
        return analyze_transactions(csv_path)
    else:
        raise ValueError(f"Unknown tool: {tool_name}")


def generate_response(prompt: str) -> str:
    """
    Placeholder for LLM integration.
    Replace with an actual API call (OpenAI, Anthropic, etc.) to reason over the data.
    """
    return f"[Agent Response]\n{prompt}"


def run_fraud_swarm(csv_path: str = None) -> dict:
    """
    Main agent loop:
    1. Calls the fraud_analyzer tool to get critical transactions
    2. Builds a reasoning prompt
    3. Returns structured output for the dashboard API
    """
    raw_data = call_tool("fraud_analyzer", csv_path)
    critical_txns = json.loads(raw_data)

    prompt = (
        f"Analyze these {len(critical_txns)} critical transactions and explain "
        f"why they are risky:\n{json.dumps(critical_txns[:10], indent=2)}"
    )

    agent_reasoning = generate_response(prompt)

    return {
        "total_critical": len(critical_txns),
        "sample": critical_txns[:10],
        "agent_reasoning": agent_reasoning,
    }


if __name__ == "__main__":
    result = run_fraud_swarm()
    print(json.dumps(result, indent=2))
