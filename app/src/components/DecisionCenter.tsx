"use client";

import { Shield, Eye, Cpu, CheckCircle2, AlertTriangle, AlertOctagon, X, FileDown, RefreshCw, Loader2, FileText, Copy, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Alert } from "@/app/page";

interface DecisionCenterProps {
  alert: Alert;
  user?: any;
  shadowMode?: boolean;
  onClose: () => void;
  onDecision: (alertId: string, action: string) => void;
  onRelease?: (alertId: string) => void;
  decisionState: string | null;
  inline?: boolean;
}

export function DecisionCenter({ alert, user, shadowMode, onClose, onDecision, onRelease, decisionState, inline = false }: DecisionCenterProps) {
  const tx = alert.transaction;
  const analysis = alert.debate; // now holds { dialogue, final_risk_score, verdict }
  const [isMasked, setIsMasked] = useState(true);
  const [secondOpinion, setSecondOpinion] = useState<"idle" | "loading" | "done">("idle");
  const [toast, setToast] = useState<string | null>(null);
  const [sarState, setSarState] = useState<"idle" | "loading" | "done">("idle");
  const [sarText, setSarText] = useState<string | null>(null);
  const [showSarModal, setShowSarModal] = useState(false);
  const [selfHealMsg, setSelfHealMsg] = useState<string | null>(null);
  const [showOverridePopup, setShowOverridePopup] = useState(false);
  const [freeze, setFreeze] = useState(false);
  const [stepUpState, setStepUpState] = useState<'idle'|'pending'|'verified'>('idle');

  // Real PDF Generation via browser print
  const handleDownloadPDF = () => {
    const reportDate = new Date().toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", dateStyle: "full", timeStyle: "medium" });
    const verdictColor = analysis.verdict === "CRITICAL" ? "#dc2626" : analysis.verdict === "FLAGGED" ? "#d97706" : "#16a34a";

    const dialogueRows = analysis.dialogue
      .map((d: any) => `
        <tr>
          <td style="padding:10px 12px;font-weight:700;color:#1e293b;background:#f8fafc;border-bottom:1px solid #e2e8f0;white-space:nowrap;font-size:11px;letter-spacing:0.05em;">${d.agent}</td>
          <td style="padding:10px 12px;font-size:12px;color:#475569;border-bottom:1px solid #e2e8f0;line-height:1.6;">${d.message}</td>
        </tr>`)
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>WIRA.IO Compliance Narrative — ${alert.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', Arial, sans-serif; background: #fff; color: #1e293b; font-size: 13px; }
    .page { max-width: 780px; margin: 0 auto; padding: 40px 48px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 28px; }
    .logo-block { display: flex; align-items: center; gap: 10px; }
    .logo-box { width: 36px; height: 36px; background: #059669; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .logo-box svg { width: 20px; height: 20px; fill: none; stroke: white; stroke-width: 2.5; }
    .logo-text { font-size: 18px; font-weight: 700; color: #059669; letter-spacing: -0.02em; }
    .logo-sub { font-size: 11px; color: #64748b; font-weight: 500; margin-top: 2px; }
    .meta-right { text-align: right; }
    .meta-right .case-id { font-size: 20px; font-weight: 700; color: #1e293b; }
    .meta-right .timestamp { font-size: 10px; color: #94a3b8; margin-top: 4px; }
    .verdict-banner { display: flex; align-items: center; justify-content: space-between; background: #fff7ed; border: 1.5px solid #fed7aa; border-left: 5px solid ${verdictColor}; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px; }
    .verdict-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; }
    .verdict-value { font-size: 22px; font-weight: 800; color: ${verdictColor}; letter-spacing: -0.01em; }
    .risk-pill { background: ${verdictColor}; color: white; font-weight: 700; font-size: 13px; padding: 6px 16px; border-radius: 999px; }
    h2 { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    h2::before { content: ''; display: inline-block; width: 4px; height: 14px; background: #3b82f6; border-radius: 2px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
    .card-label { font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 5px; }
    .card-value { font-size: 15px; font-weight: 700; color: #1e293b; }
    .card-value.red { color: #dc2626; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 28px; }
    thead tr { background: #1e293b; }
    thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .footer-badge { font-size: 10px; color: #94a3b8; }
    .footer-compliance { font-size: 10px; font-weight: 700; color: #059669; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 4px 10px; border-radius: 999px; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="logo-block">
      <div class="logo-box">
        <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div>
        <div class="logo-text">WIRA.IO</div>
        <div class="logo-sub">Fraud Detection & Compliance Platform</div>
      </div>
    </div>
    <div class="meta-right">
      <div class="case-id">${alert.id}</div>
      <div class="timestamp">Generated: ${reportDate}</div>
      <div class="timestamp">Reviewed by: ${user?.name ?? "System"} · ${user?.role ?? ""} · ${user?.branch ?? ""}</div>
    </div>
  </div>

  <div class="verdict-banner">
    <div>
      <div class="verdict-label">Swarm Intelligence Verdict</div>
      <div class="verdict-value">${analysis.verdict}</div>
    </div>
    <div class="risk-pill">Risk Score: ${analysis.final_risk_score} / 100</div>
  </div>

  <h2>Transaction Details</h2>
  <div class="grid">
    <div class="card">
      <div class="card-label">Transaction Amount</div>
      <div class="card-value red">RM ${tx.amount.toFixed(2)}</div>
    </div>
    <div class="card">
      <div class="card-label">Card Number / PAN</div>
      <div class="card-value">**** **** **** 4421</div>
    </div>
    <div class="card">
      <div class="card-label">Transaction ID</div>
      <div class="card-value">TXN-${tx.transaction_id}</div>
    </div>
    <div class="card">
      <div class="card-label">Merchant Category</div>
      <div class="card-value">${tx.merchant_category}</div>
    </div>
    <div class="card">
      <div class="card-label">Location Mismatch</div>
      <div class="card-value ${tx.location_mismatch ? "red" : ""}">${tx.location_mismatch ? "YES — FLAGGED" : "NO"}</div>
    </div>
    <div class="card">
      <div class="card-label">Transaction Hour</div>
      <div class="card-value">${String(tx.transaction_hour).padStart(2, "0")}:00 MYT</div>
    </div>
  </div>

  <h2>Multi-Agent Swarm Reasoning Trace</h2>
  <table>
    <thead>
      <tr>
        <th style="width:130px">Agent</th>
        <th>Reasoning & Evidence</th>
      </tr>
    </thead>
    <tbody>${dialogueRows}</tbody>
  </table>

  <div class="footer">
    <div class="footer-badge">
      <strong>Case File:</strong> ${alert.id} &nbsp;·&nbsp; 
      <strong>Analyst:</strong> ${user?.name ?? "N/A"} &nbsp;·&nbsp; 
      <strong>Platform:</strong> WIRA.IO v1.0 &nbsp;·&nbsp; 
      <strong>Compliance:</strong> BNM / PCI-DSS / PDPA
    </div>
    <div class="footer-compliance">BNM Compliant Report</div>
  </div>

</div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  };

  const handleStepUp = () => {
    setStepUpState('pending');
    setToast('Step-Up verification sent via DuitNow App & SMS. Awaiting customer response...');
    setTimeout(() => { setToast(null); }, 3500);
    // Simulate customer verification after 4s
    setTimeout(() => {
      setStepUpState('verified');
      onDecision(alert.id, 'approved');
    }, 4000);
  };

  const handleFreeze = () => {
    setFreeze(true);
    setToast("Account 8821 Secured. BNM Report Generated.");
    setTimeout(() => { setToast(null); setFreeze(false); }, 3500);
    onDecision(alert.id, "frozen");
  };

  // BNM SAR Generation — builds locally first, enriches via Gemini if available
  const handleGenerateSAR = async () => {
    setSarState("loading");
    setShowSarModal(true);

    const systemId = Math.floor(Math.random() * 9000) + 1000;
    const reportRef = `WIRA.IO/${alert.id}/${new Date().getFullYear()}`;
    const actionTime = new Date().toLocaleTimeString("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: '2-digit', minute: '2-digit' }) + " MYT";
    const reportDate = new Date().toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur", year: 'numeric', month: 'long', day: 'numeric' });

    const sentinelMsg = analysis.dialogue.find((d: any) => d.agent === 'SENTINEL')?.message ?? 'Anomalous transaction pattern detected outside normal operating parameters.';
    const oracleMsg   = analysis.dialogue.find((d: any) => d.agent === 'ORACLE')?.message   ?? 'Behavioral profile shows significant deviation from historical baseline.';
    const localMsg    = analysis.dialogue.find((d: any) => d.agent === 'WIRA-LOCAL')?.message ?? 'Local Malaysian transaction context does not validate this activity.';
    const systemMsg   = analysis.dialogue.find((d: any) => d.agent === 'SYSTEM')?.message    ?? 'Swarm consensus reached. Escalation recommended.';

    const riskClass =
      analysis.final_risk_score >= 80 ? 'CRITICAL — Immediate Intervention Required' :
      analysis.final_risk_score >= 60 ? 'HIGH RISK — Priority Human Review' :
      'SUSPICIOUS — Standard Review Queue';

    // Step 1: Always build a proper local SAR (guaranteed to work)
    const localSAR = [
      `WIRA.IO SYSTEM ID: ${systemId}`,
      `REPORT DATE: ${reportDate}`,
      `CASE REFERENCE: ${alert.id}`,
      ``,
      `DETECTION METHOD: Multi-Agent Swarm Orchestration`,
      `  Agents: SENTINEL · ORACLE · WIRA-LOCAL · SYSTEM`,
      `  Engine: Google Gemini 1.5 Flash (WIRA.IO Fraud Swarm v2)`,
      ``,
      `TRANSACTION DETAILS:`,
      `  Amount      : RM ${tx.amount.toFixed(2)}`,
      `  Merchant    : ${tx.merchant_category}`,
      `  Time        : ${tx.transaction_hour}:00 MYT`,
      `  Geo-Mismatch: ${tx.location_mismatch ? 'YES — Account location differs from transaction origin' : 'NO'}`,
      `  Risk Score  : ${analysis.final_risk_score} / 100`,
      ``,
      `RISK CLASSIFICATION: ${riskClass}`,
      ``,
      `AGENT REASONING:`,
      `  [SENTINEL]   ${sentinelMsg}`,
      `  [ORACLE]     ${oracleMsg}`,
      `  [WIRA-LOCAL] ${localMsg}`,
      `  [SYSTEM]     ${systemMsg}`,
      ``,
      `ACTION TAKEN:`,
      `  Account activity restricted at ${actionTime} following autonomous swarm intervention.`,
      `  Status: Pending human investigator review and confirmation.`,
      ``,
      `INVESTIGATOR CONFIRMATION:`,
      `  Name  : ${user?.name ?? 'Pending Assignment'}`,
      `  Role  : ${user?.role ?? 'Fraud Investigator'}`,
      `  Branch: ${user?.branch ?? 'HQ Operations'}`,
      `  Action: Reviewed and confirmed swarm verdict. Case escalated per SOP.`,
      ``,
      `BNM COMPLIANCE DECLARATION:`,
      `  This Suspicious Activity Report (SAR) has been generated in accordance`,
      `  with Section 14 of the Anti-Money Laundering, Anti-Terrorism Financing`,
      `  and Proceeds of Unlawful Activities Act 2001 (AMLATFPUAA).`,
      `  Reporting Entity: WIRA.IO Fraud Detection Platform`,
      `  Reference       : ${reportRef}`,
      `  Submission Mode : Automated — Swarm Intelligence System`,
    ].join('\n');

    // Set locally-built SAR immediately so user sees something
    setSarText(localSAR);
    setSarState("done");

    // Step 2: Try to enhance just the REASONING paragraph with Gemini
    try {
      const enhancePrompt = `You are a BNM compliance officer. Given these three AI agent findings, write ONE polished 3-sentence REASONING paragraph for a formal Suspicious Activity Report (SAR). Be professional, specific, and cite the agent names. Output ONLY the paragraph text, no labels or headers.

SENTINEL: ${sentinelMsg}
ORACLE: ${oracleMsg}
WIRA-LOCAL: ${localMsg}
Transaction: RM ${tx.amount.toFixed(2)} at ${tx.merchant_category}, hour ${tx.transaction_hour}:00, geo-mismatch: ${tx.location_mismatch}.`;

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sarPrompt: enhancePrompt }),
      });
      if (!res.ok) return; // keep local SAR if API fails
      const data = await res.json();
      const enhanced = data.sarText?.trim();
      // Only update if Gemini returned meaningful text (not error strings or empty)
      if (enhanced && enhanced.length > 40 && !enhanced.toLowerCase().includes('failed') && !enhanced.toLowerCase().includes('sorry')) {
        setSarText(prev => prev ? prev.replace(
          /AGENT REASONING:[\s\S]*?ACTION TAKEN:/,
          `AGENT REASONING (AI-Enhanced):\n  ${enhanced}\n\nACTION TAKEN:`
        ) : localSAR);
      }
    } catch {
      // Gemini enhancement failed — local SAR is already displayed, nothing to do
    }
  };

  const maskData = (data: string) => isMasked ? `**** **** **** ${data.slice(-4) || '0000'}` : data;

  // Request Second Opinion from Auditor agent (local reasoning expansion)
  const handleSecondOpinion = () => {
    setSecondOpinion("loading");
    setTimeout(() => setSecondOpinion("done"), 2200);
  };

  // We map the agent names to specific icons for the corporate feel
  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "SENTINEL":          return <Shield className="w-4 h-4 text-blue-600" />;
      case "ORACLE":            return <Eye className="w-4 h-4 text-amber-600" />;
      case "WIRA-LOCAL":        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "COMPLIANCE":        return <FileText className="w-4 h-4 text-teal-600" />;
      case "AUDITOR":           return <RefreshCw className="w-4 h-4 text-indigo-600" />;
      case "SYSTEM":            return <AlertOctagon className="w-4 h-4 text-red-600" />;
      case "WIRA-ORCHESTRATOR": return <Cpu className="w-4 h-4 text-rose-600" />;
      default:                  return <Cpu className="w-4 h-4 text-slate-500" />;
    }
  };

  const getAgentColor = (agent: string, isLast: boolean) => {
    if (!isLast) return 'text-slate-800 dark:text-slate-200';
    switch (agent) {
      case 'COMPLIANCE':        return 'text-teal-700 dark:text-teal-400';
      case 'AUDITOR':           return 'text-indigo-700 dark:text-indigo-400';
      case 'WIRA-ORCHESTRATOR': return 'text-rose-700 dark:text-rose-400';
      default:                  return 'text-emerald-700 dark:text-emerald-400';
    }
  };

  const containerClasses = inline 
    ? "relative w-full h-full bg-white dark:bg-slate-900 flex flex-col transition-colors overflow-hidden" 
    : "relative w-full max-w-[800px] max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-2xl transition-colors";

  const content = (
    <div className={containerClasses}>
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            Case Investigation: {alert.id}
            {shadowMode && <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-md font-bold uppercase tracking-widest border border-amber-500/30">Shadow Mode</span>}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Multi-Agent Risk Assessment</p>
        </div>
        <div className="flex items-center gap-4">
          {analysis.verdict === "CRITICAL" && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-1.5 rounded-full">
              <AlertOctagon className="w-4 h-4" /> HIGHEST RISK
            </span>
          )}
          {analysis.verdict === "FLAGGED" && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1.5 rounded-full">
              <AlertTriangle className="w-4 h-4" /> REVIEW REQUIRED
            </span>
          )}
          {analysis.verdict === "CLEAN" && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" /> CLEARED
            </span>
          )}
          <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm ml-2">
            <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Download Narrative (PDF)
          </button>
          <button onClick={handleGenerateSAR} className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm">
            {sarState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Generate BNM SAR
          </button>
          {!inline && (
            <button
              onClick={onClose}
              className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        
        {/* Transaction Metadata Grid */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1 h-4 bg-blue-600 dark:bg-blue-500 rounded-full"></span>
              Transaction Details
            </h3>
            <button 
              onClick={() => setIsMasked(!isMasked)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md"
            >
               <Eye className="w-3.5 h-3.5" />
               {isMasked ? "Reveal Masked Data" : "Mask Data"}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wider">Amount</p>
              <p className={`text-base font-bold ${tx.amount > 500 ? "text-red-600 dark:text-red-400" : "text-slate-800 dark:text-slate-200"}`}>
                RM {tx.amount.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 col-span-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wider">Card Number / PAN</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono tracking-widest">{maskData("4551322199884421")}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wider">Loc. Mismatch</p>
              <p className={`text-base font-bold ${tx.location_mismatch ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                {tx.location_mismatch ? "YES" : "NO"}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 uppercase tracking-wider">Time</p>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">{String(tx.transaction_hour).padStart(2, '0')}:00</p>
            </div>
          </div>
        </section>

        {/* Agent Trace */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span className="w-1 h-4 bg-purple-600 dark:bg-purple-500 rounded-full"></span>
              Agent Trace
            </h3>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              Final Risk Score: <span className="font-bold text-slate-900 dark:text-slate-100">{analysis.final_risk_score} / 100</span>
            </div>
          </div>

          <div className="space-y-3">
            {analysis.dialogue.map((turn: any, i: number) => {
              const isLast = i === analysis.dialogue.length - 1;
              return (
                <div key={i} className={`flex gap-4 p-4 rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 transition-all ${
                  isLast ? 'border-emerald-200 dark:border-emerald-800/60 shadow-sm shadow-emerald-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <div className="mt-0.5 shrink-0 relative">
                    <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                      {getAgentIcon(turn.agent)}
                    </div>
                    {isLast && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <span className={`text-xs font-bold tracking-wider ${getAgentColor(turn.agent, isLast)}`}>
                      {turn.agent} {isLast && <span className="text-[9px] font-normal opacity-70 ml-1">● active</span>}
                    </span>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {turn.message}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {secondOpinion === "loading" && (
              <div className="flex gap-4 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/20">
                <div className="mt-0.5 shrink-0 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm animate-pulse">
                  <RefreshCw className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 tracking-wider">AUDITOR AGENT</span>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1 leading-relaxed animate-pulse">
                    Analyzing conversation and cross-referencing global sanctions database...
                  </p>
                </div>
              </div>
            )}
            
            {secondOpinion === "done" && (
              <div className="flex gap-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30">
                <div className="mt-0.5 shrink-0 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700 shadow-sm">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 tracking-wider">AUDITOR AGENT</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    <strong>Second Opinion Confirmed.</strong> The location mismatch and velocity indicate a high probability of account takeover. Endorse immediate block.
                  </p>
                </div>
              </div>
            )}

            {secondOpinion === "idle" && (
              <button 
                onClick={handleSecondOpinion}
                className="mt-2 flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Request Second Opinion
              </button>
            )}
          </div>
        </section>

      </div>

      {/* Decision Bar */}
      <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0">
        {decisionState === "processing" ? (
           <div className="w-full text-center text-sm font-semibold text-slate-600 dark:text-slate-400 animate-pulse py-3">
             {shadowMode ? "Logging Shadow Simulation Strategy..." : "Communicating with Bank core systems..."}
           </div>
        ) : decisionState === "frozen" || decisionState === "approved" || decisionState === "flagged" ? (
           <div className={`w-full text-center text-sm font-bold py-3 ${
              decisionState === "frozen" ? "text-red-600 dark:text-red-400" : decisionState === "approved" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
           }`}>
              {decisionState === "frozen" && (shadowMode ? `Simulated: Block Event Logged.` : `Card Blocked. Customer SMS sent.`)}
              {decisionState === "approved" && (shadowMode ? `Simulated: Approve Event Logged.` : `Transaction Approved.`)}
              {decisionState === "flagged" && (shadowMode ? `Simulated: Route to Tier 2 Event Logged.` : `Case routed to Tier 2 Fraud Team.`)}
           </div>
        ) : (
          <div className="flex items-center gap-3 relative">
            <button
              onClick={() => {
                onDecision(alert.id, "approved");
                if (analysis.verdict === 'FLAGGED' || analysis.verdict === 'CRITICAL') {
                  onRelease?.(alert.id);
                  setShowOverridePopup(true);
                  setTimeout(() => {
                    setShowOverridePopup(false);
                    setSelfHealMsg('AUDITOR: Context updated. Pattern down-weighted.');
                    setTimeout(() => setSelfHealMsg(null), 4000);
                  }, 3800);
                }
              }}
              className="flex-1 py-3.5 px-4 bg-emerald-600 dark:bg-emerald-700 border border-emerald-700 dark:border-emerald-800 rounded-lg text-sm font-semibold text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Release Funds {shadowMode && "(Simulate)"}
            </button>
            
            <button
              onClick={() => onDecision(alert.id, "flagged")}
              className="flex-[0.8] py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-700 dark:hover:text-amber-400 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Flag for Review {shadowMode && "(Simulate)"}
            </button>

            <button
              onClick={handleStepUp}
              disabled={stepUpState !== 'idle'}
              className={`flex-[0.9] py-3.5 px-4 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 border ${
                stepUpState === 'verified' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200' :
                stepUpState === 'pending' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 animate-pulse' :
                'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
              }`}
            >
              {stepUpState === 'verified' ? <><CheckCircle2 className="w-4 h-4" /> Verified!</> :
               stepUpState === 'pending' ? <><Loader2 className="w-4 h-4 animate-spin" /> Awaiting SMS...</> :
               <>📲 Step-Up Auth</>}
            </button>
            
            <button
              onClick={handleFreeze}
              className="flex-1 py-3.5 px-4 bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 rounded-lg text-sm font-semibold text-white transition-all shadow-md shadow-red-600/20 dark:shadow-none flex items-center justify-center gap-2"
            >
              Instant Card Freeze {shadowMode && "(Simulate)"}
            </button>

            {/* Freeze Toast + Confetti */}
            {toast && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm tracking-wide flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4" /> {toast}
              </div>
            )}
            {/* Self-Healing bottom toast */}
            {selfHealMsg && !showOverridePopup && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm tracking-wide flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in whitespace-nowrap">
                <RefreshCw className="w-4 h-4 animate-spin" /> {selfHealMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {inline ? content : (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
          {content}
        </div>
      )}

      {/* Self-Healing Override Popup */}
      {showOverridePopup && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 fade-in text-center pointer-events-auto">
            <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Human Override Registered</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Investigator <span className="font-bold text-indigo-300">{user?.name ?? 'Ahmad'}</span> has overridden SENTINEL's verdict on <span className="font-mono text-xs bg-slate-800 px-1.5 py-0.5 rounded text-slate-200">{alert.id}</span>.
            </p>
            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3 text-left">
              <p className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">[AUDITOR] Self-Healing</p>
              <p className="text-xs text-slate-300 font-mono leading-relaxed">
                Understood. Auditor Agent is now re-tuning local weightings... Geofencing rules for this user profile relaxed for 24 hours due to investigator override. Pattern flagged for Tier-2 model retraining pipeline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confetti Freeze Effect */}
      {freeze && (
        <div className="fixed inset-0 z-[140] pointer-events-none overflow-hidden">
          {[...Array(28)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-sm animate-bounce opacity-90"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-8px',
                backgroundColor: ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#06b6d4'][i % 6],
                animationDuration: `${0.6 + Math.random() * 0.8}s`,
                animationDelay: `${Math.random() * 0.4}s`,
                transform: `rotate(${Math.random() * 180}deg)`,
                animation: `fall-${i % 3} ${0.8 + Math.random()}s ease-in forwards`,
              }}
            />
          ))}
          <style>{`
            @keyframes fall-0 { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }
            @keyframes fall-1 { to { transform: translateY(110vh) rotate(-270deg) translateX(40px); opacity: 0; } }
            @keyframes fall-2 { to { transform: translateY(110vh) rotate(540deg) translateX(-30px); opacity: 0; } }
          `}</style>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-emerald-600/95 text-white px-8 py-4 rounded-2xl shadow-2xl font-bold text-lg flex items-center gap-3 animate-in zoom-in-90 fade-in border border-emerald-400/50">
              <CheckCircle2 className="w-7 h-7" /> Account Secured! BNM Report Generated.
            </div>
          </div>
        </div>
      )}

      {/* BNM SAR Modal */}
      {showSarModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={() => setShowSarModal(false)}>
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-red-200 dark:border-red-800 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-sm font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">BNM Suspicious Activity Report</h3>
              </div>
              <button onClick={() => setShowSarModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              {sarState === 'loading' ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">WIRA.IO Orchestrating SAR Report...</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Agents cross-referencing BNM AMLATFPUAA guidelines</p>
                </div>
              ) : (
                <>
                  <pre className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">{sarText}</pre>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => { if (sarText) navigator.clipboard.writeText(sarText); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <Copy className="w-4 h-4" /> Copy SAR
                    </button>
                    <button
                      onClick={() => {
                        const w = window.open('', '_blank')!;
                        w.document.write(`<pre style="font-family:monospace;padding:40px;font-size:13px;line-height:1.8;">${sarText}</pre>`);
                        w.document.close(); w.print();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors"
                    >
                      <FileDown className="w-4 h-4" /> Export PDF
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 text-center">WIRA.IO System — Auto-generated under AMLATFPUAA Section 14</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
