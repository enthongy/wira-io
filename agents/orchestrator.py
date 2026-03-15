"""
Orchestrator Agent — The Boss
Coordinates the swarm by pulling data through the MCP server,
dispatching investigations to specialist agents, and assembling the final verdict.
"""

import json
import sys
import random
from pathlib import Path
from typing import Optional

root = Path(__file__).parent.parent
sys.path.insert(0, str(root / "tools"))
sys.path.insert(0, str(root / "agents"))

from mcp_server import MCPServer
from reasoning_agent import multi_agent_debate, AGENTS


class Orchestrator:
    """Boss agent that coordinates the investigation swarm."""

    def __init__(self, csv_path: Optional[str] = None):
        self.server = MCPServer(csv_path)
        self.pending_alerts = []
        self.resolved = []

    def scan_random(self) -> dict:
        """Pick a random transaction, run multi-agent debate, return structured alert."""
        raw = self.server.query("get_random_sample", {"count": 1})
        tx = json.loads(raw)[0]
        debate = multi_agent_debate(tx)

        alert = {
            "id": f"ALT-{tx['transaction_id']:05d}",
            "transaction": tx,
            "debate": debate,
            "status": "pending",
            "priority": self._priority(debate["consensus_verdict"]),
        }

        if debate["consensus_verdict"] in ("CRITICAL", "FLAGGED", "SUSPICIOUS"):
            self.pending_alerts.append(alert)

        return alert

    def scan_batch(self, count: int = 5) -> list[dict]:
        """Scan multiple transactions and return all alerts."""
        alerts = []
        for _ in range(count):
            alert = self.scan_random()
            alerts.append(alert)
        return alerts

    def resolve_alert(self, alert_id: str, action: str, operator: str = "OPERATOR") -> dict:
        """Resolve a pending alert with an operator decision."""
        for alert in self.pending_alerts:
            if alert["id"] == alert_id:
                alert["status"] = action  # "approved" | "flagged" | "frozen"
                alert["resolved_by"] = operator
                self.resolved.append(alert)
                self.pending_alerts.remove(alert)
                return {
                    "success": True,
                    "alert_id": alert_id,
                    "action": action,
                    "message": self._action_message(action, alert),
                }
        return {"success": False, "error": f"Alert {alert_id} not found"}

    def get_pending(self) -> list[dict]:
        """Return all pending alerts sorted by priority."""
        return sorted(self.pending_alerts, key=lambda a: a["priority"], reverse=True)

    def _priority(self, verdict: str) -> int:
        return {"CRITICAL": 3, "FLAGGED": 2, "SUSPICIOUS": 1, "CLEAN": 0}.get(verdict, 0)

    def _action_message(self, action: str, alert: dict) -> str:
        tx_id = alert["transaction"]["transaction_id"]
        acct = (tx_id * 7 + 1000) % 9999
        if action == "frozen":
            return f"Account {acct} frozen. SMS notification dispatched to cardholder."
        elif action == "flagged":
            return f"TX#{tx_id:05d} flagged for compliance review. Case opened."
        else:
            return f"TX#{tx_id:05d} approved. Transaction cleared for processing."


if __name__ == "__main__":
    orch = Orchestrator()

    # Scan a batch
    alerts = orch.scan_batch(5)
    pending = orch.get_pending()

    result = {
        "total_scanned": len(alerts),
        "pending_alerts": len(pending),
        "alerts": [
            {
                "id": a["id"],
                "amount": a["transaction"]["amount"],
                "verdict": a["debate"]["consensus_verdict"],
                "confidence": a["debate"]["consensus_confidence"],
                "priority": a["priority"],
                "investigations": a["debate"]["investigations"],
            }
            for a in pending
        ],
    }
    print(json.dumps(result))
