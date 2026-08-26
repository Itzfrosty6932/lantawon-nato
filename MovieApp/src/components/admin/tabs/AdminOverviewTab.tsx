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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AdminTabId } from "@/components/admin/AdminSidebar";

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  /** Active-subscription count keyed by package code */
  countsByCode: Record<string, number>;
  pendingPayments: number;
  approvedPaymentsThisMonth: number;
  activeSessions: number;
  openTickets: number;
  totalRevenue: number;
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
        .neq("role", "admin");  // Exclude admins from user count

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

      setPackages((packageRows || []) as PackageInfo[]);

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

      // Get approved payments this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: approvedPayments } = await supabase
        .from("payment_submissions")
        .select("amount")
        .eq("status", "approved")
        .gte("created_at", startOfMonth.toISOString());

      const approvedPaymentsThisMonth = approvedPayments?.length || 0;
      const totalRevenue = approvedPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

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
        approvedPaymentsThisMonth,
        activeSessions: activeSessions || 0,
        openTickets: openTickets || 0,
        totalRevenue,
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
      <div>
        <h2 className="text-2xl font-black text-white">Dashboard Overview</h2>
        <p className="text-sm text-zinc-400 mt-1">Real-time system statistics</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {stats.totalUsers.toLocaleString()}
            </div>
            <div className="text-sm text-blue-300 font-bold">Total Users</div>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {stats.activeSubscriptions.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-300 font-bold">Active Subscriptions</div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20">
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

        {/* Open Tickets */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <MessageSquare className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">
              {stats.openTickets.toLocaleString()}
            </div>
            <div className="text-sm text-purple-300 font-bold">Open Tickets</div>
          </div>
        </div>
      </div>

      {/* Package Breakdown — driven by the real subscription_packages rows */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Subscription Breakdown</h3>
        <div
          className={`grid grid-cols-1 gap-4 ${
            packages.length > 1 ? "sm:grid-cols-3" : "max-w-sm"
          }`}
        >
          {packages.map((pkg) => (
            <div key={pkg.id} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5 text-zinc-400" />
                <span className="font-bold text-white">{pkg.name}</span>
              </div>
              <div className="text-2xl font-black text-white">
                {(stats.countsByCode[pkg.code] || 0).toLocaleString()}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                ₱{pkg.price_php}/month • {pkg.max_concurrent_sessions}{" "}
                {pkg.max_concurrent_sessions === 1 ? "session" : "sessions"}
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
            ₱{stats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-sm text-zinc-500">
            {stats.approvedPaymentsThisMonth} approved payments
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
            Currently streaming
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
              {stats.pendingPayments} pending
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
              Update dashboard
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
