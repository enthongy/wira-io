import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const VAULT_DIR = path.join(process.cwd(), "vault", "reasoning_traces");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Ensure vault directory exists
    await fs.mkdir(VAULT_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `trace_${body.alertId ?? "unknown"}_${timestamp}.json`;
    const filepath = path.join(VAULT_DIR, filename);

    const trace = {
      schema_version: "1.0",
      generated_at: new Date().toISOString(),
      alert_id: body.alertId,
      event_type: body.eventType ?? "SELF_HEAL",
      original_verdict: body.originalVerdict,
      original_risk_score: body.originalRiskScore,
      human_action: body.humanAction,
      investigator: body.investigator,
      auditor_response: body.auditorResponse,
      learning_applied: body.learningApplied ?? "Geofencing rules relaxed for user profile. Pattern flagged for Tier-2 retraining.",
      pipeline_stage: body.pipelineStage ?? "L3_MEMORY",
    };

    await fs.writeFile(filepath, JSON.stringify(trace, null, 2), "utf8");
    return NextResponse.json({ ok: true, tracefile: filename });
  } catch (err: any) {
    console.error("Vault API error:", err.message);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await fs.mkdir(VAULT_DIR, { recursive: true });
    const files = await fs.readdir(VAULT_DIR);
    const traces = await Promise.all(
      files
        .filter(f => f.endsWith(".json"))
        .slice(-20) // last 20
        .map(async f => {
          const content = await fs.readFile(path.join(VAULT_DIR, f), "utf8");
          return JSON.parse(content);
        })
    );
    return NextResponse.json({ traces: traces.reverse() });
  } catch (err: any) {
    return NextResponse.json({ traces: [] });
  }
}
