"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transaction, RiskLevel } from "@/lib/types";
import { getRiskLevel, getRiskBgClass } from "@/lib/data";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Globe,
  MapPin,
  Filter,
} from "lucide-react";

interface TransactionTableProps {
  transactions: Transaction[];
}

const PAGE_SIZE = 15;

type SortKey = keyof Transaction;
type SortDir = "asc" | "desc";

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("risk_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filterRisk, setFilterRisk] = useState<RiskLevel | "all">("all");

  const filtered = useMemo(() => {
    if (filterRisk === "all") return transactions;
    return transactions.filter(
      (t) => getRiskLevel(t.risk_score) === filterRisk
    );
  }, [transactions, filterRisk]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  const riskFilters: { label: string; value: RiskLevel | "all" }[] = [
    { label: "All", value: "all" },
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];

  return (
    <Card className="border-white/5 bg-slate-900/60 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-gold to-gold-dark rounded-full" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Transaction Monitor
            </h3>
            <Badge
              variant="outline"
              className="text-xs bg-gold/10 text-gold border-gold/20 ml-2"
            >
              {filtered.length.toLocaleString()} records
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            {riskFilters.map((f) => (
              <Button
                key={f.value}
                variant={filterRisk === f.value ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setFilterRisk(f.value);
                  setPage(0);
                }}
                className={`text-xs h-7 px-3 ${
                  filterRisk === f.value
                    ? "bg-gold/20 text-gold hover:bg-gold/30 border border-gold/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              {[
                { key: "transaction_id" as SortKey, label: "ID" },
                { key: "amount" as SortKey, label: "Amount" },
                { key: "merchant_category" as SortKey, label: "Category" },
                { key: "transaction_hour" as SortKey, label: "Hour" },
                { key: "device_trust_score" as SortKey, label: "Device Trust" },
                { key: "risk_score" as SortKey, label: "Risk Score" },
                { key: "is_fraud" as SortKey, label: "Status" },
              ].map(({ key, label }) => (
                <TableHead
                  key={key}
                  className="text-slate-400 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none hover:text-gold transition-colors"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1.5">
                    {label}
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                    {sortKey === key && (
                      <span className="text-gold text-[10px]">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-slate-400 font-semibold text-xs uppercase tracking-wider">
                Flags
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((tx) => {
              const risk = getRiskLevel(tx.risk_score);
              return (
                <TableRow
                  key={tx.transaction_id}
                  className={`border-white/5 transition-colors hover:bg-white/[0.03] ${
                    tx.is_fraud ? "bg-red-500/[0.04]" : ""
                  }`}
                >
                  <TableCell className="font-mono text-sm text-slate-300">
                    #{tx.transaction_id.toString().padStart(5, "0")}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium text-white">
                    ${tx.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-xs bg-slate-800/50 text-slate-300 border-slate-700/50"
                    >
                      {tx.merchant_category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-400">
                    {tx.transaction_hour.toString().padStart(2, "0")}:00
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            tx.device_trust_score >= 70
                              ? "bg-emerald-500"
                              : tx.device_trust_score >= 40
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${tx.device_trust_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {tx.device_trust_score}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold ${getRiskBgClass(risk)}`}
                      >
                        {tx.risk_score}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {tx.is_fraud ? (
                      <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold animate-pulse">
                        ⚠ FRAUD
                      </Badge>
                    ) : (
                      <span className="text-xs text-emerald-400/70">
                        ✓ Clean
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {tx.foreign_transaction && (
                        <span title="Foreign Transaction"><Globe className="h-3.5 w-3.5 text-blue-400" /></span>
                      )}
                      {tx.location_mismatch && (
                        <span title="Location Mismatch"><MapPin className="h-3.5 w-3.5 text-orange-400" /></span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
        <span className="text-xs text-slate-500">
          Page {page + 1} of {totalPages} · Showing{" "}
          {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)}{" "}
          of {sorted.length}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="h-7 w-7 p-0 text-slate-400 hover:text-gold disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const startPage = Math.max(
              0,
              Math.min(page - 2, totalPages - 5)
            );
            const pageNum = startPage + i;
            if (pageNum >= totalPages) return null;
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "ghost"}
                size="sm"
                onClick={() => setPage(pageNum)}
                className={`h-7 w-7 p-0 text-xs ${
                  page === pageNum
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {pageNum + 1}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="h-7 w-7 p-0 text-slate-400 hover:text-gold disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
