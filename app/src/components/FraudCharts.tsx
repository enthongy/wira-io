"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Cell,
} from "recharts";
import { TrendingUp, PieChart } from "lucide-react";

interface FraudChartsProps {
  trends: FraudTrend[];
  categories: CategoryBreakdown[];
}

const CATEGORY_COLORS = [
  "#EF4444",
  "#F59E0B",
  "#D4AF37",
  "#10B981",
  "#3B82F6",
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-lg px-4 py-3 shadow-2xl">
      <p className="text-xs text-gold font-semibold mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-medium">
            {typeof entry.value === "number" && entry.name === "Fraud Rate"
              ? `${entry.value}%`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FraudCharts({ trends, categories }: FraudChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Fraud Trend Area Chart */}
      <Card className="lg:col-span-3 border-white/5 bg-slate-900/60 backdrop-blur-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Fraud Trends by Hour
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-emerald-500 rounded" />
              Total
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-red-500 rounded" />
              Fraud
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-gold rounded" />
              Rate
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={trends}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fraudGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="hour"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#totalGradient)"
            />
            <Area
              type="monotone"
              dataKey="fraudulent"
              name="Fraudulent"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#fraudGradient)"
            />
            <Area
              type="monotone"
              dataKey="rate"
              name="Fraud Rate"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#rateGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Category Breakdown */}
      <Card className="lg:col-span-2 border-white/5 bg-slate-900/60 backdrop-blur-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <PieChart className="h-5 w-5 text-gold" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Fraud by Category
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={categories}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: "#64748b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: "#cbd5e1", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="rate" name="Fraud Rate" radius={[0, 4, 4, 0]} barSize={18}>
              {categories.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Category stats list */}
        <div className="mt-4 space-y-2">
          {categories.map((cat, i) => (
            <div
              key={cat.category}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-950/40 border border-white/5"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                  }}
                />
                <span className="text-sm text-slate-300">{cat.category}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {cat.fraudulent}/{cat.total}
                </span>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold ${
                    cat.rate >= 5
                      ? "bg-red-500/15 text-red-400 border-red-500/20"
                      : cat.rate >= 2
                      ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  }`}
                >
                  {cat.rate}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
