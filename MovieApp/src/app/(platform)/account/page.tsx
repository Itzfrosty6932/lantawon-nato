"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Crown,
  BarChart2,
  Trophy,
  Bookmark,
  Heart,
  Clock,
  HardDrive,
  Zap,
  ChevronRight,
  Shield,
  Star,
  Flame,
  CreditCard,
  CheckCircle2,
  Edit3,
  Wifi,
  Lock,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { db } from "@/lib/db/dexie-db";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { NetworkGuard } from "@/lib/utils/network-guard";
import { LantawonIcon } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AccountStats {
  totalWatched: number;
  completed: number;
  watchlistCount: number;
  favoritesCount: number;
  estimatedHours: number;
  localVaultCount: number;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatBadge({
  icon,
  label,
  value,
  accent = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "red" | "amber" | "emerald" | "cyan" | "violet" | "default";
}) {
  const colors: Record<string, string> = {
    red: "text-[#E50914]",
    amber: "text-amber-400",
    emerald: "text-emerald-400",
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    default: "text-white",
  };
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`text-2xl font-black font-mono ${colors[accent]}`}>{value}</div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  description,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => audioFX.playClick()}
      className="group flex items-center gap-3 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all hover:bg-zinc-800/60"
    >
      <div className="h-9 w-9 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors border border-zinc-700">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          {label}
          {badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-[#E50914]/15 text-[#E50914] text-[10px] font-bold border border-[#E50914]/20">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5">{description}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
    </Link>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountPage() {
  const { showToast } = useToast();
  const [stats, setStats] = useState<AccountStats>({
    totalWatched: 0,
    completed: 0,
    watchlistCount: 0,
    favoritesCount: 0,
    estimatedHours: 0,
    localVaultCount: 0,
  });
  const [dataSaver, setDataSaver] = useState(false);
  const [netStatus, setNetStatus] = useState({ isCellular: false, effectiveType: "4g" });

  // Change-password form (manual reset flow, step 3: user sets their own)
  const supabase = createClient();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        await db.migrateFromLocalStorage();
        const history = await db.watchHistory.toArray();
        const library = await db.libraryItems.toArray();
        const localVault = await db.localScannedMedia.count();

        const completed = history.filter((h) => (h.percentage ?? 0) >= 90).length;
        const totalMins = history.reduce((acc, h) => {
          const est = h.mediaType === "movie" ? 105 : 45;
          return acc + (est * (h.percentage ?? 0)) / 100;
        }, 0);

        setStats({
          totalWatched: history.length,
          completed,
          watchlistCount: library.filter((i) => i.inWatchlist).length,
          favoritesCount: library.filter((i) => i.isFavorite).length,
          estimatedHours: Math.round(totalMins / 60),
          localVaultCount: localVault,
        });
      } catch {}
    };

    const ns = NetworkGuard.getNetworkStatus();
    setDataSaver(ns.isDataSaver);
    setNetStatus({ isCellular: ns.isCellular, effectiveType: ns.effectiveType });

    loadStats();
  }, []);

  const handleToggleDataSaver = () => {
    const next = !dataSaver;
    setDataSaver(next);
    NetworkGuard.setDataSaver(next);
    audioFX.playPop();
    showToast(
      next ? "⚡ Ultra Data Saver ON" : "Data Saver OFF — Full resolution restored",
      "info"
    );
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showToast("⚠️ Password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("⚠️ Passwords don't match.", "error");
      return;
    }

    setChangingPassword(true);
    try {
      // Requires an active session; guests get a clear error instead.
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        showToast(`❌ ${error.message}`, "error");
        return;
      }
      audioFX.playSuccess();
      showToast("✅ Password updated!", "success");
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: unknown) {
      showToast("❌ Failed to update password. Are you logged in?", "error");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ── Profile Hero ── */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#151515] via-[#151515] to-[#0D0D0D] border border-[#262626] overflow-hidden p-6">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_top_right,#E31937,transparent_70%)]" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-[#262626] shadow-xl">
              <SmartImage
                src="/avatars/ProfilePic.jpg"
                alt="Joshua Wayman"
                fallbackType="avatar"
                containerClassName="w-full h-full"
                className="w-full h-full object-cover object-top"
              />
            </div>
            {/* Pro badge overlay */}
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[#0D0D0D] flex items-center justify-center border border-[#262626] shadow">
              <LantawonIcon className="h-5 w-5" />
            </div>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-black text-[#FFF8E7] font-heading">Joshua Wayman</h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E31937]/15 border border-[#E31937]/30 text-[#E31937] text-[11px] font-bold self-center sm:self-auto">
                <Crown className="h-3 w-3 fill-[#FFD106] text-[#FFD106]" /> LANTAWON NATO VIP
              </span>
            </div>
            <p className="text-sm text-[#A7A7A7] mt-1">joshua@example.com</p>
            <p className="text-xs text-[#A7A7A7]/70 mt-0.5">Member since August 2025 · Guest Mode</p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                disabled
                title="Sign in with Supabase auth to edit your profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold cursor-not-allowed opacity-60"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Profile
              </button>
              <span className="text-[10px] text-zinc-600">
                ↑ Available after signing in
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscription Card ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#E50914]/10 via-zinc-900 to-zinc-900 border border-[#E50914]/20 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#E50914] fill-[#E50914]" />
            <div>
              <div className="text-sm font-black text-white">Lantawon Pro</div>
              <div className="text-[10px] text-zinc-400">All features unlocked</div>
            </div>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Active
          </span>
        </div>

        {/* Plan perks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            "Unlimited streaming from all mirrors",
            "Full Local Media Vault access",
            "Offline catalog browsing",
            "Mobile Data Guard & Stream Analytics",
            "Watch History & Progress sync",
            "Taste Analytics & Achievements",
          ].map((perk) => (
            <div key={perk} className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              {perk}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
          <div className="text-[10px] text-zinc-500">
            <CreditCard className="h-3 w-3 inline mr-1" />
            Billing managed via Supabase — coming in Phase 8
          </div>
          <button
            disabled
            className="text-[11px] text-zinc-600 cursor-not-allowed"
          >
            Manage Plan →
          </button>
        </div>
      </div>

      {/* ── Watch Activity Stats ── */}
      <div>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">
          Watch Activity
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBadge
            icon={<Clock className="h-3.5 w-3.5 text-violet-400" />}
            label="Total Watched"
            value={stats.totalWatched}
            accent="violet"
          />
          <StatBadge
            icon={<Flame className="h-3.5 w-3.5 text-emerald-400" />}
            label="Completed"
            value={stats.completed}
            accent="emerald"
          />
          <StatBadge
            icon={<Star className="h-3.5 w-3.5 text-amber-400" />}
            label="Est. Hours"
            value={`${stats.estimatedHours}h`}
            accent="amber"
          />
          <StatBadge
            icon={<Bookmark className="h-3.5 w-3.5 text-cyan-400" />}
            label="Watchlist"
            value={stats.watchlistCount}
            accent="cyan"
          />
          <StatBadge
            icon={<Heart className="h-3.5 w-3.5 text-red-400" />}
            label="Favorites"
            value={stats.favoritesCount}
            accent="red"
          />
          <StatBadge
            icon={<HardDrive className="h-3.5 w-3.5 text-zinc-400" />}
            label="Local Vault"
            value={stats.localVaultCount}
          />
        </div>
      </div>

      {/* ── Data & Network Settings ── */}
      <div>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">
          Data & Network
        </h2>
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          {/* Network status */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Wifi className={`h-4 w-4 ${netStatus.isCellular ? "text-amber-400" : "text-emerald-400"}`} />
            <div className="flex-1">
              <div className="text-xs font-semibold text-white">Network</div>
              <div className="text-[10px] text-zinc-500">
                {netStatus.isCellular
                  ? `Cellular (${netStatus.effectiveType.toUpperCase()})`
                  : "High-Speed Network"}
              </div>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                netStatus.isCellular
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {netStatus.isCellular ? "CELLULAR" : "WIFI"}
            </span>
          </div>

          {/* Ultra Data Saver */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Zap
              className={`h-4 w-4 ${dataSaver ? "text-amber-400 fill-amber-400" : "text-zinc-400"}`}
            />
            <div className="flex-1">
              <div className="text-xs font-semibold text-white">Ultra Data Saver</div>
              <div className="text-[10px] text-zinc-500">
                {dataSaver
                  ? "Active — conserving ~60% bandwidth on images & streams"
                  : "Off — full resolution enabled"}
              </div>
            </div>
            <button
              onClick={handleToggleDataSaver}
              className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                dataSaver
                  ? "bg-amber-500 text-zinc-950"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {dataSaver ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Quick Navigation ── */}
      <div>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">
          Quick Navigation
        </h2>
        <div className="space-y-2">
          <QuickLink
            href="/statistics"
            icon={<BarChart2 className="h-4 w-4 text-violet-400" />}
            label="Taste Analytics"
            description="Your genre preferences, viewing patterns & top picks"
          />
          <QuickLink
            href="/achievements"
            icon={<Trophy className="h-4 w-4 text-amber-400" />}
            label="Achievements & XP"
            description="Unlock badges and track your cinematic journey"
          />
          <QuickLink
            href="/library"
            icon={<Bookmark className="h-4 w-4 text-cyan-400" />}
            label="My Library"
            description="Watchlist, favorites, playlists and watch history"
          />
          <QuickLink
            href="/library/local"
            icon={<HardDrive className="h-4 w-4 text-zinc-400" />}
            label="Local Media Vault"
            description={`${stats.localVaultCount} local file${stats.localVaultCount !== 1 ? "s" : ""} scanned and indexed`}
            badge={stats.localVaultCount > 0 ? `${stats.localVaultCount}` : undefined}
          />
          <QuickLink
            href="/pricing"
            icon={<Crown className="h-4 w-4 text-[#E50914]" />}
            label="Plans & Pricing"
            description="Compare Lantawon Free vs Pro features"
          />
        </div>
      </div>

      {/* ── Security & Privacy ── */}
      <div>
        <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">
          Security
        </h2>
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
          {/* Change password */}
          <div className="px-4 py-3 space-y-3">
            <button
              onClick={() => {
                audioFX.playClick();
                setShowPasswordForm((v) => !v);
              }}
              className="w-full flex items-center gap-3 text-left cursor-pointer"
            >
              <Lock className="h-4 w-4 text-emerald-400" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-white">Change Password</div>
                <div className="text-[10px] text-zinc-500">
                  Update your login password (min. 8 characters)
                </div>
              </div>
              <ChevronRight
                className={`h-4 w-4 text-zinc-600 transition-transform ${
                  showPasswordForm ? "rotate-90" : ""
                }`}
              />
            </button>

            {showPasswordForm && (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-zinc-800 text-white placeholder:text-zinc-600 text-sm outline-none focus:border-[#E50914] transition-colors"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0D0D0D] border border-zinc-800 text-white placeholder:text-zinc-600 text-sm outline-none focus:border-[#E50914] transition-colors"
                />
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
                >
                  {changingPassword ? "Updating..." : "Update Password"}
                </button>
                <p className="text-[10px] text-zinc-600">
                  Requires an active session — guests must log in first.
                </p>
              </div>
            )}
          </div>

          {/* Privacy note */}
          <div className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">Privacy-First Architecture</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                All your watch history, favorites, and preferences are stored locally on your device using IndexedDB.
                Nothing is transmitted to our servers without your explicit consent.
                Supabase cloud sync is opt-in and activates only when you sign in.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-4" />
    </div>
  );
}
