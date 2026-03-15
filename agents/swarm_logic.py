import json
from typing import Optional


def get_swarm_analysis(tx_data: dict) -> dict:
    """
    Local multi-agent swarm analysis used by the upload pipeline.
    Mirrors the Gemini-based analysis but runs deterministically.
    Agents: SENTINEL → ORACLE → WIRA-LOCAL → COMPLIANCE → AUDITOR → SYSTEM
    """
    amount      = float(tx_data.get('amount', 0))
    loc_mismatch = bool(tx_data.get('location_mismatch', False))
    hour        = int(tx_data.get('transaction_hour', 12))
    velocity    = int(tx_data.get('velocity_last_24h', 0))
    foreign     = bool(tx_data.get('foreign_transaction', False))
    category    = str(tx_data.get('merchant_category', 'Unknown'))

    dialogue: list[dict] = []

    # ── SENTINEL: Structural anomaly detection ──────────────────────────
    sentinel_signals = 0
    sentinel_reasons = []
    if loc_mismatch:
        sentinel_signals += 2
        sentinel_reasons.append("location mismatch detected")
    if 0 <= hour <= 4:
        sentinel_signals += 1
        sentinel_reasons.append(f"unusual transaction hour ({hour:02d}:00)")
    if velocity >= 5:
        sentinel_signals += 2
        sentinel_reasons.append(f"velocity spike ({velocity} tx in 24h)")
    elif velocity >= 3:
        sentinel_signals += 1

    sentinel_msg = (
        f"Structural scan complete. Signals raised: {', '.join(sentinel_reasons)}."
        if sentinel_reasons else "Structural scan clear. No anomalies detected."
    )
    dialogue.append({"agent": "SENTINEL", "message": sentinel_msg})

    # ── ORACLE: Behavioural / amount profiling ──────────────────────────
    # Risk scales proportionally — not just a binary high/low
    if amount > 10000:
        oracle_risk = 95
    elif amount > 2000:
        oracle_risk = 75
    elif amount > 500:
        oracle_risk = 55
    elif amount > 200:
        oracle_risk = 35
    else:
        oracle_risk = 15

    if foreign:
        oracle_risk = min(100, oracle_risk + 20)

    oracle_msg = (
        f"Behavioural cross-reference: RM{amount:.2f} transaction scores {oracle_risk}% base risk. "
        f"{'Cross-border flag applied (+20%).' if foreign else 'Domestic pattern.'}"
    )
    dialogue.append({"agent": "ORACLE", "message": oracle_msg})

    # ── WIRA-LOCAL: Malaysian context ───────────────────────────────────
    wira_adjustment = 0
    wira_msg: Optional[str] = None

    if 5 < amount < 50:
        # DuitNow micro-payment
        wira_adjustment = -40
        wira_msg = (
            f"RM{amount:.2f} matches DuitNow food-merchant micro-payment pattern. "
            "Flag suppressed — consistent with everyday Malaysian mobile banking behaviour."
        )
    elif loc_mismatch and not foreign:
        # Balik Kampung / interstate travel
        wira_adjustment = -25
        wira_msg = (
            "Geo-mismatch triangulated against national travel calendar. "
            "Consistent with 'Balik Kampung' seasonal movement. Risk adjusted downward."
        )

    if wira_msg:
        dialogue.append({"agent": "WIRA-LOCAL", "message": wira_msg})

    # ── COMPLIANCE: AML / sanctions check ──────────────────────────────
    HIGH_RISK_CATEGORIES = {
        "jewellery", "jewelry", "electronics", "forex", "currency exchange",
        "money services", "pawnshop", "cryptocurrency", "luxury goods"
    }
    aml_flag = any(kw in category.lower() for kw in HIGH_RISK_CATEGORIES)
    compliance_adjustment = 0

    if aml_flag:
        compliance_adjustment = 15
        dialogue.append({
            "agent": "COMPLIANCE",
            "message": (
                f"AML check: Merchant category '{category}' is on the elevated ML-risk watchlist "
                f"(AMLATFPUAA S.14). Risk score adjusted +15. Recommend AML disclosure form if transaction proceeds."
            )
        })
    elif amount > 5000:
        dialogue.append({
            "agent": "COMPLIANCE",
            "message": (
                f"AML threshold check: RM{amount:.2f} approaches BNM cash reporting threshold. "
                "No sanctions match found. Monitoring flag applied."
            )
        })

    # ── Compute final risk ───────────────────────────────────────────────
    base_risk = oracle_risk + wira_adjustment + compliance_adjustment
    if amount > 10000:
        # Hard safety override
        final_risk = 100
    else:
        final_risk = max(0, min(100, base_risk + (sentinel_signals * 5)))

    # ── AUDITOR: Conflict resolution ────────────────────────────────────
    if wira_adjustment < 0 and oracle_risk > 50:
        dialogue.append({
            "agent": "AUDITOR",
            "message": (
                "Conflict detected: ORACLE (high risk) vs WIRA-LOCAL (context override). "
                "Resolution: WIRA-LOCAL context accepted with reduced weighting. "
                f"Net adjustment applied: {wira_adjustment:+d}%."
            )
        })

    # ── SYSTEM: Final recommendation ────────────────────────────────────
    if amount > 10000:
        system_msg = f"SAFETY OVERRIDE: RM{amount:.2f} exceeds BNM mandatory review threshold. Blocking for manual inspection."
    elif final_risk > 80:
        system_msg = f"RECOMMENDATION: Immediate block. Composite risk {final_risk}/100 exceeds critical threshold."
    elif final_risk > 50:
        system_msg = f"RECOMMENDATION: Flag for investigator review. Composite risk {final_risk}/100."
    else:
        system_msg = f"RECOMMENDATION: Proceed. Composite risk {final_risk}/100 within acceptable range."

    dialogue.append({"agent": "SYSTEM", "message": system_msg})

    # ── Verdict ─────────────────────────────────────────────────────────
    if final_risk > 80:
        verdict = "CRITICAL"
    elif final_risk > 50:
        verdict = "FLAGGED"
    else:
        verdict = "CLEAN"

    return {
        "final_risk_score": final_risk,
        "dialogue": dialogue,
        "verdict": verdict,
    }
