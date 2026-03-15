"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DecisionCenter } from "@/components/DecisionCenter";
import { Activity, ShieldCheck, Database, Loader2, PlayCircle, StopCircle, BellRing, MoreHorizontal, CheckCircle2, UploadCloud, Moon, Sun, User as UserIcon, Zap, TrendingUp, Server, LogOut, Settings, X, Trash2, Bell, BarChart3, RefreshCw, Search, SlidersHorizontal } from "lucide-react";

export interface Alert {
  id: string;
  transaction: any;
  debate: {
    final_risk_score: number;
    dialogue: any[];
    verdict: string;
  };
  status: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  
  const [simState, setSimState] = useState<"off" | "live">("off");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [decisionStates, setDecisionStates] = useState<Record<string, string>>({});
  
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<{id:string, msg:string, type:string, time:string}[]>([]);
  const [globalToast, setGlobalToast] = useState<{msg:string, type:"success"|"error"|"info"}|null>(null);
  const [realtimeLogs, setRealtimeLogs] = useState<{id: string, time: string, msg: string, verdict?: string}[]>([]);
  const [swarmLogs, setSwarmLogs] = useState<{agent: string, message: string}[]>([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, flagged: 0, clean: 0, resolved: 0 });
  
  const [shadowMode, setShadowMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [riskThreshold, setRiskThreshold] = useState(65);
  const [suspendedAccounts, setSuspendedAccounts] = useState<string[]>([]);
  const [inboxFilter, setInboxFilter] = useState<'ALL' | 'CRITICAL' | 'FLAGGED'>('ALL');
  const [inboxSearch, setInboxSearch] = useState('');
  const [forceStaticRules, setForceStaticRules] = useState(false);
  // Live sparkline data
  const [latencyVal, setLatencyVal] = useState(24);
  const [confidenceVal, setConfidenceVal] = useState(98.2);
  const [latencyPoints, setLatencyPoints] = useState([10,12,8,14,5,7]);
  const [confidencePoints, setConfidencePoints] = useState([14,12,6,8,4,2]);
  
  const riskThresholdRef = useRef(riskThreshold);
  useEffect(() => { riskThresholdRef.current = riskThreshold; }, [riskThreshold]);
  const forceStaticRulesRef = useRef(forceStaticRules);
  useEffect(() => { forceStaticRulesRef.current = forceStaticRules; }, [forceStaticRules]);
  const shadowModeRef = useRef(shadowMode);
  useEffect(() => { shadowModeRef.current = shadowMode; }, [shadowMode]);

  // Animate sparklines every 2.5s to look live
  useEffect(() => {
    const id = setInterval(() => {
      setLatencyVal(v => Math.max(8, Math.min(60, v + (Math.random() - 0.5) * 6)));
      setConfidenceVal(v => Math.max(91, Math.min(99.8, v + (Math.random() - 0.5) * 0.8)));
      setLatencyPoints(p => { const next = [...p.slice(1), Math.random() * 13 + 2]; return next; });
      setConfidencePoints(p => { const next = [...p.slice(1), Math.random() * 6]; return next; });
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gemini AI-powered transaction analysis
  const fetchAlertTx = useCallback(async () => {
    try {
      const categories = ["Electronics", "Food & Dining", "Travel", "Clothing", "ATM Withdrawal", "Online Shopping", "Jewellery", "Pharmacy", "Petrol", "Entertainment"];
      const transaction = {
        transaction_id: Math.floor(Math.random() * 99999) + 1000,
        amount: parseFloat((Math.random() * 2000 + 15).toFixed(2)),
        merchant_category: categories[Math.floor(Math.random() * categories.length)],
        location_mismatch: Math.random() < 0.35,
        transaction_hour: Math.floor(Math.random() * 24),
      };

      // Call Gemini — pass riskThreshold so AI knows current aggression level
      // Circuit Breaker: if forceStaticRules is on, skip Gemini and use deterministic rules
      let debate;
      if (forceStaticRulesRef.current) {
        // L1 static IsolationForest-style rules
        const score = Math.min(100, Math.round(
          (transaction.location_mismatch ? 35 : 0) +
          (transaction.transaction_hour < 5 || transaction.transaction_hour > 22 ? 20 : 0) +
          (['Electronics','Jewellery','ATM Withdrawal'].includes(transaction.merchant_category) ? 25 : 5) +
          (transaction.amount > 1000 ? 15 : transaction.amount > 500 ? 8 : 2)
        ));
        debate = {
          dialogue: [
            { agent: 'SENTINEL', message: `[STATIC RULES] Amount ${transaction.amount > 1000 ? 'HIGH' : 'NORMAL'}, category ${transaction.merchant_category}, geo-mismatch: ${transaction.location_mismatch}.` },
            { agent: 'ORACLE', message: '[STATIC RULES] Gemini offline. Falling back to IsolationForest baseline model.' },
            { agent: 'WIRA-LOCAL', message: '[STATIC RULES] Circuit breaker active. AI inference bypassed for operational resilience.' },
            { agent: 'SYSTEM', message: `[STATIC RULES] Score: ${score}/100. Verdict based on deterministic thresholds.` },
          ],
          final_risk_score: score,
          verdict: score >= 66 ? 'CRITICAL' : score >= 31 ? 'FLAGGED' : 'CLEAN',
          _static: true,
        };
      } else {
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transaction, riskThreshold: riskThresholdRef.current }),
        });
        if (!res.ok) return;
        debate = await res.json();
      }

      const txId = `TX-${transaction.transaction_id.toString().padStart(5, "0")}`;
      const alertId = `ALT-${transaction.transaction_id.toString().padStart(5, "0")}`;
      const accountRef = `ACC-${Math.floor(Math.random() * 9000) + 1000}`;

      // ── KILL-SWITCH: Auto-suspend if risk > 95 ──
      if (debate.final_risk_score > 95 && !shadowModeRef.current) {
        const suspendMsg = `🚨 SWARM INTERVENTION: WIRA.IO has autonomously suspended ${accountRef}. Risk score ${debate.final_risk_score}/100 exceeded threshold. Human review required to reactivate.`;
        setSuspendedAccounts(prev => [...prev, accountRef]);
        setNotifications(prev => [{ id: alertId, msg: suspendMsg, type: 'KILLSWITCH', time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
        setSwarmLogs(prev => [{ agent: 'WIRA-ORCHESTRATOR', message: `AUTONOMOUS ACTION: Account ${accountRef} suspended. Risk score ${debate.final_risk_score}/100 breached the kill-switch threshold (95). No human intervention required for suspension.` }, ...prev].slice(0, 80));
        setGlobalToast({ msg: `🔴 Kill-Switch Activated: ${accountRef} auto-suspended.`, type: 'error' });
        setTimeout(() => setGlobalToast(null), 5000);
      }

      // Only flag as alert if above the confidence slider threshold
      const effectiveThreshold = riskThresholdRef.current;
      if (debate.final_risk_score >= effectiveThreshold) {
        // Use timestamp-suffixed ID to prevent collision on rapid simulation
        const uniqueSuffix = Date.now().toString(36).slice(-3).toUpperCase();
        const uniqueAlertId = `ALT-${transaction.transaction_id.toString().padStart(5, "0")}-${uniqueSuffix}`;
        const newAlert: Alert = { id: uniqueAlertId, transaction, debate, status: "pending" };
        setAlerts(prev => [newAlert, ...prev].slice(0, 30));
        fetch("/api/alerts", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ id: uniqueAlertId, transaction, debate, status: "pending" }) });
        const note = { id: uniqueAlertId, msg: `${debate.verdict}: RM ${transaction.amount.toFixed(2)} at ${transaction.merchant_category} (Risk: ${debate.final_risk_score})`, type: debate.verdict, time: new Date().toLocaleTimeString() };
        setNotifications(prev => [note, ...prev].slice(0, 20));
      }

      const newLog = { id: txId, time: new Date().toLocaleTimeString(), msg: `RM ${transaction.amount.toFixed(2)} at ${transaction.merchant_category}`, verdict: debate.verdict };
      setRealtimeLogs(prev => [newLog, ...prev].slice(0, 80));

      const newSwarm = debate.dialogue.map((d: any) => ({ agent: d.agent, message: d.message }));
      setSwarmLogs(prev => [...newSwarm, ...prev].slice(0, 80));

      setStats(prev => ({
        total: prev.total + 1,
        critical: prev.critical + (debate.verdict === "CRITICAL" ? 1 : 0),
        flagged: prev.flagged + (debate.verdict === "FLAGGED" ? 1 : 0),
        clean: prev.clean + (debate.verdict === "CLEAN" ? 1 : 0),
        resolved: prev.resolved,
      }));
    } catch {
      // silently ignore
    }
  }, []);

  const showToast = (msg: string, type: "success"|"error"|"info" = "info") => {
    setGlobalToast({ msg, type });
    setTimeout(() => setGlobalToast(null), 3500);
  };

  // ── DEMO KILL-SWITCH: Guaranteed trigger for presentation ──
  const demoKillSwitch = useCallback(() => {
    const accountRef = `ACC-${Math.floor(Math.random() * 9000) + 1000}`;
    const txId = `TX-99999`;
    const alertId = `ALT-99999`;
    const fakeTx = {
      transaction_id: 99999,
      amount: 12500.00,
      merchant_category: "Jewellery",
      location_mismatch: true,
      transaction_hour: 3,
    };
    const fakeDebate = {
      dialogue: [
        { agent: "SENTINEL", message: "CRITICAL: Geo-mismatch confirmed. Velocity spike: 8 transactions in 24h. 03:00 activity window — extreme anomaly." },
        { agent: "ORACLE", message: "Behavioural deviation +340% from baseline. RM12,500 in Jewellery at 3AM — structuring pattern detected." },
        { agent: "WIRA-LOCAL", message: "No festive calendar match. No DuitNow pattern. Foreign origin confirmed. No local context suppression applicable." },
        { agent: "COMPLIANCE", message: "AMLATFPUAA S.14 ALERT: Jewellery category on AML watchlist. Amount exceeds BNM mandatory review threshold. Sanctions cross-check: FLAGGED." },
        { agent: "SYSTEM", message: "OVERRIDE REQUIRED: Composite risk 99/100. All agents unanimous — CRITICAL verdict. Autonomous kill-switch engaged." },
      ],
      final_risk_score: 99,
      verdict: "CRITICAL",
    };
    // Fire kill-switch
    const suspendMsg = `🚨 SWARM INTERVENTION: WIRA.IO has autonomously suspended ${accountRef}. Risk score 99/100 exceeded threshold. Human review required to reactivate.`;
    setSuspendedAccounts(prev => [...prev, accountRef]);
    setNotifications(prev => [{ id: alertId, msg: suspendMsg, type: 'KILLSWITCH', time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    setSwarmLogs(prev => [
      { agent: 'WIRA-ORCHESTRATOR', message: `AUTONOMOUS ACTION: Account ${accountRef} suspended. Risk score 99/100 breached kill-switch threshold. No human intervention required.` },
      ...fakeDebate.dialogue.map(d => ({ agent: d.agent, message: d.message })),
      ...prev
    ].slice(0, 80));
    setGlobalToast({ msg: `🔴 Kill-Switch Activated: ${accountRef} auto-suspended. Risk 99/100.`, type: 'error' });
    setTimeout(() => setGlobalToast(null), 6000);
    // Add to alert inbox
    const newAlert: Alert = { id: alertId, transaction: fakeTx, debate: fakeDebate, status: "pending" };
    setAlerts(prev => [newAlert, ...prev].slice(0, 30));
    setRealtimeLogs(prev => [{ id: txId, time: new Date().toLocaleTimeString(), msg: `RM 12,500.00 at Jewellery — KILL-SWITCH`, verdict: 'CRITICAL' }, ...prev].slice(0, 80));
    setStats(prev => ({ ...prev, total: prev.total + 1, critical: prev.critical + 1 }));
  }, []);

  // Ctrl+K = instant demo kill-switch
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        demoKillSwitch();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [demoKillSwitch]);

  const demoKillSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function toggleSim() {
    if (simState === "live") {
      setSimState("off");
      if (simRef.current) clearInterval(simRef.current);
      if (demoKillSwitchTimerRef.current) clearTimeout(demoKillSwitchTimerRef.current);
    } else {
      setSimState("live");
      fetchAlertTx(); // fetch one immediately
      simRef.current = setInterval(fetchAlertTx, 3000);
      // Auto-fire kill-switch 60s after simulation starts (guaranteed demo moment)
      demoKillSwitchTimerRef.current = setTimeout(() => {
        demoKillSwitch();
      }, 60000);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { showToast("Please upload a .csv file", "error"); return; }

    setUploading(true);
    setUploadProgress(10);
    const interval = setInterval(() => { setUploadProgress(p => (p < 85 ? p + 12 : p)); }, 400);

    // Parse CSV client-side and run Gemini analysis on each row
    const text = await file.text();
    const lines = text.trim().split("\n").slice(1, 21); // up to 20 rows
    clearInterval(interval);
    setUploadProgress(50);

    let newAlerts: Alert[] = [];
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const parts = lines[i].split(",");
      const transaction = {
        transaction_id: parseInt(parts[0]) || Math.floor(Math.random() * 99999),
        amount: parseFloat(parts[4]) || parseFloat((Math.random() * 1500 + 50).toFixed(2)),
        merchant_category: (parts[5] || "Unknown").replace(/"/g, ""),
        location_mismatch: parts[9] === "1" || Math.random() < 0.3,
        transaction_hour: parseInt(parts[3]) || Math.floor(Math.random() * 24),
      };
      try {
        const res = await fetch("/api/gemini", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ transaction, riskThreshold: riskThresholdRef.current }) });
        const debate = await res.json();
        if (debate.verdict === "CRITICAL" || debate.verdict === "FLAGGED") {
          const alertId = `ALT-${transaction.transaction_id.toString().padStart(5, "0")}`;
          const alert: Alert = { id: alertId, transaction, debate, status: "pending" };
          newAlerts.push(alert);
          fetch("/api/alerts", { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ id: alertId, transaction, debate, status: "pending" }) });
        }
      } catch { /* continue */ }
    }

    setUploadProgress(100);
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
    }
    showToast(`✅ Batch processed: ${lines.length} transactions analyzed. ${newAlerts.length} risk alerts generated.`, "success");
    setTimeout(() => { setUploading(false); setUploadProgress(0); if (e.target) e.target.value = ""; }, 1500);
  }

  useEffect(() => {
    // 1. RBAC Session Management & Timeout
    const checkSession = () => {
      const stored = localStorage.getItem("wira_user");
      const expiry = localStorage.getItem("wira_expiry");
      
      if (!stored || !expiry || Date.now() > parseInt(expiry)) {
        localStorage.removeItem("wira_user");
        localStorage.removeItem("wira_expiry");
        router.push("/login");
      } else {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        // Reset timer on activity (simulated by component mount)
        localStorage.setItem("wira_user", JSON.stringify(parsedUser)); // Update with current user data
        localStorage.setItem("wira_expiry", (Date.now() + 5 * 60 * 1000).toString());
      }
    };
    
    // Initial Auth
    checkSession();
    
    // Auto-timeout hook
    const interval = setInterval(checkSession, 30000);
    
    // Load saved Theme
    const savedTheme = localStorage.getItem("wira_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }

    return () => {
      if (simRef.current) clearInterval(simRef.current);
      clearInterval(interval);
    };
  }, [router]);

  function toggleTheme() {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("wira_theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  }

  async function logAuditAction(alertId: string, action: string) {
      if (!user) return;
      try {
          await fetch('/api/audit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  timestamp: new Date().toISOString(),
                  user,
                  action,
                  alertId
              })
          });
      } catch(e) { console.error("Failed to log audit", e) }
  }

  function handleDecision(alertId: string, action: string) {
    // In shadow mode: tag status with shadow_ prefix so labels are accurate
    const resolvedStatus = shadowMode ? `shadow_${action}` : action;

    if (shadowMode) {
      setDecisionStates((prev) => ({ ...prev, [alertId]: "processing" }));
      setTimeout(() => {
        setDecisionStates((prev) => ({ ...prev, [alertId]: resolvedStatus }));
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: resolvedStatus } : a)));
        logAuditAction(alertId, `SHADOW_${action.toUpperCase()}`);
        setStats(prev => ({ ...prev, resolved: prev.resolved + 1 }));
        setTimeout(() => setSelectedAlert(null), 1800);
      }, 1500);
      return;
    }

    setDecisionStates((prev) => ({ ...prev, [alertId]: "processing" }));
    setTimeout(() => {
      setDecisionStates((prev) => ({ ...prev, [alertId]: action }));
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: action } : a)));
      logAuditAction(alertId, action.toUpperCase());
      setStats(prev => ({ ...prev, resolved: prev.resolved + 1 }));
      // CRUD: persist the decision via API
      fetch(`/api/alerts`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ id: alertId, status: action }) });
      setTimeout(() => setSelectedAlert(null), 1800);
    }, 1500);
  }

  function handleDeleteAlert(alertId: string) {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    fetch(`/api/alerts?id=${alertId}`, { method: "DELETE" });
    if (selectedAlert?.id === alertId) setSelectedAlert(null);
    showToast(`Alert ${alertId} deleted.`, "info");
  }

  const pendingAlerts = alerts.filter(a => a.status === "pending" || decisionStates[a.id] === "processing");
  const resolvedAlerts = alerts.filter(a => a.status !== "pending" && decisionStates[a.id] !== "processing");

  if (!user) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className={`h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'dark bg-slate-900' : 'bg-slate-50'} ${shadowMode ? 'ring-4 ring-inset ring-amber-400/50 shadow-[inset_0_0_40px_rgba(251,191,36,0.08)]' : ''}`}>
      
      {/* ── Top Bar ── */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-10 transition-colors">
        {/* Left Nav Group */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-lg">WIRA.IO <span className="text-slate-400 dark:text-slate-500 font-medium">| Fraud Center</span></h1>
            <span className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-full">
              <CheckCircle2 className="w-3 h-3" /> BNM Compliant
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <Zap className="w-4 h-4 text-amber-500" />
              <div className="flex flex-col">
                <span className="text-xs leading-none">System Latency</span>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-slate-800 dark:text-slate-200 font-bold leading-none">{Math.round(latencyVal)}ms</span>
                  <svg className="w-12 h-3" viewBox="0 0 50 15">
                    <polyline
                      points={latencyPoints.map((v,i) => `${i*(50/5)},${15-v}`).join(' ')}
                      fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-amber-500" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-xs leading-none">Agent Confidence</span>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-slate-800 dark:text-slate-200 font-bold leading-none">{confidenceVal.toFixed(1)}%</span>
                  <svg className="w-12 h-3" viewBox="0 0 50 15">
                    <polyline
                      points={confidencePoints.map((v,i) => `${i*(50/5)},${15-v*2}`).join(' ')}
                      fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-emerald-500" strokeLinecap="round" strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Nav Group */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSim}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hidden md:flex
              ${simState === "live" 
                ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
          >
            {simState === "live" ? (
              <><StopCircle className="w-4 h-4" /> Stop Live Stream</>
            ) : (
              <><PlayCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Simulate Live Feed</>
            )}
          </button>
          
          {/* Confidence Slider */}
          <div className="hidden lg:flex flex-col gap-0.5 border-r border-slate-200 dark:border-slate-700 pr-4">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Customer First</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Security First</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range" min="30" max="95" value={riskThreshold}
                onChange={e => setRiskThreshold(Number(e.target.value))}
                className="w-28 h-1.5 rounded-full cursor-pointer accent-emerald-600"
              />
              <span className={`text-xs font-bold min-w-[32px] ${
                riskThreshold > 75 ? 'text-red-500' : riskThreshold > 55 ? 'text-amber-500' : 'text-emerald-600'
              }`}>{riskThreshold}%</span>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-4">
            <span className={`text-sm font-bold transition-colors ${shadowMode ? "text-slate-400 dark:text-slate-500" : "text-emerald-600 dark:text-emerald-400"}`}>Live</span>
            <button 
              onClick={() => setShadowMode(!shadowMode)}
              className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${shadowMode ? "bg-amber-400 dark:bg-amber-500" : "bg-emerald-500"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${shadowMode ? "translate-x-6" : ""}`} />
            </button>
            <span className={`text-sm font-bold transition-colors ${shadowMode ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>Shadow</span>
          </div>

          <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          {/* Notifications Bell */}
          <div className="relative">
            <button onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); setShowSettings(false); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-[110%] w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                  {notifications.length > 0 && <button onClick={() => setNotifications([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear all</button>}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">No new notifications</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-0 flex items-start gap-3">
                        <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.type === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{n.msg}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button onClick={() => { setShowSettings(!showSettings); setShowProfile(false); setShowNotifications(false); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="relative pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-700">
            <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">{user.role} • {user.branch}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm shrink-0">
                {user.initials}
              </div>
            </button>
            {showProfile && (
              <div className="absolute right-0 top-[110%] w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.name.toLowerCase().replace(/\s/g, '.')}@wira.io</p>
                </div>
                <div className="px-2 py-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md flex items-center gap-2"><UserIcon className="w-4 h-4" /> Profile Settings</button>
                  <button className="w-full text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md flex items-center gap-2"><Settings className="w-4 h-4" /> System Preferences</button>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 px-2 pt-2">
                  <button onClick={() => { localStorage.removeItem("wira_user"); localStorage.removeItem("wira_expiry"); router.push("/login"); }} className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Global Toast ── */}
      {globalToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2.5 animate-in slide-in-from-bottom-3 fade-in ${
          globalToast.type === 'success' ? 'bg-emerald-600 text-white' :
          globalToast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
        }`}>
          {globalToast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : globalToast.type === 'error' ? <X className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
          {globalToast.msg}
        </div>
      )}

      {/* ── Settings Panel ── */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowSettings(false)}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">System Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dark Mode</p><p className="text-xs text-slate-500">Toggle interface theme</p></div>
                <button onClick={toggleTheme} className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${theme === 'dark' ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Shadow Mode</p><p className="text-xs text-slate-500">Simulate decisions without executing</p></div>
                <button onClick={() => setShadowMode(!shadowMode)} className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${shadowMode ? 'bg-amber-400' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${shadowMode ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">AI Engine</p><p className="text-xs text-slate-500">Powered by Gemini 1.5 Flash</p></div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full border ${ forceStaticRules ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'}`}>{forceStaticRules ? 'Static Rules ⚠' : 'Active ✓'}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">⚡ Circuit Breaker</p>
                  <p className="text-xs text-slate-500">{forceStaticRules ? 'AI offline — using IsolationForest static rules' : 'AI online — Gemini 1.5 Flash active'}</p>
                </div>
                <button onClick={() => { setForceStaticRules(f => !f); }} className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${forceStaticRules ? 'bg-amber-400' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${forceStaticRules ? 'translate-x-6' : ''}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <div><p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Session</p><p className="text-xs text-slate-500">{user.name} — Auto-expire 5 mins</p></div>
                <button onClick={() => { localStorage.removeItem('wira_user'); localStorage.removeItem('wira_expiry'); router.push('/login'); }} className="text-xs font-bold text-red-600 hover:underline">Sign Out</button>
              </div>
              <div className="pt-2">
                <div className="grid grid-cols-3 gap-3">
                  {[{label:'Total TXN', val:stats.total},{label:'Critical',val:stats.critical},{label:'Resolved',val:stats.resolved}].map(s => (
                    <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center border border-slate-100 dark:border-slate-700">
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{s.val}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        
        {/* Sidebar: Alert Inbox */}
        <aside className="w-[380px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors">
          {/* Inbox Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-2 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <BellRing className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                Alert Inbox
              </h2>
              {pendingAlerts.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                  {pendingAlerts.length} Pending
                </span>
              )}
            </div>
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={inboxSearch}
                onChange={e => setInboxSearch(e.target.value)}
                placeholder="Search alert ID or merchant..."
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-600"
              />
              {inboxSearch && (
                <button onClick={() => setInboxSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Filter chips */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {(['ALL', 'CRITICAL', 'FLAGGED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setInboxFilter(f)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest transition-colors ${
                    inboxFilter === f
                      ? f === 'CRITICAL' ? 'bg-red-500 text-white border-red-600'
                        : f === 'FLAGGED' ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-slate-700 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-300'
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
              {(inboxFilter !== 'ALL' || inboxSearch) && (
                <span className="text-[10px] text-slate-400 ml-auto">
                  {pendingAlerts.filter(a =>
                    (inboxFilter === 'ALL' || a.debate.verdict === inboxFilter) &&
                    (!inboxSearch || a.id.toLowerCase().includes(inboxSearch.toLowerCase()) || a.transaction.merchant_category?.toLowerCase().includes(inboxSearch.toLowerCase()))
                  ).length} shown
                </span>
              )}
            </div>
          </div>

          {/* ── Pending section (top ~2/3, independently scrollable) ── */}
          <div className="flex-[2] overflow-y-auto min-h-0 bg-slate-50/30 dark:bg-slate-900/30">
            {pendingAlerts.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4 h-full">
                <div className="w-24 h-24 bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-center rounded-3xl mb-2 border border-blue-100 dark:border-blue-800 shadow-inner rotate-3 transition-transform hover:rotate-0">
                  <Database className="w-10 h-10 text-blue-400 dark:text-blue-500" />
                </div>
                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Ready to Ingest Data</h3>
                <p className="text-sm font-medium px-4">Upload historical data for retraining or simulate a live stream.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingAlerts
                  .filter(a =>
                    (inboxFilter === 'ALL' || a.debate.verdict === inboxFilter) &&
                    (!inboxSearch || a.id.toLowerCase().includes(inboxSearch.toLowerCase()) || a.transaction.merchant_category?.toLowerCase().includes(inboxSearch.toLowerCase()))
                  )
                  .map(alert => (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className={`p-4 bg-white dark:bg-slate-900 hover:bg-blue-50/50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-l-4 group relative ${
                      alert.debate.verdict === 'CRITICAL' ? 'border-l-red-500 dark:border-l-red-600' : 'border-l-amber-400 dark:border-l-amber-500'
                    } ${selectedAlert?.id === alert.id ? 'bg-blue-50/70 dark:bg-slate-800' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        {alert.id}
                        {shadowMode && <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded font-bold uppercase tracking-widest">Shadow</span>}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                          alert.debate.verdict === 'CRITICAL' ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' :
                          'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20'
                        }`}>{alert.debate.verdict}</span>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteAlert(alert.id); }}
                          className="text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors p-1 rounded"
                          title="Delete alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-lg font-bold text-slate-800 dark:text-slate-200">RM {alert.transaction.amount.toFixed(2)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{alert.transaction.merchant_category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400 dark:text-slate-500">Risk: <span className="font-bold text-slate-700 dark:text-slate-300">{alert.debate.final_risk_score}/100</span></p>
                        <p className="text-[10px] text-slate-400">{alert.transaction.location_mismatch ? '⚠ Location Mismatch' : '📍 Location OK'}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingAlerts.length > 0 && pendingAlerts.filter(a => inboxFilter === 'ALL' || a.debate.verdict === inboxFilter).length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No {inboxFilter} alerts at this time.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Resolved section (bottom ~1/3, always visible, independently scrollable) ── */}
          <div className="flex-[1] min-h-0 flex flex-col border-t-2 border-slate-200 dark:border-slate-700 shrink-0">
            <div className="px-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Resolved Cases
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{resolvedAlerts.length} total</span>
            </div>
            <div className="overflow-y-auto flex-1 min-h-0">
              {resolvedAlerts.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-slate-400 dark:text-slate-500">No resolved cases yet.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {resolvedAlerts.map(alert => {
                    const isShadowLog = alert.status.startsWith('shadow_');
                    const actionLabel = isShadowLog
                      ? 'Simulated ' + alert.status.split('_')[1]
                      : alert.status === 'approved' ? 'Released' : alert.status === 'frozen' ? 'Frozen' : 'Flagged';
                    const actionColor = alert.status === 'approved' || isShadowLog ? 'text-emerald-600 dark:text-emerald-400' : alert.status === 'frozen' ? 'text-red-500 dark:text-red-400' : 'text-amber-500 dark:text-amber-400';
                    return (
                      <div key={alert.id} className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-through">{alert.id}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">RM {alert.transaction.amount.toFixed(2)} · {alert.transaction.merchant_category}</p>
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 ${actionColor}`}>{actionLabel}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors">
          {selectedAlert ? (
            <div className="absolute inset-0 overflow-y-auto w-full h-full bg-white dark:bg-slate-900 z-10 isolate">
              <DecisionCenter
                alert={selectedAlert}
                user={user}
                shadowMode={shadowMode}
                onClose={() => setSelectedAlert(null)}
                onDecision={handleDecision}
                decisionState={decisionStates[selectedAlert.id] || null}
                inline={true}
                onRelease={(alertId: string) => {
                  // Self-Healing: inject auditor learning message into swarm feed
                  setSwarmLogs(prev => [{
                    agent: 'AUDITOR',
                    message: `Self-Healing Protocol activated. Banker released alert ${alertId}. Updating local context — this transaction pattern will be down-weighted for this user profile going forward.`
                  }, ...prev].slice(0, 80));
                  setNotifications(prev => [{
                    id: alertId,
                    msg: `Self-Healing: AUDITOR updated context after manual release of ${alertId}.`,
                    type: 'LEARN',
                    time: new Date().toLocaleTimeString()
                  }, ...prev].slice(0, 20));
                  // Write reasoning trace to /vault/reasoning_traces/
                  const rel = alerts.find(a => a.id === alertId);
                  fetch('/api/vault', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      alertId,
                      eventType: 'SELF_HEAL',
                      originalVerdict: rel?.debate.verdict ?? 'UNKNOWN',
                      originalRiskScore: rel?.debate.final_risk_score ?? 0,
                      humanAction: 'RELEASE_FUNDS',
                      investigator: user?.name ?? 'System',
                      auditorResponse: 'Geofencing rules relaxed for 24h. Pattern flagged for Tier-2 retraining.',
                      learningApplied: 'Down-weighted this transaction pattern for user profile.',
                      pipelineStage: 'L3_MEMORY',
                    }),
                  }).catch(() => {/* vault write failed silently */});
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-8 h-full">
              {/* TCO Savings Widget */}
              {resolvedAlerts.length > 0 && (
                <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-5 py-3 shadow-sm">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-0.5">Estimated Savings This Session</p>
                    <div className="flex items-center gap-5">
                      <div>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{resolvedAlerts.length * 4}h</p>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500">Man-Hours Saved</p>
                      </div>
                      <div className="w-px h-8 bg-emerald-200 dark:bg-emerald-800" />
                      <div>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{Math.min(99, 18 + resolvedAlerts.length * 2)}%</p>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500">False Positive Reduction</p>
                      </div>
                      <div className="w-px h-8 bg-emerald-200 dark:bg-emerald-800" />
                      <div>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">RM {(resolvedAlerts.length * 250).toLocaleString()}</p>
                        <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500">Est. Fraud Prevented</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {simState === "live" ? (
                <div className="w-full h-[90%] flex flex-col max-w-4xl mx-auto items-start text-left bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                  <div className="flex items-center gap-3 mb-6 shrink-0">
                    <div className="relative">
                      <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-ping"></div>
                      <div className="w-3 h-3 bg-emerald-500 rounded-full relative z-10"></div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Real-Time Scrolling Log</h3>
                  </div>
                  <div className="flex-1 w-full overflow-y-auto space-y-2 pr-2">
                    {realtimeLogs.map((log, i) => (
                      <div key={i} className="flex gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm border border-slate-100 dark:border-slate-700/50 font-mono animate-in fade-in slide-in-from-top-2">
                        <span className="text-slate-400 w-24 shrink-0">{log.time}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold w-20 shrink-0">{log.id}</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate">{log.msg}</span>
                      </div>
                    ))}
                    {realtimeLogs.length === 0 && (
                      <div className="text-center text-slate-400 py-10 w-full">Waiting for stream data...</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 p-10 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md w-full shrink-0">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800/80 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Security Feed Idle</h3>
                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                      Click <strong>Simulate Live Feed</strong> in the top bar to begin processing the transaction queue using multi-agent algorithms.
                    </p>
                    <button
                      onClick={toggleSim}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-semibold shadow-md shadow-blue-600/20 dark:shadow-none transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                    >
                      <PlayCircle className="w-5 h-5 text-blue-100 dark:text-blue-200" /> Start Processing
                    </button>
                  </div>
                </div>
              )}

              {/* Data Intake Section */}
              {simState !== "live" && (
                <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 text-left shrink-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    Data Intake
                  </h4>
                  
                  {uploading ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-blue-500 dark:text-blue-400" /> 
                          Autonomous Agent is generating detection logic...
                        </span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-lg cursor-pointer bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Upload Transaction Batch (CSV)</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 hover:underline">Click or drag and drop</p>
                      </div>
                      <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
        
        {/* Right Sidebar: Swarm Reasoning */}
        <aside className="w-[320px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 transition-colors hidden xl:flex">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col gap-1 shrink-0">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              Swarm Reasoning
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live multi-agent negotiation feed.</p>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30 dark:bg-slate-900/30 p-4 space-y-3">
             {swarmLogs.map((log, i) => (
               <div key={i} className={`text-left bg-white dark:bg-slate-800 border p-3 rounded-lg shadow-sm animate-in fade-in slide-in-from-right-2 ${
                 log.agent === 'WIRA-ORCHESTRATOR' ? 'border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-900/10' :
                 log.agent === 'AUDITOR'           ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-900/10' :
                 log.agent === 'COMPLIANCE'        ? 'border-teal-300 dark:border-teal-700 bg-teal-50/40 dark:bg-teal-900/10' :
                 log.agent === 'SYSTEM'            ? 'border-red-200 dark:border-red-800/50' :
                 'border-slate-200 dark:border-slate-700'
               }`}>
                 <div className={`text-[10px] font-bold mb-1 tracking-widest uppercase flex items-center gap-1.5 ${
                   log.agent === 'WIRA-ORCHESTRATOR' ? 'text-rose-600 dark:text-rose-400' :
                   log.agent === 'AUDITOR'           ? 'text-indigo-600 dark:text-indigo-400' :
                   log.agent === 'COMPLIANCE'        ? 'text-teal-600 dark:text-teal-400' :
                   log.agent === 'SYSTEM'            ? 'text-red-600 dark:text-red-400' :
                   log.agent === 'SENTINEL'          ? 'text-blue-600 dark:text-blue-400' :
                   log.agent === 'ORACLE'            ? 'text-amber-600 dark:text-amber-400' :
                   log.agent === 'WIRA-LOCAL'        ? 'text-emerald-600 dark:text-emerald-400' :
                   'text-slate-500 dark:text-slate-400'
                 }`}>
                   {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />}
                   [{log.agent}]
                 </div>
                 <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono">'{log.message}'</div>
               </div>
             ))}
             {swarmLogs.length === 0 && simState === 'off' && (
               <div className="text-xs text-slate-400 dark:text-slate-500 text-center mt-10 w-full">Awaiting stream data...</div>
             )}
             {swarmLogs.length === 0 && simState === 'live' && (
               <div className="space-y-3 w-full">
                 <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Scanning for anomalies...
                 </div>
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg">
                     <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" style={{width: `${40 + i * 12}%`}} />
                     <div className="h-2 bg-slate-100 dark:bg-slate-700/60 rounded animate-pulse mb-1" />
                     <div className="h-2 bg-slate-100 dark:bg-slate-700/60 rounded animate-pulse" style={{width: '75%'}} />
                   </div>
                 ))}
               </div>
             )}
          </div>
        </aside>
      </div>
    </div>
  );
}
