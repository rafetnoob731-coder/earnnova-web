"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Clock, CirclePlus, CircleMinus, Receipt, Filter } from "lucide-react";
import { formatUSD, cn } from "@/lib/utils";

type FilterType = "all" | "earnings" | "withdrawals";

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  const transactions: { type: string; amount: number; status: string; description?: string; time: string }[] = [];

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "earnings", label: "Earnings" },
    { key: "withdrawals", label: "Withdrawals" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> History
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Your activity log</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200",
              filter === f.key
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-navy-600/50 text-slate-400 border border-white/5 hover:border-white/10"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="glass-card p-4">
        {transactions.length > 0 ? (
          <div className="space-y-1">
            {transactions.map((tx, i) => (
              <div key={i} className="tx-item">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    tx.amount >= 0
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-red-500/10 text-red-400"
                  )}
                >
                  {tx.amount >= 0 ? (
                    <CirclePlus className="w-4 h-4" />
                  ) : (
                    <CircleMinus className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{tx.type}</p>
                  <p className="text-xs text-slate-500">{tx.description}</p>
                  <p className="text-[10px] text-slate-600">{tx.time}</p>
                </div>
                <div className="text-right">
                  <div
                    className={cn(
                      "text-sm font-bold",
                      tx.amount >= 0 ? "text-emerald-500" : "text-red-400"
                    )}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {formatUSD(Math.abs(tx.amount))}
                  </div>
                  <span
                    className={cn(
                      "text-[10px]",
                      tx.status === "completed" && "text-emerald-500",
                      tx.status === "pending" && "text-amber-500",
                      tx.status === "failed" && "text-red-400"
                    )}
                  >
                    {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-slate-500 py-10 text-sm">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}
