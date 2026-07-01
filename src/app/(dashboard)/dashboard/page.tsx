"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Wallet,
  TvMinimal,
  Users,
  SackDollar,
  ChartNoAxesCombined,
  Play,
  CreditCard,
  User,
  Hourglass,
  Inbox,
  Flame,
  TrendingUp,
} from "lucide-react";
import { formatUSD } from "@/lib/utils";

export default function DashboardPage() {
  // Demo data — replace with TanStack Query fetching from Supabase
  const stats = {
    balance: 0,
    adsWatched: 0,
    referrals: 0,
    totalEarned: 0,
    todayAds: 0,
    streak: 0,
  };

  const transactions: { type: string; amount: number; time: string }[] = [];
  const ads: { title: string; reward: number; duration: number }[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Welcome back, <span className="text-white font-semibold">User</span>!
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {[
          { icon: Wallet, label: "Balance", value: formatUSD(stats.balance), color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { icon: TvMinimal, label: "Ads Watched", value: String(stats.adsWatched), color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: Users, label: "Referrals", value: String(stats.referrals), color: "text-amber-500", bg: "bg-amber-500/10" },
          { icon: SackDollar, label: "Total Earned", value: formatUSD(stats.totalEarned), color: "text-purple-400", bg: "bg-purple-500/10" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="stat-card"
          >
            <div className={`stat-icon ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className={`text-xl font-bold ${stat.color} tracking-tight`}>
              {stat.value}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-medium uppercase tracking-wide">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Daily Progress */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white flex items-center gap-2">
            <ChartNoAxesCombined className="w-4 h-4 text-emerald-500" />
            Daily Progress
          </span>
          <span className="text-xs text-slate-400">{stats.todayAds}/30</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${Math.min(100, (stats.todayAds / 30) * 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            Streak: {stats.streak} day{stats.streak !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Ads */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TvMinimal className="w-4 h-4 text-emerald-500" />
            Available Ads
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {ads.length > 0 ? (
              ads.map((ad, i) => (
                <div key={i} className="ad-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {ad.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ad.duration}s ·{" "}
                      <span className="text-emerald-500 font-semibold">
                        +{formatUSD(ad.reward)}
                      </span>
                    </p>
                  </div>
                  <Link
                    href="/earn"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                  >
                    <Play className="w-3 h-3 inline mr-1" />
                    Watch
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8 text-sm">
                <Hourglass className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                No ads available right now
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Recent Activity
          </h3>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {transactions.length > 0 ? (
              transactions.map((tx, i) => (
                <div key={i} className="tx-item">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                      tx.amount >= 0
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : "−"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{tx.type}</p>
                    <p className="text-[10px] text-slate-500">{tx.time}</p>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      tx.amount >= 0 ? "text-emerald-500" : "text-red-400"
                    }`}
                  >
                    {tx.amount >= 0 ? "+" : ""}
                    {formatUSD(Math.abs(tx.amount))}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8 text-sm">
                <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                Start earning to see activity here
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.07 } },
        }}
        className="grid grid-cols-4 gap-3"
      >
        {[
          { href: "/earn", icon: Play, label: "Watch", color: "text-emerald-500" },
          { href: "/withdraw", icon: CreditCard, label: "Withdraw", color: "text-blue-400" },
          { href: "/referrals", icon: Users, label: "Refer", color: "text-amber-500" },
          { href: "/profile", icon: User, label: "Profile", color: "text-purple-400" },
        ].map((action) => (
          <motion.div
            key={action.label}
            variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
          >
            <Link
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] hover:-translate-y-0.5 transition-all text-slate-400 hover:text-white"
            >
              <action.icon className={`w-6 h-6 ${action.color}`} />
              <span className="text-[11px] font-medium">{action.label}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
