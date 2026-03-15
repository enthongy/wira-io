import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import os from "fs";

const IS_VERCEL = process.env.VERCEL === '1';

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
    }

    if (IS_VERCEL) {
      // On Vercel: acknowledge upload, skip Python pipeline (no runtime available)
      return NextResponse.json({
        success: true,
        demo: true,
        message: "File received. Python ADK pipeline runs locally only. Gemini-powered analysis is available via /api/gemini.",
        filename: file.name,
        size: file.size,
      });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save temporal file for the python engine
    const rootDir = path.resolve(process.cwd(), "..");
    const uploadDir = path.join(rootDir, "tools", "uploads");
    
    // Ensure dir exists
    if (!os.existsSync(uploadDir)) {
        os.mkdirSync(uploadDir, { recursive: true });
    }
        
    const filePath = path.join(uploadDir, `${Date.now()}_${file.name}`);
    os.writeFileSync(filePath, buffer);

    const pythonExecutable = path.resolve(rootDir, "agents", "venv", "Scripts", "python.exe");
    const scriptPath = path.resolve(rootDir, "agents", "upload_handler.py");

    const pyProcess = spawn(pythonExecutable, [scriptPath, filePath]);
    
    let stdoutData = "";
    let stderrData = "";

    return new Promise<Response>((resolve) => {
      // Stream buffer reading
      pyProcess.stdout.on("data", (data) => {
        stdoutData += data.toString();
      });

      pyProcess.stderr.on("data", (data) => {
        stderrData += data.toString();
      });

      pyProcess.on("close", (code) => {
        // Output format from python
        try {
            const rawResponse = stdoutData.trim().split("\n").pop() || "{}"; // grab the last JSON line
            const result = JSON.parse(rawResponse);
            if (code === 0 && result.success) {
                resolve(NextResponse.json(result));
            } else {
                resolve(NextResponse.json({ error: result.error || stderrData || "Execution failed" }, { status: 500 }));
            }
        } catch (e) {
            resolve(NextResponse.json({ error: "Agent did not return structured output.", details: stdoutData }, { status: 500 }));
        }
      });
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
