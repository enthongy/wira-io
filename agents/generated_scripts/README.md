# ADK Generated Scripts

This folder is the **live output directory** of WIRA.IO's ADK (Agent Development Kit) pipeline.

## How it works

1. A banker uploads a CSV file via the dashboard.
2. `anomaly_engine.py` reads the CSV headers and infers the data schema.
3. The **Developer Agent** writes a custom `scikit-learn` Python script here — tailored to that exact dataset.
4. The generated script is executed in a sandboxed subprocess.
5. If a runtime error occurs, the **AUDITOR Agent** captures the stack trace, patches the script, and retries automatically.

## Demo Instructions

> **This folder starts empty.**
> Upload any CSV via the WIRA.IO dashboard — a new `.py` file will appear here seconds later.
> That script was written by the WIRA agent *just now*, specifically for your dataset.
> This is the ADK "Auto-Code Generation" capability in action.

---

*Generated scripts are ephemeral and safe to delete between demo sessions.*
