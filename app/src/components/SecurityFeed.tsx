"use client";

import { useEffect, useRef, useState } from "react";

interface Investigation {
  agent_id: string;
  agent_name: string;
  agent_role: string;
  verdict: string;
  confidence: number;
  reasoning: string[];
}

interface StreamItem {
  transaction: {
    transaction_id: number;
    amount: number;
    merchant_category: string;
    transaction_hour: number;
    device_trust_score: number;
    foreign_transaction: number;
    location_mismatch: number;
    velocity_last_24h: number;
    is_fraud: number;
  };
  debate: {
    consensus_verdict: string;
    consensus_confidence: number;
    investigations: Investigation[];
  };
}

interface LiveFeedProps {
  items: StreamItem[];
  isStreaming: boolean;
  onAction: (txId: number, action: string) => void;
  actionStates: Record<number, string>; // txId -> "freezing" | "frozen" | "approving" | "approved"
}

function verdictColor(v: string) {
  if (v === "CRITICAL") return "text-[#FF3333]";
  if (v === "FLAGGED") return "text-[#FF6B00]";
  if (v === "SUSPICIOUS") return "text-[#FFB000]";
  return "text-[#00cc33]";
}

function verdictBorder(v: string) {
  if (v === "CRITICAL") return "border-l-[#FF3333]";
  if (v === "FLAGGED") return "border-l-[#FF6B00]";
  if (v === "SUSPICIOUS") return "border-l-[#FFB000]";
  return "border-l-[#00FF4130]";
}

function rowBg(v: string) {
  if (v === "CRITICAL") return "bg-[#FF333308]";
  if (v === "FLAGGED") return "bg-[#FF6B0006]";
  return "bg-transparent";
}

export function LiveFeed({ items, isStreaming, onAction, actionStates }: LiveFeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [items]);

  const needsAction = (v: string) => v === "CRITICAL" || v === "FLAGGED";

  return (
    <div className="term-card rounded-md overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#00FF4118] bg-[#00FF4108] shrink-0">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFB000]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]" />
        </div>
        <span className="text-[10px] text-[#00FF41] opacity-60 ml-2 uppercase tracking-[0.2em]">
          security_feed.log
        </span>
        <span className="text-[10px] text-[#00802b] ml-1">
          — {items.length} entries
        </span>
        {isStreaming && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FF3333] animate-blink" />
            <span className="text-[10px] text-[#FF3333] opacity-80 tracking-wider">LIVE</span>
          </div>
        )}
      </div>

      {/* Feed */}
      <div ref={feedRef} className="overflow-y-auto font-mono text-[11px] min-h-0" style={{ maxHeight: "400px" }}>
        {items.length === 0 && (
          <div className="text-[#00802b] py-10 text-center text-[11px]">
            <p>{">"} Feed offline. Start simulation to begin monitoring.</p>
          </div>
        )}

        {items.map((item, i) => {
          const tx = item.transaction;
          const verdict = item.debate.consensus_verdict;
          const txId = tx.transaction_id;
          const state = actionStates[txId];

          return (
            <div
              key={`${txId}-${i}`}
              className={`
                animate-feed-in border-l-2 ${verdictBorder(verdict)} ${rowBg(verdict)}
                px-3 py-2 border-b border-[#00FF4108]
                ${i === items.length - 1 ? "animate-glow-pulse" : ""}
                transition-all duration-500
                ${state === "frozen" ? "!bg-[#00FF4110] !border-l-[#00FF41]" : ""}
                ${state === "approved" ? "!bg-[#00FF4108] !border-l-[#00802b]" : ""}
              `}
            >
              <div className="flex items-center gap-3 flex-wrap">
                {/* Timestamp */}
                <span className="text-[#00802b] tabular-nums shrink-0">
                  [{String(new Date().getHours()).padStart(2, "0")}:
                  {String(new Date().getMinutes()).padStart(2, "0")}:
                  {String((new Date().getSeconds() + i) % 60).padStart(2, "0")}]
                </span>

                {/* Verdict */}
                <span className={`font-bold shrink-0 ${verdictColor(verdict)}`}>
                  [{verdict}]
                </span>

                {/* TX info */}
                <span className="text-[#00FF41]">TX#{txId.toString().padStart(5, "0")}</span>
                <span className="text-[#FFB000] font-bold">${tx.amount.toFixed(2)}</span>
                <span className="text-[#00802b]">{tx.merchant_category}</span>
                <span className="text-[#00802b]">@{tx.transaction_hour}:00</span>

                {/* Device trust */}
                <span className={`${tx.device_trust_score < 30 ? "text-[#FF3333]" : tx.device_trust_score < 60 ? "text-[#FFB000]" : "text-[#00802b]"}`}>
                  DTrust:{tx.device_trust_score}
                </span>

                {/* Fraud flag */}
                {tx.is_fraud === 1 && (
                  <span className="text-[#FF3333] font-bold animate-blink">⚠ FRAUD</span>
                )}

                {/* Action buttons for flagged transactions */}
                {needsAction(verdict) && !state && (
                  <div className="ml-auto flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onAction(txId, "approve")}
                      className="px-2 py-0.5 text-[10px] border border-[#00FF4140] text-[#00FF41] rounded hover:bg-[#00FF4118] transition-colors cursor-pointer"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => onAction(txId, "freeze")}
                      className="px-2 py-0.5 text-[10px] border border-[#FF333340] text-[#FF3333] rounded hover:bg-[#FF333318] transition-colors cursor-pointer"
                    >
                      ⊘ Freeze Account
                    </button>
                  </div>
                )}

                {/* Loading states */}
                {state === "freezing" && (
                  <span className="ml-auto text-[10px] text-[#FFB000] animate-blink shrink-0">
                    ⏳ Sending to Bank API...
                  </span>
                )}
                {state === "approving" && (
                  <span className="ml-auto text-[10px] text-[#FFB000] animate-blink shrink-0">
                    ⏳ Verifying with compliance...
                  </span>
                )}
                {state === "frozen" && (
                  <span className="ml-auto text-[10px] text-[#00FF41] font-bold shrink-0">
                    🔒 Account {(txId * 7 + 1000) % 9999} Frozen. Notification sent to user.
                  </span>
                )}
                {state === "approved" && (
                  <span className="ml-auto text-[10px] text-[#00cc33] shrink-0">
                    ✓ Transaction cleared by analyst.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
