"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Coins,
  CreditCard,
  Users,
  User,
  History,
  Menu,
  X,
  Shield,
  LogOut,
  Bell,
} from "lucide-react";
import { cn, shortId } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/earn", label: "Earn", icon: Coins },
  { href: "/withdraw", label: "Withdraw", icon: CreditCard },
  { href: "/referrals", label: "Referrals", icon: Users },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-navy-800 overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-navy-700/50 backdrop-blur-xl border-r border-white/5 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-emerald-500/20">
            E
          </div>
          <div>
            <div className="font-bold text-sm tracking-wider text-white">
              EARNNOVA
            </div>
            <div className="text-[10px] text-emerald-500 font-medium tracking-widest uppercase">
              Premium
            </div>
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-xs font-bold text-white">
              U
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">
                User
              </div>
              <div className="text-[10px] text-slate-500 truncate">
                ID: {shortId("user_abc123")}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between bg-navy-800/50 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-400">Balance</span>
            <span className="text-sm font-bold text-emerald-500">$0.00</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-white/5">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-500 hover:bg-amber-500/10 transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </Link>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/5">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (Overlay) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 z-50 h-full w-72 bg-navy-700 backdrop-blur-2xl border-r border-white/5 overflow-y-auto md:hidden"
            >
              {/* Same sidebar content as desktop */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center font-black text-sm text-white">
                    E
                  </div>
                  <span className="font-bold text-sm text-white">EARNNOVA</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="px-3 py-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                      isActive(item.href)
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-navy-700/80 backdrop-blur-xl border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm tracking-wider text-emerald-500">
            EARNNOVA
          </span>
          <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xs font-bold text-white">
            U
          </Link>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <div className="max-w-5xl mx-auto px-3 md:px-6 py-4 md:py-6">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {children}
            </motion.div>
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-navy-700/95 backdrop-blur-xl border-t border-white/5 pb-[env(safe-area-inset-bottom,0px)]">
          <div className="flex items-center justify-around py-1.5">
            {NAV_ITEMS.slice(0, 5).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200",
                  isActive(item.href)
                    ? "text-emerald-500"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </main>
    </div>
  );
}
