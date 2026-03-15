"use client";

import { DashboardStats } from "@/lib/types";

interface TerminalStatsProps {
  stats: DashboardStats;
  swarmResults: { total_critical: number } | null;
}

export function TerminalStats({ stats, swarmResults }: TerminalStatsProps) {
  const rows = [
    { key: "TOTAL_TX", value: stats.totalTransactions.toLocaleString(), color: "text-[#00FF41]" },
    { key: "FLAGGED_FRAUD", value: stats.totalFraud.toString(), color: "text-[#FF3333]" },
    { key: "FRAUD_RATE", value: `${stats.fraudRate.toFixed(2)}%`, color: "text-[#FFB000]" },
    { key: "VOLUME_USD", value: `$${(stats.totalVolume / 1000).toFixed(1)}K`, color: "text-[#00FF41]" },
    { key: "HIGH_RISK", value: stats.highRiskCount.toString(), color: "text-[#FFB000]" },
    { key: "AVG_AMOUNT", value: `$${stats.avgAmount.toFixed(2)}`, color: "text-[#00cc33]" },
  ];

  return (
    <div className="term-card rounded-md overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#00FF4118] bg-[#00FF4108]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFB000]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]" />
        </div>
        <span className="text-[10px] text-[#00FF41] opacity-60 ml-2 uppercase tracking-[0.2em]">
          system_metrics.sh
        </span>
      </div>

      {/* Content */}
      <div className="p-4 font-mono text-xs space-y-1">
        <p className="text-[#00802b] mb-3">
          {">"} SENTINEL v2.1 — System Overview
        </p>
        <div className="border border-[#00FF4118] rounded overflow-hidden">
          {rows.map((row, i) => (
            <div
              key={row.key}
              className={`flex items-center justify-between px-3 py-2 ${
                i % 2 === 0 ? "bg-[#00FF4106]" : "bg-transparent"
              } border-b border-[#00FF4110] last:border-b-0`}
            >
              <span className="text-[#00802b] text-[11px]">{row.key}</span>
              <span className={`${row.color} font-bold text-[11px] tabular-nums`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {/* Swarm results */}
        {swarmResults && (
          <div className="mt-4 pt-3 border-t border-[#00FF4118]">
            <p className="text-[#FFB000] mb-2">
              {">"} SWARM RESULTS:
            </p>
            <div className="flex items-center justify-between px-3 py-2 bg-[#FF333310] border border-[#FF333330] rounded">
              <span className="text-[#FF3333] text-[11px]">ISOLATION_FOREST_CRITICAL</span>
              <span className="text-[#FF3333] font-bold text-[11px]">
                {swarmResults.total_critical}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
