"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  CreditCard,
  Package,
  MessageSquare,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AdminTabId } from "@/components/admin/AdminSidebar";
import { withCanonicalPrice } from "@/lib/constants/pricing";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  /** Active-subscription count keyed by package code */
  countsByCode: Record<string, number>;
  pendingPayments: number;
  approvedPaymentsCount: number;
  approvedPaymentsThisMonth: number;
  activeSessions: number;
  openTickets: number;
  totalRevenue: number;
  revenueThisMonth: number;
}

interface PackageInfo {
  id: string;
  code: string;
  name: string;
  price_php: number;
  max_concurrent_sessions: number;
}

interface AdminOverviewTabProps {
  /** Wired by admin/page.tsx so Quick Actions can jump between tabs */
  onNavigate?: (tab: AdminTabId) => void;
}

export function AdminOverviewTab({ onNavigate }: AdminOverviewTabProps) {
  const supabase = createClient();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    setLoading(true);

    try {
      // Get total users (profiles)
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .neq("role", "admin"); // Exclude admins from user count

      // Get active subscriptions
      const { count: activeSubscriptions } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get package breakdown (dynamic — single-plan platform, codes may change)
      const [{ data: activeSubRows }, { data: packageRows }] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("current_package_id")
          .eq("status", "active"),
        supabase
          .from("subscription_packages")
          .select("id, code, name, price_php, max_concurrent_sessions")
          .eq("is_active", true)
          .order("display_order"),
      ]);

      setPackages(((packageRows || []) as PackageInfo[]).map(withCanonicalPrice));

      const countsByCode: Record<string, number> = {};
      for (const row of activeSubRows || []) {
        const pkg = (packageRows || []).find((p: any) => p.id === row.current_package_id);
        if (pkg) countsByCode[pkg.code] = (countsByCode[pkg.code] || 0) + 1;
      }

      // Get pending payments
      const { count: pendingPayments } = await supabase
        .from("payment_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get approved payments (all-time & this month)
      // Note: payment_submissions uses `submitted_at`, NOT `created_at`
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: allApprovedPayments } = await supabase
        .from("payment_submissions")
        .select("amount, submitted_at, reviewed_at")
        .eq("status", "approved");

      const approvedRows = allApprovedPayments || [];
      const totalRevenue = approvedRows.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const thisMonthRows = approvedRows.filter((p) => {
        const dateStr = p.reviewed_at || p.submitted_at;
        return dateStr ? new Date(dateStr) >= startOfMonth : true;
      });

      const revenueThisMonth = thisMonthRows.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const approvedPaymentsThisMonth = thisMonthRows.length;

      // Get active sessions
      const { count: activeSessions } = await supabase
        .from("member_sessions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Get open tickets
      const { count: openTickets } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]);

      setStats({
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        countsByCode,
        pendingPayments: pendingPayments || 0,
        approvedPaymentsCount: approvedRows.length,
        approvedPaymentsThisMonth,
        activeSessions: activeSessions || 0,
        openTickets: openTickets || 0,
        totalRevenue,
        revenueThisMonth,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#E50914]" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16 text-zinc-400">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Failed to load dashboard statistics</p>
        <button
          onClick={loadDashboardStats}
          className="mt-4 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Dashboard Overview</h2>
          <p className="text-sm text-zinc-400 mt-1">Real-time platform revenue & user analytics</p>
        </div>
        <button
          type="button"
          onClick={loadDashboardStats}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white transition-colors"
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Verified Revenue */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-600/10 to-emerald-700/5 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {stats.approvedPaymentsCount} Approved
            </span>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              ₱{stats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-300 font-bold">Total Platform Revenue</div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-600/5 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <CheckCircle2 className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {stats.activeSubscriptions.toLocaleString()}
            </div>
            <div className="text-sm text-blue-300 font-bold">Active Subscriptions</div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-500/30">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {stats.pendingPayments.toLocaleString()}
            </div>
            <div className="text-sm text-amber-300 font-bold">Pending Payments</div>
          </div>
        </div>

        {/* Total Users */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/15 to-purple-600/5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-purple-300 font-bold">Registered Users</div>
          </div>
        </div>
      </div>

      {/* Package Breakdown */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Subscription Packages</h3>
        <div
          className={`grid grid-cols-1 gap-4 ${
            packages.length > 1 ? "sm:grid-cols-3" : "max-w-sm"
          }`}
        >
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5 text-[#E50914]" />
                <span className="font-bold text-white">{pkg.name}</span>
              </div>
              <div className="text-2xl font-black text-white">
                {(stats.countsByCode[pkg.code] || 0).toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                ₱{pkg.price_php}/month • {pkg.max_concurrent_sessions}{" "}
                {pkg.max_concurrent_sessions === 1 ? "active screen" : "active screens"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue & Sessions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Revenue This Month */}
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-[#E50914]/20">
              <CreditCard className="h-5 w-5 text-[#E50914]" />
            </div>
            <span className="font-bold text-white">Revenue This Month</span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            ₱{stats.revenueThisMonth.toLocaleString()}
          </div>
          <div className="text-sm text-zinc-500">
            {stats.approvedPaymentsThisMonth} payments approved this month
          </div>
        </div>

        {/* Active Sessions */}
        <div className="p-6 rounded-xl bg-zinc-950 border border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="font-bold text-white">Active Sessions</span>
          </div>
          <div className="text-3xl font-black text-white mb-1">
            {stats.activeSessions.toLocaleString()}
          </div>
          <div className="text-sm text-zinc-500">
            Currently streaming members
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onNavigate?.("payments")}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-[#E50914]/40 transition-colors text-left"
          >
            <CreditCard className="h-5 w-5 text-amber-400 mb-2" />
            <div className="font-bold text-white text-sm">Review Payments</div>
            <div className="text-xs text-zinc-500 mt-1">
              {stats.pendingPayments} pending approval
            </div>
          </button>

          <button
            onClick={() => onNavigate?.("support")}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-[#E50914]/40 transition-colors text-left"
          >
            <MessageSquare className="h-5 w-5 text-purple-400 mb-2" />
            <div className="font-bold text-white text-sm">Handle Tickets</div>
            <div className="text-xs text-zinc-500 mt-1">
              {stats.openTickets} open tickets
            </div>
          </button>

          <button
            onClick={loadDashboardStats}
            className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-[#E50914]/40 transition-colors text-left"
          >
            <Activity className="h-5 w-5 text-emerald-400 mb-2" />
            <div className="font-bold text-white text-sm">Refresh Stats</div>
            <div className="text-xs text-zinc-500 mt-1">
              Update dashboard live
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
