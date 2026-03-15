"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, KeyRound, AlertCircle, Eye, EyeOff } from "lucide-react";

const VALID_USERS: Record<string, { minPasswordLen: number; profile: object }> = {
  ahmad: {
    minPasswordLen: 6,
    profile: { name: "Ahmad bin Ismail", role: "Investigator", branch: "CIMB-042", clearance: "Level 4", initials: "AI" },
  },
  siti: {
    minPasswordLen: 6,
    profile: { name: "Siti Nurhaliza", role: "Lead Auditor", branch: "CIMB-088", clearance: "Level 5", initials: "SN" },
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("Ahmad");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // OTP — 6 individual digit boxes
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first OTP box when step 2 mounts
  useEffect(() => {
    if (step === 2) setTimeout(() => otpRefs.current[0]?.focus(), 50);
  }, [step]);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }, []);

  // ── Step 1: Identity validation ──────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const key = username.trim().toLowerCase();
    const match = Object.keys(VALID_USERS).find(k => key.includes(k));

    if (!match) {
      setError("Unknown identity. Use 'Ahmad' or 'Siti' for demo access.");
      triggerShake();
      return;
    }
    if (password.length < VALID_USERS[match].minPasswordLen) {
      setError(`Password must be at least ${VALID_USERS[match].minPasswordLen} characters.`);
      triggerShake();
      return;
    }

    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1200);
  };

  // ── OTP box handlers ─────────────────────────────────────────────────
  const handleOtpChange = (idx: number, val: string) => {
    // Only accept digits
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError(null);
    // Auto-advance
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otp[idx]) {
        const next = [...otp]; next[idx] = ""; setOtp(next);
      } else if (idx > 0) {
        otpRefs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── Step 2: MFA validation ───────────────────────────────────────────
  const handleMfa = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");

    if (!otp.every(d => /^\d$/.test(d)) || code.length !== 6) {
      setError("Enter all 6 digits to proceed.");
      triggerShake();
      otpRefs.current[otp.findIndex(d => !d) ?? 0]?.focus();
      return;
    }

    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const key = username.trim().toLowerCase();
      const match = Object.keys(VALID_USERS).find(k => key.includes(k)) ?? "ahmad";
      localStorage.setItem("wira_user", JSON.stringify(VALID_USERS[match].profile));
      localStorage.setItem("wira_expiry", (Date.now() + 5 * 60 * 1000).toString());
      router.push("/");
    }, 1500);
  };

  const otpComplete = otp.every(d => /^\d$/.test(d));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Shake keyframe */}
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}`}</style>

      {/* Card */}
      <div
        className="relative w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-8"
        style={shake ? { animation: "shake 0.4s ease-in-out" } : {}}
      >
        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-emerald-500/30 rounded-2xl blur-lg" />
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-xl">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">WIRA.IO</h1>
          <p className="text-[11px] text-emerald-400 font-semibold mt-0.5 tracking-wider uppercase">Fraud Intelligence Platform</p>
          <p className="text-xs text-slate-400 font-medium mt-2 text-center">BNM Compliant · Multi-Agent AI · AML Protection</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 rounded-full transition-all duration-500 ${s === step ? "w-8 bg-emerald-500" : s < step ? "w-4 bg-emerald-700" : "w-4 bg-slate-700"}`} />
          ))}
        </div>

        {/* Demo hint */}
        <div className="mb-5 px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Demo Access</p>
          <p className="text-xs text-slate-300 font-mono">
            User: <span className="text-emerald-400 font-bold">Ahmad</span> or <span className="text-emerald-400 font-bold">Siti</span>
            &nbsp;·&nbsp; Password: <span className="text-emerald-400 font-bold">6+ chars</span>
            &nbsp;·&nbsp; OTP: <span className="text-emerald-400 font-bold">any 6 digits</span>
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2.5 bg-red-900/40 border border-red-500/40 rounded-xl text-xs text-red-300 font-medium animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-400" />
            {error}
          </div>
        )}

        {/* ── STEP 1: Identity + Password ── */}
        {step === 1 ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Banker Identity</label>
              <input
                type="text"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(null); }}
                autoFocus
                className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm"
                placeholder="Ahmad or Siti"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Password <span className="text-slate-600 normal-case tracking-normal font-normal">(min 6 characters)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null); }}
                  className="w-full bg-slate-800/60 border border-slate-600/60 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-mono tracking-widest text-sm"
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Password strength bar */}
              <div className="flex gap-1 mt-2">
                {[2, 4, 6, 8].map(threshold => (
                  <div
                    key={threshold}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      password.length >= threshold
                        ? threshold <= 2 ? "bg-red-500"
                        : threshold <= 4 ? "bg-amber-500"
                        : "bg-emerald-500"
                        : "bg-slate-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 disabled:opacity-60 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/40 transition-all text-sm"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate Identity →"}
            </button>
          </form>
        ) : (

        /* ── STEP 2: OTP ── */
          <form onSubmit={handleMfa} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-xl text-center">
              <KeyRound className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">Two-Factor Verification</p>
              <p className="text-xs text-blue-400/80 mt-1">
                A 6-digit token has been dispatched to your registered device.
              </p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">
                Enter 6-Digit Code
              </label>
              {/* Individual digit boxes */}
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-slate-800/70 transition-all outline-none
                      ${digit ? "border-emerald-500 text-emerald-400 shadow-emerald-900/30 shadow-md" : "border-slate-600 text-white"}
                      focus:border-blue-400 focus:ring-0
                      ${error ? "border-red-500/60" : ""}
                    `}
                    style={{ height: "52px" }}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mt-3">
                {otp.map((d, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${d ? "bg-emerald-500" : "bg-slate-700"}`} />
                ))}
              </div>
              <p className="text-center text-[10px] text-slate-500 mt-2">{otp.filter(d => d).length} / 6 digits entered</p>
            </div>

            <button
              type="submit"
              disabled={loading || !otpComplete}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold shadow-lg transition-all text-sm
                ${otpComplete && !loading
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-blue-900/40 cursor-pointer"
                  : "bg-slate-700/60 text-slate-500 cursor-not-allowed"
                }`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Enter Command Center"}
            </button>

            <button
              type="button"
              onClick={() => { setStep(1); setOtp(Array(6).fill("")); setError(null); }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back to identity
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center gap-4 text-[10px] text-slate-600 font-medium">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-700" /> BNM Regulated</span>
        <span>·</span>
        <span>256-bit Encrypted</span>
        <span>·</span>
        <span>AMLATFPUAA Compliant</span>
      </div>
    </div>
  );
}
