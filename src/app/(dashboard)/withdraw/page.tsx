"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { CreditCard, Wallet, DollarSign, Clock, Check, Xmark } from "lucide-react";
import { formatUSD, cn } from "@/lib/utils";
import Link from "next/link";

const METHODS = [
  { key: "bkash", name: "bKash", icon: "💰" },
  { key: "nagad", name: "Nagad", icon: "💳" },
  { key: "binance", name: "Binance", icon: "🪙" },
  { key: "paypal", name: "PayPal", icon: "💸" },
  { key: "wise", name: "Wise", icon: "🏦" },
  { key: "bank", name: "Bank Transfer", icon: "🏛️" },
  { key: "crypto", name: "Crypto (USDT/BTC)", icon: "₿" },
];

export default function WithdrawPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const balance = 0;
  const minW = 5;

  const withdrawals: { method: string; amount: number; status: string; time: string }[] = [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" /> Withdraw
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Cash out your earnings</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">Available</div>
          <div className="text-lg font-bold text-emerald-500">{formatUSD(balance)}</div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-500" /> Payment Method
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {METHODS.map((m) => (
            <motion.button
              key={m.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedMethod(m.key)}
              className={cn(
                "p-3 rounded-xl text-center transition-all border",
                selectedMethod === m.key
                  ? "bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]"
              )}
            >
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-xs font-medium text-white">{m.name}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="glass-card p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert("Withdrawal submitted! (Demo)");
          }}
          className="space-y-4"
        >
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">
              Amount ($)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min={minW}
                max={balance}
                required
                placeholder={`Min ${formatUSD(minW)}`}
                className="glass-input pl-10"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Min: {formatUSD(minW)} · Available: {formatUSD(balance)}
            </p>
          </div>

          {selectedMethod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <p className="text-xs text-slate-400">
                Enter your <strong className="text-white">{METHODS.find((m) => m.key === selectedMethod)?.name}</strong> details
              </p>
              <input
                type="text"
                required
                placeholder="Account details"
                className="glass-input"
              />
            </motion.div>
          )}

          <button
            type="submit"
            disabled={!selectedMethod || !amount || Number(amount) < minW}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <CreditCard className="w-4 h-4" /> Submit Withdrawal
          </button>
        </form>
      </div>

      {/* History */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Withdrawal History
        </h3>
        <div className="space-y-1">
          {withdrawals.length > 0 ? (
            withdrawals.map((wd, i) => (
              <div key={i} className="tx-item">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-amber-500/10 text-amber-500 flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{wd.method}</p>
                  <p className="text-[10px] text-slate-500">{wd.time}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-red-400">
                    -{formatUSD(Math.abs(wd.amount))}
                  </div>
                  <span className="text-[10px] text-amber-500 capitalize">{wd.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-6 text-sm">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              No withdrawals yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
