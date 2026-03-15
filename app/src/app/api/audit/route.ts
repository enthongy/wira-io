import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, user, alertId, timestamp } = body;
    
    const rootDir = path.resolve(process.cwd(), "..", "..");
    const logsDir = path.join(rootDir, "audit_logs");
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    const logPath = path.join(logsDir, "bankops.log");
    const logEntry = `[${timestamp}] ${user.role} ${user.name} (${user.branch}) executed ${action} on transaction ${alertId}\n`;
    
    fs.appendFileSync(logPath, logEntry);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
