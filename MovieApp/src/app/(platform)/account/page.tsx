"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  User as UserIcon,
  Shield,
  Crown,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Wifi,
  Zap,
  Trash2,
  Edit3,
  Check,
  LogIn,
  Sliders,
  ExternalLink,
  Mail,
  Undo2,
  Send,
  XCircle,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { NetworkGuard } from "@/lib/utils/network-guard";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/db/dexie-db";
import {
  subscriptionService,
  type Subscription,
  type SubscriptionPackage,
} from "@/lib/services/subscription-service";
import {
  getRefundEligibility,
  requestRefund,
  type RefundEligibility,
} from "@/lib/services/refund-service";

/** Complete date formatter: Month Day, Year (e.g. August 25, 2026) */
function formatFullDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type AccountTab = "profile" | "preferences" | "security";

export default function AccountPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AccountTab>("profile");

  const isAuthenticated = Boolean(
    user && user.isLoggedIn === true && user.role !== "guest"
  );
  const isAdmin =
    isAuthenticated &&
    (user.role === "admin" ||
      user.role === "super_admin" ||
      profile?.role === "admin" ||
      profile?.role === "super_admin");

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Streaming / Network State
  const [dataSaver, setDataSaver] = useState(false);
  const [netStatus, setNetStatus] = useState({
    isCellular: false,
    effectiveType: "4g",
  });

  // Password Update State
  const supabase = useMemo(() => createClient(), []);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Real Subscription Dates for non-admin subscriber users
  const [subData, setSubData] = useState<{
    sub: Subscription | null;
    pkg: SubscriptionPackage | null;
  }>({ sub: null, pkg: null });

  // In-line Refund State (No Modals)
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundEligibility, setRefundEligibility] = useState<RefundEligibility | null>(null);
  const [existingRefund, setExistingRefund] = useState<any>(null);
  const [latestPaymentId, setLatestPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const ns = NetworkGuard.getNetworkStatus();
    setDataSaver(ns.isDataSaver);
    setNetStatus({
      isCellular: ns.isCellular,
      effectiveType: ns.effectiveType,
    });
  }, []);

  useEffect(() => {
    if (profile?.displayName) {
      setEditDisplayName(profile.displayName);
    } else if (user?.email) {
      setEditDisplayName(user.email.split("@")[0]);
    }
  }, [profile, user]);

  // Load subscriber dates and refund status asynchronously
  useEffect(() => {
    if (!isAuthenticated || isAdmin || !user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const account = await subscriptionService.getUserAccount(user.id);
        if (!account || !mounted) return;
        const res = await subscriptionService.getSubscriptionWithPackage(account.id);
        if (mounted && res.subscription) {
          setSubData({ sub: res.subscription, pkg: res.currentPackage });
        }

        // Fetch refund eligibility and existing refund requests
        const [eligibility, { data: refData }, { data: payData }] = await Promise.all([
          getRefundEligibility(account.id),
          supabase
            .from("refund_requests")
            .select("*")
            .eq("account_id", account.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("payment_submissions")
            .select("id, amount, status")
            .eq("account_id", account.id)
            .eq("status", "approved")
            .order("submitted_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (mounted) {
          setRefundEligibility(eligibility);
          setExistingRefund(refData || null);
          setLatestPaymentId(payData?.id || null);
        }
      } catch {}
    })();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, isAdmin, user?.id, supabase]);

  const handleToggleDataSaver = () => {
    const next = !dataSaver;
    setDataSaver(next);
    NetworkGuard.setDataSaver(next);
    audioFX.playPop();
    showToast(
      next
        ? "Ultra Data Saver ON"
        : "Data Saver OFF — Full resolution restored",
      "info"
    );
  };

  const handleSaveProfile = async () => {
    if (!editDisplayName.trim()) {
      showToast("Display name cannot be empty.", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: editDisplayName.trim(), name: editDisplayName.trim() },
      });
      if (error) {
        showToast(error.message, "error");
        return;
      }
      audioFX.playSuccess();
      showToast("Profile updated successfully.", "success");
      setIsEditingProfile(false);
      window.location.reload();
    } catch {
      showToast("Failed to update profile.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Passwords don't match.", "error");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
        showToast(error.message, "error");
        return;
      }
      audioFX.playSuccess();
      showToast("Password updated successfully.", "success");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Failed to update password.", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSubmitRefund = async () => {
    if (!latestPaymentId) {
      showToast("No eligible payment submission found to refund.", "error");
      return;
    }
    if (refundReason.trim().length < 10) {
      showToast("Please provide a reason with at least 10 characters.", "error");
      return;
    }

    setSubmittingRefund(true);
    audioFX.playClick();

    try {
      const res = await requestRefund(latestPaymentId, refundReason);
      if (!res.success) {
        throw new Error(res.error || "Failed to submit refund request.");
      }

      audioFX.playSuccess();
      showToast("Refund request submitted for admin review.", "success");
      setShowRefundForm(false);
      setRefundReason("");

      // Reload refund status
      const account = await subscriptionService.getUserAccount(user.id);
      if (account) {
        const { data: refData } = await supabase
          .from("refund_requests")
          .select("*")
          .eq("account_id", account.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        setExistingRefund(refData);
      }
    } catch (err: any) {
      showToast(err.message || "Refund request failed.", "error");
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleClearLocalCache = async () => {
    try {
      await Promise.all([
        db.watchHistory.clear(),
        db.libraryItems.clear(),
        db.searchHistory.clear(),
      ]);
      localStorage.removeItem("offline_favorites");
      localStorage.removeItem("recent_search_terms");
      sessionStorage.clear();

      audioFX.playPop();
      showToast("Local playback cache cleaned successfully.", "success");
    } catch {
      showToast("Failed to clear local cache.", "error");
    }
  };

  const displayName = profile?.displayName || (user as any)?.name || user?.email?.split("@")[0] || "Member";
  const email = user?.email || profile?.email || null;
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatarUrl || (user as any)?.avatar || null;

  const rawCreated = (profile as any)?.createdAt || (user as any)?.created_at || (user as any)?.createdAt;
  const memberSinceFormatted = formatFullDate(rawCreated || "2026-08-25T00:00:00.000Z");

  const subStartDate = formatFullDate(
    subData.sub?.current_period_start || (subData.sub as any)?.created_at || rawCreated
  );
  const subEndDate = formatFullDate(subData.sub?.current_period_end);

  return (
    <div className="w-full space-y-6 sm:space-y-8 select-none">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>My Account</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your personal profile, access tier, and playback preferences.
          </p>
        </div>

        {/* Quick Admin Shortcut if Administrator */}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => audioFX.playClick()}
            className="btn-yt-active px-4 py-2 text-xs font-bold shrink-0 self-start sm:self-auto shadow-lg"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Control Panel</span>
            <ExternalLink className="h-3 w-3 ml-0.5" />
          </Link>
        )}
      </div>

      {/* ─── GUEST LIMITATION BANNER (If not authenticated) ─── */}
      {!authLoading && !isAuthenticated && (
        <div className="rounded-2xl bg-[#141518]/90 border border-[#E50914]/30 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914] shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Guest Mode · Limited Access
              </h3>
              <p className="text-xs text-zinc-300">
                You are currently in guest preview mode. Sign in to unlock full cloud sync, multi-audio anime streaming, and personalized watchlist.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <Link
              href="/login"
              onClick={() => audioFX.playClick()}
              className="btn-yt-active px-5 py-2 text-xs font-bold"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
            <Link
              href="/signup"
              onClick={() => audioFX.playClick()}
              className="btn-yt px-5 py-2 text-xs font-semibold"
            >
              <span>Create Account</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── NAVIGATION SECTION TABS (YouTube Dark Mode Pills) ─── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "profile" as const, label: "Profile & Plan", icon: UserIcon },
          { id: "preferences" as const, label: "Playback & Network", icon: Sliders },
          { id: "security" as const, label: "Security & Cache", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                audioFX.playClick();
                setActiveTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-white text-zinc-950 shadow-md"
                  : "bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 border border-white/10"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: PROFILE & PLAN (Clean Single-Layer Main Panel) ─── */}
      {activeTab === "profile" && (
        <div className="rounded-2xl bg-[#141518]/90 border border-white/10 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6 animate-in fade-in duration-150">
          {/* User Header Profile Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar Emblem */}
            <div className="relative shrink-0">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-white/20 bg-zinc-900 flex items-center justify-center shadow-xl">
                {avatarUrl ? (
                  <SmartImage
                    src={avatarUrl}
                    alt={displayName}
                    fallbackType="avatar"
                    containerClassName="w-full h-full"
                    className="w-full h-full object-cover object-top"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {initials || "U"}
                  </span>
                )}
              </div>
              {isAdmin && (
                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#E50914] border-2 border-[#141518] flex items-center justify-center text-white shadow-lg" title="System Admin">
                  <Crown className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            {/* Display Name & Email */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
              {isEditingProfile ? (
                <div className="space-y-2.5 pt-1">
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Enter display name"
                    maxLength={30}
                    className="w-full max-w-md px-3.5 py-2 rounded-xl bg-black/60 border border-white/20 text-white placeholder:text-zinc-600 text-base sm:text-sm outline-none focus:border-[#E50914] transition-colors"
                  />
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="btn-yt-active px-4 py-1.5 text-xs font-bold"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="btn-yt px-4 py-1.5 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate">
                      {displayName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        audioFX.playClick();
                        setIsEditingProfile(true);
                      }}
                      className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Edit Display Name"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {email && (
                    <p className="text-xs sm:text-sm text-zinc-400 flex items-center justify-center sm:justify-start gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span>{email}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Flat Single-Layer Row Dividers */}
          <div className="border-t border-white/10 pt-4 divide-y divide-white/5 text-xs sm:text-sm">
            {/* Account Tier Row */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${isAdmin ? "bg-red-500/20 text-[#E50914]" : "bg-emerald-500/20 text-emerald-400"}`}>
                  {isAdmin ? <Crown className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div>
                  <div className="font-bold text-white">
                    {isAdmin ? "System Admin" : isAuthenticated ? "Solo Subscriber" : "Guest Preview"}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {isAdmin ? "Full Lifetime Access (Super Admin)" : isAuthenticated ? "Unlimited Streaming & Watchlist Sync" : "Basic Catalog Access"}
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider whitespace-nowrap ${
                isAdmin
                  ? "bg-[#E50914]/20 border border-[#E50914]/40 text-[#E50914]"
                  : isAuthenticated
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                  : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              }`}>
                {isAdmin ? "Free Lifetime" : isAuthenticated ? "Active" : "Guest"}
              </span>
            </div>

            {/* Member Since Row */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-400">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Member Since</div>
                  <div className="text-[11px] text-zinc-400">Original registration date</div>
                </div>
              </div>
              <div className="text-right font-mono font-bold text-white text-xs sm:text-sm">
                {memberSinceFormatted}
              </div>
            </div>

            {/* Non-Admin Subscriber Start & Renewal Dates */}
            {!isAdmin && isAuthenticated && (
              <>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Subscription Start</div>
                      <div className="text-[11px] text-zinc-400">Current billing cycle started</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-white text-xs sm:text-sm">
                    {subStartDate}
                  </div>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white">Renewal / Expiration</div>
                      <div className="text-[11px] text-zinc-400">Next billing period</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-white text-xs sm:text-sm">
                    {subEndDate}
                  </div>
                </div>

                {/* ── In-Line Refund Section (Flat, In-Page, Zero Popups) ── */}
                <div className="py-4 space-y-3">
                  {existingRefund ? (
                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Undo2 className="h-4 w-4 text-amber-400" />
                          <span className="font-bold text-white">Subscription Refund Request</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          existingRefund.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : existingRefund.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {existingRefund.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <span className="text-zinc-500 font-semibold">Your reason:</span> {existingRefund.reason}
                      </p>
                      {existingRefund.decision_note && (
                        <p className="text-[11px] text-zinc-400">
                          <span className="text-zinc-500 font-semibold">Admin response:</span> {existingRefund.decision_note}
                        </p>
                      )}
                    </div>
                  ) : showRefundForm ? (
                    <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Undo2 className="h-4 w-4 text-[#E50914]" />
                          <span className="font-bold text-white">Request Subscription Refund</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {refundEligibility?.eligible
                            ? "✅ 100% Eligible (0 watched)"
                            : "⚠️ Subject to Admin Review"}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400">
                        Refunds are evaluated based on content consumption. Enter your reason below:
                      </p>

                      <textarea
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Please describe why you would like a refund (minimum 10 characters)..."
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-600 text-base sm:text-xs outline-none focus:border-[#E50914] resize-none"
                      />

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={submittingRefund || refundReason.trim().length < 10}
                          onClick={handleSubmitRefund}
                          className="btn-yt-active px-4 py-2 text-xs font-bold disabled:opacity-40"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>{submittingRefund ? "Submitting..." : "Submit Refund Request"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowRefundForm(false)}
                          className="btn-yt px-4 py-2 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div>
                        <div className="font-bold text-white">Refund Subscription</div>
                        <div className="text-[11px] text-zinc-400">Request GCash refund for your latest billing cycle</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          audioFX.playClick();
                          setShowRefundForm(true);
                        }}
                        className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Request Refund
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: PLAYBACK & NETWORK (Clean Single-Layer Main Panel) ─── */}
      {activeTab === "preferences" && (
        <div className="rounded-2xl bg-[#141518]/90 border border-white/10 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-4 animate-in fade-in duration-150">
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight border-b border-white/10 pb-3">
            Streaming &amp; Bandwidth Preferences
          </h2>

          <div className="divide-y divide-white/5 text-xs sm:text-sm">
            {/* Active Connection */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-400">
                  <Wifi className={`h-4 w-4 ${netStatus.isCellular ? "text-amber-400" : "text-emerald-400"}`} />
                </div>
                <div>
                  <div className="font-bold text-white">Active Connection</div>
                  <div className="text-[11px] text-zinc-400">
                    {netStatus.isCellular
                      ? `Cellular Mobile Data (${netStatus.effectiveType.toUpperCase()})`
                      : "High-Speed Broadband / Wi-Fi"}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                netStatus.isCellular
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}>
                {netStatus.isCellular ? "CELLULAR" : "ONLINE"}
              </span>
            </div>

            {/* Ultra Data Saver */}
            <div className="py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-400">
                  <Zap className={`h-4 w-4 ${dataSaver ? "text-amber-400 fill-amber-400" : "text-zinc-400"}`} />
                </div>
                <div>
                  <div className="font-bold text-white">Ultra Data Saver Mode</div>
                  <div className="text-[11px] text-zinc-400">
                    {dataSaver
                      ? "Active — Conserving ~60% video stream bandwidth"
                      : "Off — Full 1080p stream resolution enabled"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleDataSaver}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dataSaver ? "bg-amber-500" : "bg-white/20"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    dataSaver ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SECURITY & CACHE (Clean Single-Layer Main Panel) ─── */}
      {activeTab === "security" && (
        <div className="rounded-2xl bg-[#141518]/90 border border-white/10 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6 animate-in fade-in duration-150">
          {/* Security Header */}
          <h2 className="text-sm sm:text-base font-bold text-white tracking-tight border-b border-white/10 pb-3">
            Account Security &amp; Local Storage
          </h2>

          <div className="divide-y divide-white/5 text-xs sm:text-sm">
            {/* Password Section */}
            <div className="py-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white">Account Password</div>
                    <div className="text-[11px] text-zinc-400">
                      Keep your streaming account secure with a strong password
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    audioFX.playClick();
                    setShowPasswordForm(!showPasswordForm);
                  }}
                  className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {showPasswordForm ? "Cancel" : "Change"}
                </button>
              </div>

              {/* Expandable Password Form */}
              {showPasswordForm && (
                <div className="pt-3 space-y-3 max-w-md">
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (min. 8 chars)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder:text-zinc-600 text-base sm:text-xs outline-none focus:border-[#E50914] transition-colors"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white placeholder:text-zinc-600 text-base sm:text-xs outline-none focus:border-[#E50914] transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="btn-yt-active px-5 py-2 text-xs font-bold disabled:opacity-50"
                  >
                    {changingPassword ? "Updating…" : "Update Password"}
                  </button>
                </div>
              )}
            </div>

            {/* Clear Local Cache */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 text-zinc-400">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-white">Clear Offline &amp; Playback Cache</div>
                  <div className="text-[11px] text-zinc-400">
                    Purge offline thumbnail blobs and indexedDB state
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearLocalCache}
                className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
