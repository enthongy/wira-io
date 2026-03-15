import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function GET() {
  try {
    const projectRoot = path.resolve(process.cwd(), '..');
    const pythonPath = path.join(projectRoot, 'agents', 'venv', 'Scripts', 'python.exe');
    const script = path.join(projectRoot, 'agents', 'stream_runner.py');

    const output = await new Promise<string>((resolve, reject) => {
      const proc = spawn(pythonPath, [script], {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';
      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      const timer = setTimeout(() => { proc.kill(); reject(new Error('Timeout')); }, 30000);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) reject(new Error(stderr || `Exit ${code}`));
        else resolve(stdout);
      });
      proc.on('error', (err) => { clearTimeout(timer); reject(err); });
    });

    return NextResponse.json(JSON.parse(output.trim()));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
