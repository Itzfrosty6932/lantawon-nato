"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Loader2,
  Ban,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Clock,
  CreditCard,
  Undo2,
  MessageSquare,
  Activity,
  Key,
  Calendar,
  Lock,
  Eye,
  Tv,
  Check,
  Film,
  ArrowLeft,
  ExternalLink,
  Mail,
  Smartphone,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";

export type AdminUserRole = "user" | "admin";

interface ManagedUser {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  role: string;
  xp_total: number;
  current_level: number;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  subscription_status: string | null;
  package_name: string | null;
  period_start?: string | null;
  period_end: string | null;
  device_count: number;
}

interface UserDetailData {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  subscription: any;
  payments: any[];
  refunds: any[];
  tickets: any[];
  devices: any[];
  watchTelemetry: {
    totalWatchSeconds: number;
    nonTrailerCount: number;
    totalProgressItems: number;
    recentProgress: any[];
    recentSessions: any[];
  };
}

function formatFullDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSeconds(secs: number): string {
  if (!secs || secs <= 0) return "0 mins";
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} mins`;
}

type UserDetailTab =
  | "overview"
  | "subscription"
  | "payments"
  | "refunds"
  | "support"
  | "watch"
  | "actions";

export function AdminUsersTab() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);

  // In-Page Main Panel Inspection State (No Modals)
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [detailData, setDetailData] = useState<UserDetailData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailTab, setDetailTab] = useState<UserDetailTab>("overview");

  // Password Reset in Actions tab
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users${search.trim() ? `?query=${encodeURIComponent(search.trim())}` : ""}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { users: ManagedUser[] };
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error loading users:", err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadUsers, search]);

  const loadUserDetails = async (user: ManagedUser) => {
    audioFX.playClick();
    setSelectedUser(user);
    setDetailData(null);
    setLoadingDetails(true);
    setDetailTab("overview");
    setNewPassword("");
    setConfirmPassword("");
    setGeneratedPass(null);

    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}&details=true`);
      if (!res.ok) throw new Error("Failed to load user details");
      const data = await res.json();
      setDetailData(data.user);
    } catch (err) {
      showToast("Error loading user profile details.", "error");
    } finally {
      setLoadingDetails(false);
    }
  };

  const patchUser = async (user: ManagedUser, body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...body }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error || `HTTP ${res.status}`);
    }
  };

  const handleToggleBan = async (user: ManagedUser) => {
    setBusyUserId(user.id);
    try {
      await patchUser(user, { banned: !user.banned });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, banned: !u.banned } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...user, banned: !user.banned });
        if (detailData) setDetailData({ ...detailData, banned: !user.banned });
      }
      showToast(
        user.banned ? "Account enabled" : "Account disabled — active sessions revoked",
        "success"
      );
    } catch (err) {
      showToast((err as Error).message, "error");
      loadUsers();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyUserId(confirmDelete.id);
    try {
      const res = await fetch(
        `/api/admin/users?userId=${encodeURIComponent(confirmDelete.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      showToast("User account deleted successfully.", "success");
      setConfirmDelete(null);
      if (selectedUser?.id === confirmDelete.id) {
        setSelectedUser(null);
        setDetailData(null);
      }
      loadUsers();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const handleAdminResetPassword = async (isRandom = false) => {
    if (!selectedUser) return;

    if (!isRandom) {
      if (newPassword.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
      }
      if (newPassword !== confirmPassword) {
        showToast("Passwords do not match.", "error");
        return;
      }
    }

    setResettingPassword(true);
    setGeneratedPass(null);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          password: isRandom ? undefined : newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reset failed");

      audioFX.playSuccess();
      showToast("Password updated successfully!", "success");
      setGeneratedPass(data.tempPassword);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setResettingPassword(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (statusFilter === "active" && u.banned) return false;
    if (statusFilter === "disabled" && !u.banned) return false;
    return true;
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: IN-PAGE USER DETAILS (Main Panel, Flat, Zero Nested Cards, Zero Modals)
  // ─────────────────────────────────────────────────────────────────────────────
  if (selectedUser) {
    const name = selectedUser.display_name || selectedUser.username || selectedUser.email?.split("@")[0] || "User";

    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        {/* Back Button & Header */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              setSelectedUser(null);
              setDetailData(null);
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Back to All Users"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/15 flex items-center justify-center font-bold text-white text-base shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-tight">{name}</h2>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  selectedUser.banned
                    ? "bg-red-500/20 border border-red-500/30 text-red-400"
                    : "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                }`}
              >
                {selectedUser.banned ? "Disabled" : "Active"}
              </span>
              {selectedUser.role === "admin" && (
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                  ADMIN
                </span>
              )}
            </div>
            <div className="text-xs text-zinc-400 truncate mt-0.5">{selectedUser.email || "No email"}</div>
          </div>
        </div>

        {/* Flat Pill Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "overview" as const, label: "Overview", icon: Users },
            { id: "subscription" as const, label: "Subscription", icon: ShieldCheck },
            { id: "payments" as const, label: `Payments (${detailData?.payments?.length || 0})`, icon: CreditCard },
            { id: "refunds" as const, label: `Refunds (${detailData?.refunds?.length || 0})`, icon: Undo2 },
            { id: "support" as const, label: `Support (${detailData?.tickets?.length || 0})`, icon: MessageSquare },
            { id: "watch" as const, label: "Watch Activity", icon: Tv },
            { id: "actions" as const, label: "Account Actions", icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = detailTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  audioFX.playClick();
                  setDetailTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? "bg-white text-zinc-950 shadow-md"
                    : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/15 border border-white/10"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body (Flat Single Layer Container) */}
        <div className="rounded-2xl bg-[#141518]/90 border border-white/10 p-5 sm:p-7 backdrop-blur-xl shadow-xl text-xs">
          {loadingDetails ? (
            <div className="py-16 text-center text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
              <span>Loading complete account details &amp; watch history...</span>
            </div>
          ) : (
            <>
              {/* ── Sub-Tab 1: Overview ── */}
              {detailTab === "overview" && (
                <div className="divide-y divide-white/5 space-y-3">
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-zinc-400 font-semibold">User ID</span>
                    <span className="font-mono text-zinc-300 font-bold break-all">{selectedUser.id}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-zinc-400 font-semibold">Email Address</span>
                    <span className="text-white font-bold">{selectedUser.email || "No email on record"}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-zinc-400 font-semibold">Display Name</span>
                    <span className="text-white font-bold">{selectedUser.display_name || selectedUser.username || "—"}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-zinc-400 font-semibold">Member Since</span>
                    <span className="font-mono text-white font-bold">{formatFullDate(selectedUser.created_at)}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-zinc-400 font-semibold">Last Sign In</span>
                    <span className="font-mono text-zinc-300">{formatFullDate(selectedUser.last_sign_in_at)}</span>
                  </div>
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-zinc-400 font-semibold">Active Registered Devices</span>
                    <span className="font-mono text-emerald-400 font-bold">{detailData?.devices?.length || 0} device(s)</span>
                  </div>
                </div>
              )}

              {/* ── Sub-Tab 2: Subscription ── */}
              {detailTab === "subscription" && (
                <div className="space-y-4">
                  {detailData?.subscription ? (
                    <div className="divide-y divide-white/5">
                      <div className="py-3 flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-semibold">Plan Name</span>
                        <span className="text-sm font-bold text-white">
                          {detailData.subscription.package?.name || "Solo VIP Pass"}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-semibold">Subscription Status</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold uppercase text-[10px]">
                          {detailData.subscription.status}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-semibold">Current Billing Start</span>
                        <span className="font-mono text-white">
                          {formatFullDate(detailData.subscription.current_period_start || detailData.subscription.created_at)}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-semibold">Renewal / Expiration Date</span>
                        <span className="font-mono text-white font-bold">
                          {formatFullDate(detailData.subscription.current_period_end)}
                        </span>
                      </div>
                      <div className="py-3 flex items-center justify-between gap-4">
                        <span className="text-zinc-400 font-semibold">Rate</span>
                        <span className="font-mono text-zinc-300">
                          ₱{detailData.subscription.package?.price_php || 99} / {detailData.subscription.package?.billing_interval || "month"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500">
                      User does not have an active paid subscription (Free Tier).
                    </div>
                  )}
                </div>
              )}

              {/* ── Sub-Tab 3: Payments ── */}
              {detailTab === "payments" && (
                <div className="space-y-3">
                  {detailData?.payments && detailData.payments.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {detailData.payments.map((p: any) => (
                        <div key={p.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>₱{p.amount} PHP</span>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                                p.status === "approved"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : p.status === "rejected"
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}>
                                {p.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Ref: <span className="font-mono text-zinc-300">{p.reference_number || "—"}</span> • {formatFullDate(p.submitted_at)}
                            </div>
                          </div>
                          {p.proof_image_url && (
                            <a
                              href={p.proof_image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 text-[11px] font-semibold inline-flex items-center gap-1.5"
                            >
                              <span>View GCash Proof</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500">
                      No payment submissions recorded for this user.
                    </div>
                  )}
                </div>
              )}

              {/* ── Sub-Tab 4: Refunds ── */}
              {detailTab === "refunds" && (
                <div className="space-y-3">
                  {detailData?.refunds && detailData.refunds.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {detailData.refunds.map((r: any) => (
                        <div key={r.id} className="py-3.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                              r.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : r.status === "rejected"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {r.status}
                            </span>
                            <span className="text-zinc-500 font-mono text-[10px]">{formatFullDate(r.created_at)}</span>
                          </div>
                          <p className="text-zinc-300 text-xs leading-relaxed"><span className="text-zinc-500 font-semibold">Reason:</span> {r.reason}</p>
                          {r.decision_note && (
                            <p className="text-zinc-400 text-[11px]"><span className="text-zinc-500 font-semibold">Admin Note:</span> {r.decision_note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500">
                      No refund requests filed by this user.
                    </div>
                  )}
                </div>
              )}

              {/* ── Sub-Tab 5: Support ── */}
              {detailTab === "support" && (
                <div className="space-y-3">
                  {detailData?.tickets && detailData.tickets.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {detailData.tickets.map((t: any) => (
                        <div key={t.id} className="py-3.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{t.title || t.subject || "Support Ticket"}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                              t.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            }`}>
                              {t.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            Category: <span className="text-zinc-300 font-semibold">{t.category || "General"}</span> • {formatFullDate(t.created_at)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-zinc-500">
                      No support tickets found.
                    </div>
                  )}
                </div>
              )}

              {/* ── Sub-Tab 6: Watch Activity ── */}
              {detailTab === "watch" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-white/10 pb-5">
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Total Watch Time</div>
                      <div className="text-base sm:text-lg font-bold text-white font-mono">
                        {formatSeconds(detailData?.watchTelemetry?.totalWatchSeconds || 0)}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Non-Trailer Videos</div>
                      <div className="text-base sm:text-lg font-bold text-white font-mono">
                        {detailData?.watchTelemetry?.nonTrailerCount || 0} watched
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Titles in Progress</div>
                      <div className="text-base sm:text-lg font-bold text-white font-mono">
                        {detailData?.watchTelemetry?.totalProgressItems || 0} titles
                      </div>
                    </div>
                  </div>

                  {detailData?.watchTelemetry?.recentProgress && detailData.watchTelemetry.recentProgress.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-2">
                        Recent Title Progress History
                      </div>
                      {detailData.watchTelemetry.recentProgress.map((p: any) => (
                        <div key={p.id || p.content_id} className="py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Film className="h-4 w-4 text-zinc-400 shrink-0" />
                            <div>
                              <div className="font-bold text-white">{p.media_type === "tv" ? `TV Show (S${p.season_number} E${p.episode_number})` : "Movie"}</div>
                              <div className="text-[11px] text-zinc-500">
                                Progress: {Math.round(p.percentage || 0)}% • {formatSeconds(p.progress_seconds || 0)}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">{formatFullDate(p.last_watched_at)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-zinc-500">
                      No watch activity recorded in database.
                    </div>
                  )}
                </div>
              )}

              {/* ── Sub-Tab 7: Actions ── */}
              {detailTab === "actions" && (
                <div className="space-y-6">
                  {/* Password Reset Form */}
                  <div className="space-y-3 border-b border-white/10 pb-6">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Key className="h-4 w-4 text-emerald-400" />
                      <span>Set User Password</span>
                    </div>

                    {generatedPass && (
                      <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 space-y-1">
                        <div className="text-[10px] uppercase font-bold">New Generated Password:</div>
                        <div className="font-mono font-bold text-sm bg-black/50 p-2 rounded-lg text-white select-all">
                          {generatedPass}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min. 6)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-base sm:text-xs outline-none focus:border-[#E50914]"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-base sm:text-xs outline-none focus:border-[#E50914]"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={resettingPassword || !newPassword || !confirmPassword}
                        onClick={() => handleAdminResetPassword(false)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs disabled:opacity-40 transition-colors cursor-pointer text-center"
                      >
                        {resettingPassword ? "Updating…" : "Set Custom Password"}
                      </button>
                      <button
                        type="button"
                        disabled={resettingPassword}
                        onClick={() => handleAdminResetPassword(true)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer text-center"
                      >
                        Generate Random Temp Password
                      </button>
                    </div>
                  </div>

                  {/* Enable / Disable Account Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                      <div className="font-bold text-white">
                        {selectedUser.banned ? "Account is Disabled" : "Account is Active"}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        {selectedUser.banned
                          ? "User cannot log in and active streaming sessions are revoked."
                          : "User has access according to their subscription plan."}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleBan(selectedUser)}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-full font-bold text-xs transition-all cursor-pointer text-center ${
                        selectedUser.banned
                          ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                          : "bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
                      }`}
                    >
                      {selectedUser.banned ? "Enable Account" : "Disable Account"}
                    </button>
                  </div>

                  {/* Delete Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-red-400">Delete User Account</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Permanently delete account credentials, profiles, and associated records.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(selectedUser)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors cursor-pointer text-center shrink-0"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 2: ALL USERS LIST (Desktop Table + Mobile Cards UI)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Top Bar with Search & Status Filters ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-[#E50914]" />
            <span>User Accounts</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 font-mono">
              {filteredUsers.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            View detailed profiles, payments, watch history, and account actions directly in the main panel.
          </p>
        </div>

        {/* 1. Search Bar on Top */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user by username, email, or ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-white/10 text-white placeholder:text-zinc-500 text-sm outline-none focus:border-[#E50914] transition-colors shadow-sm"
          />
        </div>

        {/* 2. Status Filter Pills Below Search */}
        <div className="flex items-center gap-1.5">
          {(["all", "active", "disabled"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? "bg-white text-zinc-950 font-bold shadow-md"
                  : "bg-zinc-900/90 text-zinc-400 hover:text-white border border-white/10"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2 rounded-2xl bg-[#141518]/90 border border-white/10">
          <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
          <span className="text-xs font-semibold">Loading users database...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 text-xs rounded-2xl bg-[#141518]/90 border border-white/10">
          No users match your search criteria.
        </div>
      ) : (
        <>
          {/* ── 📱 MOBILE CARD UI (Visible only on mobile/small screens) ── */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.map((u) => {
              const isBusy = busyUserId === u.id;
              const name = u.display_name || u.username || u.email?.split("@")[0] || "User";

              return (
                <div
                  key={u.id}
                  onClick={() => loadUserDetails(u)}
                  className="p-4 rounded-2xl bg-[#141518]/95 border border-white/10 space-y-3.5 shadow-lg active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Top: Avatar, Name, Email, Status Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-zinc-800 border border-white/15 flex items-center justify-center font-bold text-white text-sm shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate flex items-center gap-1.5">
                          <span>{name}</span>
                          {u.role === "admin" && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-mono font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">{u.email || "No email"}</div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                        u.banned
                          ? "bg-red-500/20 border border-red-500/30 text-red-400"
                          : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      {u.banned ? "Disabled" : "Active"}
                    </span>
                  </div>

                  {/* Middle: Plan & Joined Date Grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Plan</div>
                      <div className="font-bold text-white mt-0.5">
                        {u.subscription_status === "active" ? (
                          <span className="text-emerald-400 font-mono">
                            {u.package_name || "Solo VIP"}
                          </span>
                        ) : (
                          <span className="text-zinc-400 font-mono">Free Tier</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Joined Date</div>
                      <div className="font-mono text-zinc-300 mt-0.5">{formatFullDate(u.created_at)}</div>
                    </div>
                  </div>

                  {/* Bottom: Full Width Auto-Layout Action Buttons */}
                  <div
                    className="flex items-center gap-2 pt-2 border-t border-white/5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => loadUserDetails(u)}
                      className="flex-1 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleBan(u)}
                      className={`px-4 py-2 rounded-full font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                        u.banned
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>{u.banned ? "Enable" : "Disable"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setConfirmDelete(u)}
                      className="p-2 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 transition-colors flex items-center justify-center cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 💻 DESKTOP TABLE VIEW (Visible only on medium screens and up) ── */}
          <div className="hidden md:block rounded-2xl bg-[#141518]/90 border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Subscription Plan</th>
                    <th className="py-3.5 px-4">Joined Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {filteredUsers.map((u) => {
                    const isBusy = busyUserId === u.id;
                    const name = u.display_name || u.username || u.email?.split("@")[0] || "User";

                    return (
                      <tr
                        key={u.id}
                        onClick={() => loadUserDetails(u)}
                        className="hover:bg-white/[0.04] transition-colors cursor-pointer group"
                      >
                        {/* User Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-bold text-white shrink-0 group-hover:border-[#E50914] transition-colors">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate flex items-center gap-1.5">
                                <span>{name}</span>
                                {u.role === "admin" && (
                                  <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 text-[9px] font-mono font-bold">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-500 truncate">{u.email || "No email"}</div>
                            </div>
                          </div>
                        </td>

                        {/* Plan / Subscription */}
                        <td className="py-3.5 px-4">
                          {u.subscription_status === "active" ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-[10px]">
                                <CheckCircle2 className="h-3 w-3" />
                                {u.package_name || "Solo VIP"}
                              </span>
                              {u.period_end && (
                                <div className="text-[10px] text-zinc-500 font-mono">
                                  Ends: {formatFullDate(u.period_end)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 font-mono text-[10px]">
                              Free Tier
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {formatFullDate(u.created_at)}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                              u.banned
                                ? "bg-red-500/20 border border-red-500/30 text-red-400"
                                : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                            }`}
                          >
                            {u.banned ? "Disabled" : "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadUserDetails(u)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white transition-colors"
                              title="View User Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleBan(u)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.banned
                                  ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400"
                              }`}
                              title={u.banned ? "Enable Account" : "Disable Account"}
                            >
                              <Ban className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDelete(u)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Confirm Delete Dialog (Clean Simple Confirmation) ── */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl bg-[#18191c] border border-white/15 p-6 shadow-2xl space-y-4">
            <div className="h-12 w-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">Delete User Account?</h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to permanently delete{" "}
                <span className="text-white font-bold">{confirmDelete.email || confirmDelete.display_name}</span>?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
