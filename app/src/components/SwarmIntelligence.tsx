"use client";

import { useEffect, useRef, useState } from "react";

interface Investigation {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  verdict: string;
  confidence: number;
  reasoning: string[];
  risk_signals: number;
}

interface DebateResult {
  transaction_id: number;
  amount: number;
  category: string;
  consensus_verdict: string;
  consensus_confidence: number;
  investigations: Investigation[];
}

interface SwarmIntelligenceProps {
  debates: DebateResult[];
  isStreaming: boolean;
}

function verdictColor(v: string) {
  if (v === "CRITICAL") return "text-[#FF3333]";
  if (v === "FLAGGED") return "text-[#FF6B00]";
  if (v === "SUSPICIOUS") return "text-[#FFB000]";
  return "text-[#00FF41]";
}

function verdictBg(v: string) {
  if (v === "CRITICAL") return "bg-[#FF333315] border-[#FF333330]";
  if (v === "FLAGGED") return "bg-[#FF6B0010] border-[#FF6B0030]";
  if (v === "SUSPICIOUS") return "bg-[#FFB00010] border-[#FFB00030]";
  return "bg-[#00FF4108] border-[#00FF4120]";
}

function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    setDisplay("");
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return <span>{display}<span className="animate-blink opacity-60">▌</span></span>;
}

export function SwarmIntelligence({ debates, isStreaming }: SwarmIntelligenceProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debates]);

  return (
    <div className="term-card rounded-md overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#00FF4118] bg-[#00FF4108] shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFB000]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]" />
        </div>
        <span className="text-[10px] text-[#00FF41] opacity-60 ml-2 uppercase tracking-[0.2em]">
          swarm_intelligence.irc
        </span>
        {isStreaming && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-blink" />
            <span className="text-[10px] text-[#00FF41] opacity-70 tracking-wider">ACTIVE</span>
          </div>
        )}
      </div>

      {/* Chat body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0" style={{ maxHeight: "520px" }}>
        {debates.length === 0 && (
          <div className="text-[#00802b] text-center py-10 text-[11px]">
            <p>╔══════════════════════════════╗</p>
            <p>║ &nbsp; SWARM INTELLIGENCE IRC &nbsp; ║</p>
            <p>╚══════════════════════════════╝</p>
            <p className="mt-3 opacity-50">Agents awaiting deployment...</p>
            <p className="opacity-50">Start simulation to activate.</p>
          </div>
        )}

        {debates.map((debate, di) => (
          <div key={`${debate.transaction_id}-${di}`} className="animate-feed-in space-y-2">
            {/* Transaction header */}
            <div className="flex items-center gap-2 text-[10px] text-[#00802b]">
              <span>──── TX#{debate.transaction_id.toString().padStart(5, "0")} ────</span>
              <span className="text-[#FFB000]">${debate.amount.toFixed(2)}</span>
              <span>({debate.category})</span>
            </div>

            {/* Agent messages */}
            {debate.investigations.map((inv, ii) => (
              <div key={`${inv.agent_id}-${ii}`} className="pl-2 border-l border-[#00FF4118]">
                {/* Agent header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#00FFFF] text-[11px] font-bold">
                    @{inv.agent_name}
                  </span>
                  <span className="text-[#00802b] text-[9px]">
                    [{inv.agent_role}]
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${verdictBg(inv.verdict)} ${verdictColor(inv.verdict)}`}>
                    {inv.verdict} {inv.confidence}%
                  </span>
                </div>
                {/* Reasoning lines */}
                <div className="space-y-0.5 text-[11px]">
                  {inv.reasoning.map((reason, ri) => (
                    <p key={ri} className="text-[#00cc33]">
                      <span className="text-[#00802b] mr-1">→</span>
                      {di === debates.length - 1 ? (
                        <TypewriterText text={reason} speed={12} />
                      ) : (
                        reason
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {/* Consensus */}
            <div className={`flex items-center gap-2 px-2 py-1.5 rounded border text-[11px] ${verdictBg(debate.consensus_verdict)}`}>
              <span className="text-[#00802b]">CONSENSUS:</span>
              <span className={`font-bold ${verdictColor(debate.consensus_verdict)}`}>
                {debate.consensus_verdict}
              </span>
              <span className="text-[#00802b]">|</span>
              <span className="text-[#FFB000]">{debate.consensus_confidence}% confidence</span>
              <span className="text-[#00802b]">|</span>
              <span className="text-[#00cc33]">{debate.investigations.length} agents concur</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
