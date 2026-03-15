"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardStats, RiskLevel } from "@/lib/types";
import { getRiskBgClass } from "@/lib/data";
import {
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Activity,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface RiskOverviewProps {
  stats: DashboardStats;
  riskDistribution: { level: RiskLevel; count: number; percentage: number }[];
}

const statIcons: Record<string, React.ReactNode> = {
  transactions: <Activity className="h-5 w-5" />,
  fraud: <ShieldAlert className="h-5 w-5" />,
  rate: <TrendingUp className="h-5 w-5" />,
  volume: <DollarSign className="h-5 w-5" />,
  highRisk: <AlertTriangle className="h-5 w-5" />,
  avgAmount: <BarChart3 className="h-5 w-5" />,
};

export function RiskOverview({ stats, riskDistribution }: RiskOverviewProps) {
  const cards = [
    {
      label: "Total Transactions",
      value: stats.totalTransactions.toLocaleString(),
      icon: statIcons.transactions,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Flagged Fraud",
      value: stats.totalFraud.toLocaleString(),
      icon: statIcons.fraud,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Fraud Rate",
      value: `${stats.fraudRate.toFixed(2)}%`,
      icon: statIcons.rate,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Total Volume",
      value: `$${(stats.totalVolume / 1000).toFixed(1)}K`,
      icon: statIcons.volume,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "High Risk",
      value: stats.highRiskCount.toLocaleString(),
      icon: statIcons.highRisk,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
    },
    {
      label: "Avg. Amount",
      value: `$${stats.avgAmount.toFixed(2)}`,
      icon: statIcons.avgAmount,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <Card
            key={card.label}
            className="relative overflow-hidden border-white/5 bg-slate-900/60 backdrop-blur-xl p-4 group hover:border-gold/20 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.02] group-hover:to-gold/[0.03] transition-colors duration-500" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`${card.bgColor} p-2 rounded-lg ${card.color}`}
                >
                  {card.icon}
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-white">
                {card.value}
              </p>
              <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wider">
                {card.label}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Risk Distribution */}
      <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert className="h-5 w-5 text-gold" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Risk Distribution
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {riskDistribution.map(({ level, count, percentage }) => (
            <div
              key={level}
              className="relative overflow-hidden rounded-xl p-4 border border-white/5 bg-slate-950/50"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize font-semibold ${getRiskBgClass(
                    level
                  )}`}
                >
                  {level}
                </Badge>
                <span className="text-xs text-slate-500">{percentage}%</span>
              </div>
              <p className="text-xl font-bold text-white">
                {count.toLocaleString()}
              </p>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    level === "critical"
                      ? "bg-red-500"
                      : level === "high"
                      ? "bg-orange-500"
                      : level === "medium"
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
