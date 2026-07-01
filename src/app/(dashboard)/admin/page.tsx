"use client";

import { motion } from "motion/react";
import { Shield, Users, TvMinimal, CreditCard, Settings, Bolt, UserPlus, Clock, ArrowUpRight } from "lucide-react";
import { formatUSD } from "@/lib/utils";

export default function AdminPage() {
  const stats = {
    totalUsers: 0,
    activeAds: 0,
    pendingWD: 0,
    totalPaid: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-amber-500" /> Admin Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage users, ads, withdrawals, and platform settings
        </p>
      </div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { icon: Users, label: "Total Users", value: String(stats.totalUsers), color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: TvMinimal, label: "Active Ads", value: String(stats.activeAds), color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: CreditCard, label: "Pending WDs", value: String(stats.pendingWD), color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: ArrowUpRight, label: "Total Paid", value: formatUSD(stats.totalPaid), color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((s) => (
          <motion.div
            key={s.label}
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
            className="stat-card"
          >
            <div className={`stat-icon ${s.bg} ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-wide">
              {s.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Bolt className="w-4 h-4 text-amber-500" /> Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "👥", label: "Users", desc: "Manage all users" },
              { icon: "📺", label: "Ads", desc: "Manage ad slots" },
              { icon: "💳", label: "Withdrawals", desc: "Process payouts" },
              { icon: "⚙️", label: "Settings", desc: "Platform config" },
            ].map((a) => (
              <div
                key={a.label}
                className="p-3 rounded-xl bg-navy-600/50 hover:bg-navy-600/80 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <div className="text-xl mb-1">{a.icon}</div>
                <div className="text-xs text-slate-300">{a.label}</div>
                <div className="text-[10px] text-slate-500">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-500" /> Recent Users
          </h3>
          <div className="text-center text-slate-500 py-8 text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            No users yet
          </div>
        </div>
      </div>
    </div>
  );
}
