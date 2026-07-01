"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Users, Gift, Trophy, Copy, Check, Share2, Link as LinkIcon, UserPlus } from "lucide-react";
import { formatUSD, generateRefCode } from "@/lib/utils";

const MILESTONES = [
  { count: 1, bonus: 0.5 },
  { count: 5, bonus: 2.5 },
  { count: 10, bonus: 5 },
  { count: 25, bonus: 15 },
  { count: 50, bonus: 35 },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const refCode = generateRefCode();
  const referralCount = 0;
  const totalBonus = 0;

  const copyCode = () => {
    navigator.clipboard?.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" /> Referrals
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Invite friends and earn bonuses</p>
        </div>
      </div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-3 gap-3"
      >
        {[
          { label: "Total Referrals", value: String(referralCount), color: "text-white" },
          { label: "Bonus Earned", value: formatUSD(totalBonus), color: "text-emerald-500" },
          { label: "Total Earnings", value: formatUSD(0), color: "text-amber-500" },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="glass-card p-4 text-center"
          >
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Referral Code */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-500" /> Your Referral Code
        </h3>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-navy-600/50 border border-white/5">
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-emerald-500 tracking-widest select-all">
              {refCode}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Share this code with friends
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={copyCode}
            className="btn-ghost !py-2 !px-3 text-xs"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </motion.button>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">
          You earn <strong className="text-emerald-500">{formatUSD(0.5)}</strong> for each
          friend who signs up using your code. Milestone bonuses:
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {MILESTONES.map((m) => (
            <span
              key={m.count}
              className="inline-block px-2 py-0.5 rounded bg-navy-600/50 text-[10px] text-slate-300 border border-white/5"
            >
              {m.count} friends → +{formatUSD(m.bonus)}
            </span>
          ))}
        </div>
      </div>

      {/* Referral List */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-slate-400" /> Referred Friends
        </h3>
        <div className="text-center text-slate-500 py-8 text-sm">
          <Users className="w-10 h-10 mx-auto mb-2 text-slate-600" />
          Share your referral code to get started!
        </div>
      </div>
    </div>
  );
}
