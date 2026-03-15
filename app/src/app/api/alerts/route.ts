import { NextRequest, NextResponse } from "next/server";

// In-memory store (server-side) for alerts during the session.
// In production this would be a database (PostgreSQL / Supabase).
const alertStore: Record<string, any> = {};

// GET /api/alerts — list all alerts
export async function GET() {
  const alerts = Object.values(alertStore).sort(
    (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return NextResponse.json({ alerts });
}

// POST /api/alerts — create a new alert
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, transaction, debate, status = "pending" } = body;
    if (!id || !transaction || !debate) {
      return NextResponse.json({ error: "Missing required fields: id, transaction, debate" }, { status: 400 });
    }
    alertStore[id] = { id, transaction, debate, status, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    return NextResponse.json({ success: true, alert: alertStore[id] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/alerts — update alert status (resolve, flag, freeze)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, note } = body;
    if (!alertStore[id]) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    alertStore[id] = { ...alertStore[id], status, note: note ?? alertStore[id].note, updatedAt: new Date().toISOString() };
    return NextResponse.json({ success: true, alert: alertStore[id] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/alerts — delete an alert by id
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || !alertStore[id]) return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    delete alertStore[id];
    return NextResponse.json({ success: true, deleted: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
