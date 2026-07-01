/**
 * EARNNOVA — Database Schema (Drizzle ORM)
 * PostgreSQL via Supabase
 */

// Schema definition for the database tables
// In production, this would be: import { pgTable, ... } from "drizzle-orm/pg-core";
// For now, these are type definitions to document the schema

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  password: string;
  phone: string | null;
  photoUrl: string | null;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  adsWatched: number;
  todayAds: number;
  lastAdDate: string | null;
  referralCode: string;
  referredBy: string | null;
  streak: number;
  lastActive: string | null;
  isActive: boolean;
  isAdmin: boolean;
  planId: string | null;
  planExpiry: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  description: string | null;
  createdAt: string;
}

export interface Ad {
  id: string;
  title: string;
  reward: number;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdWatch {
  id: string;
  userId: string;
  adId: string;
  reward: number;
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  method: string;
  amount: number;
  details: Record<string, string>;
  status: "pending" | "approved" | "rejected";
  approvedBy: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referredName: string;
  bonus: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string | null;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  createdAt: string;
}

export interface SystemConfig {
  id: string;
  minWithdrawal: number;
  dailyAdLimit: number;
  adCooldownMinutes: number;
  referralBonus: number;
  updatedAt: string;
}

// Default config values
export const DEFAULT_CONFIG: SystemConfig = {
  id: "default",
  minWithdrawal: 5,
  dailyAdLimit: 30,
  adCooldownMinutes: 10,
  referralBonus: 0.5,
  updatedAt: new Date().toISOString(),
};
