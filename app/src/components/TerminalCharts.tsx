"use client";

import { FraudTrend, CategoryBreakdown } from "@/lib/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface TerminalChartsProps {
  trends: FraudTrend[];
  categories: CategoryBreakdown[];
}

function TermTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a0a0a] border border-[#00FF4130] rounded px-3 py-2 font-mono">
      <p className="text-[10px] text-[#00FF41] font-bold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[10px]">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#00802b]">{entry.name}:</span>
          <span className="text-[#00FF41] font-bold">
            {entry.name === "Rate" ? `${entry.value}%` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TerminalCharts({ trends, categories }: TerminalChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Trend chart */}
      <div className="lg:col-span-3 term-card rounded-md overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#00FF4118] bg-[#00FF4108]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB000]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]" />
          </div>
          <span className="text-[10px] text-[#00FF41] opacity-60 ml-2 uppercase tracking-[0.2em]">
            fraud_trends.plot
          </span>
          <div className="ml-auto flex items-center gap-4 text-[10px] text-[#00802b]">
            <span className="flex items-center gap-1"><span className="w-2 h-[1px] bg-[#00FF41] inline-block" /> total</span>
            <span className="flex items-center gap-1"><span className="w-2 h-[1px] bg-[#FF3333] inline-block" /> fraud</span>
            <span className="flex items-center gap-1"><span className="w-2 h-[1px] bg-[#FFB000] inline-block" /> rate</span>
          </div>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FF41" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#00FF41" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF3333" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FF3333" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke="#00FF4110" />
              <XAxis dataKey="hour" tick={{ fill: "#00802b", fontSize: 9 }} tickLine={false} axisLine={{ stroke: "#00FF4115" }} />
              <YAxis tick={{ fill: "#00802b", fontSize: 9 }} tickLine={false} axisLine={false} />
              <Tooltip content={<TermTooltip />} />
              <Area type="monotone" dataKey="total" name="Total" stroke="#00FF41" strokeWidth={1.5} fill="url(#tg)" />
              <Area type="monotone" dataKey="fraudulent" name="Fraud" stroke="#FF3333" strokeWidth={1.5} fill="url(#fg)" />
              <Area type="monotone" dataKey="rate" name="Rate" stroke="#FFB000" strokeWidth={1} fill="none" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category chart */}
      <div className="lg:col-span-2 term-card rounded-md overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#00FF4118] bg-[#00FF4108]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB000]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]" />
          </div>
          <span className="text-[10px] text-[#00FF41] opacity-60 ml-2 uppercase tracking-[0.2em]">
            category_breakdown.dat
          </span>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="2 6" stroke="#00FF4110" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#00802b", fontSize: 9 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fill: "#00FF41", fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
              <Tooltip content={<TermTooltip />} />
              <Bar dataKey="rate" name="Rate %" radius={[0, 2, 2, 0]} fill="#00FF41" fillOpacity={0.5} barSize={14} />
            </BarChart>
          </ResponsiveContainer>

          {/* Stat list */}
          <div className="mt-3 space-y-1 font-mono text-[11px]">
            {categories.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between px-2 py-1.5 rounded bg-[#00FF4106] border border-[#00FF4110]">
                <span className="text-[#00cc33]">{cat.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#00802b] tabular-nums">{cat.fraudulent}/{cat.total}</span>
                  <span className={`font-bold tabular-nums ${cat.rate >= 2 ? "text-[#FF3333]" : cat.rate >= 1 ? "text-[#FFB000]" : "text-[#00FF41]"}`}>
                    {cat.rate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
