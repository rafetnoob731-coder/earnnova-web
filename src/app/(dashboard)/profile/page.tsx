"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { User, Mail, Phone, Lock, Save, Gift, IdCard, ShieldCheck, UserCircle } from "lucide-react";
import { formatUSD, shortId } from "@/lib/utils";

export default function ProfilePage() {
  const [name, setName] = useState("User");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-emerald-500" /> My Profile
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 text-center"
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-3xl font-black text-white shadow-lg shadow-emerald-500/20 mb-4">
          U
        </div>
        <h2 className="text-xl font-bold text-white">User</h2>
        <p className="text-sm text-slate-400">user@email.com</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-xs bg-navy-600/50 px-3 py-1.5 rounded-full text-slate-400 border border-white/5">
            <IdCard className="w-3 h-3 inline mr-1" />
            ID: {shortId("usr_abc123def")}
          </span>
          <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <User className="w-3 h-3 inline mr-1" />
            USER
          </span>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Balance", value: formatUSD(0), color: "text-emerald-500" },
          { label: "Ads Watched", value: "0", color: "text-white" },
          { label: "Total Earned", value: formatUSD(0), color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Edit Form */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Save className="w-4 h-4 text-amber-500" /> Edit Profile
        </h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input pl-10"
                required
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">
              Phone <span className="text-slate-600">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+8801XXXXXXXXX"
                className="glass-input pl-10"
              />
            </div>
          </div>
          <div className="pt-4 border-t border-white/5">
            <p className="text-xs text-slate-500 mb-3 font-medium">
              Change Password{" "}
              <span className="text-slate-600 font-normal">
                (leave blank to keep current)
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input type="password" placeholder="Current" className="glass-input" />
              <input type="password" placeholder="New" className="glass-input" minLength={6} />
              <input type="password" placeholder="Confirm" className="glass-input" minLength={6} />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Referral Section */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Gift className="w-4 h-4 text-emerald-500" /> Referral Program
        </h3>
        <div className="flex items-center justify-between p-3 rounded-xl bg-navy-600/50 mb-3">
          <span className="text-xs text-slate-400">Your Referral Code</span>
          <span className="text-sm font-bold text-emerald-500 tracking-wider">
            ABC12345
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Share your referral code with friends. You earn{" "}
          <strong className="text-emerald-500">$0.50</strong> for every person who signs
          up using your code!
        </p>
      </div>
    </div>
  );
}
