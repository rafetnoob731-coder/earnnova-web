"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Coins, Play, Hourglass, Flame, ChartNoAxesCombined, List, TvMinimal } from "lucide-react";
import { formatUSD } from "@/lib/utils";

export default function EarnPage() {
  const [cooldown] = useState(0);
  const todayAds = 0;
  const ads: { title: string; reward: number; duration: number }[] = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" /> Earn
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Watch ads and earn rewards</p>
        </div>
        <span className="text-xs bg-navy-600/50 px-3 py-1.5 rounded-full text-slate-400 border border-white/5">
          📊 {todayAds}/30 today
        </span>
      </div>

      {/* Daily Progress */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Daily Limit</span>
          <span className={`text-xs font-semibold ${todayAds >= 30 ? "text-red-400" : "text-emerald-500"}`}>
            {todayAds}/30
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${Math.min(100, (todayAds / 30) * 100)}%` }} />
        </div>
        <p className="text-[10px] text-slate-500 mt-1">Resets at midnight</p>
      </div>

      {/* Cooldown */}
      {cooldown > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4 border border-amber-500/20"
        >
          <div className="flex items-center gap-3">
            <Hourglass className="w-8 h-8 text-amber-500 animate-bounce" />
            <div>
              <p className="text-sm font-medium text-amber-500">Cooldown Active</p>
              <p className="text-xs text-slate-400">
                Next ad available in{" "}
                <strong className="text-white">{cooldown}m</strong>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Available Ads */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <List className="w-4 h-4 text-emerald-500" /> Available Ads
        </h3>
        <div className="space-y-2">
          {ads.length > 0 ? (
            ads.map((ad, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="ad-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{ad.title}</p>
                  <p className="text-xs text-slate-400">
                    <span className="mr-1">⏱</span>
                    {ad.duration}s ·{" "}
                    <span className="text-emerald-500 font-semibold">
                      +{formatUSD(ad.reward)}
                    </span>
                  </p>
                </div>
                <button
                  disabled={todayAds >= 30}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Play className="w-3 h-3 inline mr-1" /> Watch
                </button>
              </motion.div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8 text-sm">
              <TvMinimal className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              No ads available right now
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Watched", value: "0", color: "text-emerald-500" },
          { label: "Total Earned", value: formatUSD(0), color: "text-amber-500" },
          { label: "Day Streak", value: "🔥 0", color: "text-white" },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
