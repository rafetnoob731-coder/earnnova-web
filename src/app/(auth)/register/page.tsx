"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Gift, ArrowRight, Eye, EyeOff, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    // Mock registration — replace with Better Auth
    await new Promise((r) => setTimeout(r, 1000));
    router.push("/dashboard");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 right-1/4 w-56 h-56 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-sm"
      >
        <div className="glass-card p-8 text-center">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-emerald-500/20 mb-4">
              <UserPlus className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wider">
              Create Account
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
              Join EARNNOVA & start earning
            </p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-left">
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
                  placeholder="John Doe"
                  className="glass-input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="glass-input pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="glass-input pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                Referral Code{" "}
                <span className="text-slate-600 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value.toUpperCase())}
                  placeholder="Enter referral code"
                  className="glass-input pl-10 uppercase"
                  maxLength={10}
                />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "btn-primary w-full flex items-center justify-center gap-2 mt-1",
                loading && "opacity-60 cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account 🎉
                </span>
              )}
            </motion.button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-white/5" />
            <span className="px-4 text-xs text-slate-500 font-medium">or</span>
            <div className="flex-1 border-t border-white/5" />
          </div>

          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-emerald-500 font-semibold hover:text-emerald-400 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
