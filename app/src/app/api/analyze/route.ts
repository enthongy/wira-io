import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

const IS_VERCEL = process.env.VERCEL === '1';

export async function GET() {
  if (IS_VERCEL) {
    return NextResponse.json({
      info: 'Python batch engine is not available on Vercel. Run locally for full CSV analysis.',
      demo: true,
    });
  }
  try {
    const csvPath = path.join(process.cwd(), 'credit_card_fraud_10k.csv');
    const csvText = readFileSync(csvPath, 'utf-8');
    return NextResponse.json({ csv: csvText });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read CSV data' }, { status: 500 });
  }
}

export async function POST() {
  if (IS_VERCEL) {
    return NextResponse.json({
      info: 'Python swarm engine is not available on Vercel. The Gemini-powered swarm (/api/gemini) is fully operational.',
      demo: true,
      redirect: '/api/gemini',
    });
  }
  try {
    const projectRoot = path.resolve(process.cwd(), '..');
    const pythonPath = path.join(projectRoot, 'agents', 'venv', 'Scripts', 'python.exe');
    const agentScript = path.join(projectRoot, 'agents', 'fraud_agent.py');

    const output = await new Promise<string>((resolve, reject) => {
      const proc = spawn(pythonPath, [agentScript], {
        cwd: projectRoot,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => { stderr += data.toString(); });

      const timer = setTimeout(() => {
        proc.kill();
        reject(new Error('Process timed out after 60s'));
      }, 60000);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(stderr || `Process exited with code ${code}`));
        } else {
          resolve(stdout);
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    const result = JSON.parse(output.trim());
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Swarm execution failed',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
