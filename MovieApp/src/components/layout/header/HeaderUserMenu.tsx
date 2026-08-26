"use client";

import React, { useState, useEffect, RefObject } from "react";
import Link from "next/link";
import {
  BarChart2,
  Trophy,
  Bookmark,
  Keyboard,
  Zap,
  User,
  Shield,
  CreditCard,
  LogIn,
  LogOut,
  Sparkles,
  ChevronRight,
  Crown,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";

interface HeaderUserMenuProps {
  userMenuRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenShortcuts: () => void;
}

export function HeaderUserMenu({
  userMenuRef,
  isOpen,
  onToggle,
  onClose,
  onOpenShortcuts,
}: HeaderUserMenuProps) {
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [dataSaver, setDataSaver] = useState(false);

  const isAuthenticated = Boolean(user && user.isLoggedIn === true && user.role !== "guest");

  useEffect(() => {
    try {
      const isSaved = localStorage.getItem("data_saver_mode") === "true";
      setDataSaver(isSaved);
    } catch {}
  }, []);

  const handleToggleDataSaver = () => {
    const nextState = !dataSaver;
    setDataSaver(nextState);
    try {
      localStorage.setItem("data_saver_mode", String(nextState));
    } catch {}
    audioFX.playPop();
    showToast(
      nextState
        ? "⚡ Ultra Data Saver ON — Posters & Thumbnails compressed"
        : "Ultra Data Saver OFF — Full resolution images enabled",
      "info"
    );
  };

  const handleSignOut = async () => {
    audioFX.playClick();
    await signOut();
    onClose();
    showToast("Signed out successfully", "info");
  };

  // Clean username logic (NEVER display raw email)
  const displayName = isAuthenticated
    ? (profile?.displayName || user?.email?.split("@")[0] || "Lantawon User")
    : "Guest User";

  // Clean plan name logic (NEVER display "demo")
  const planLabel = isAuthenticated
    ? (profile?.tier ? profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1) : "Solo")
    : "Guest";

  const isAdmin = isAuthenticated && (user.role === "admin" || user.role === "super_admin");

  return (
    <div ref={userMenuRef} className="relative select-none">
      {/* User Avatar / Profile Button */}
      <button
        type="button"
        onClick={() => {
          audioFX.playClick();
          onToggle();
        }}
        className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg overflow-hidden border border-zinc-700 hover:border-white transition-all hover:scale-105 cursor-pointer flex items-center justify-center shrink-0 bg-[#181818] hover:bg-[#242526] shadow-md"
        title={displayName}
      >
        {isAuthenticated && profile?.avatarUrl && !profile.avatarUrl.includes("ProfilePic.jpg") ? (
          <SmartImage
            src={profile.avatarUrl}
            alt={displayName}
            fallbackType="avatar"
            containerClassName="w-full h-full rounded-lg"
            className="w-full h-full rounded-lg object-cover object-top"
          />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-64 rounded-xl bg-[#181818] p-2 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 border border-zinc-700/80">
          {/* Profile Quick Overview */}
          <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-zinc-800 rounded-lg">
            <div className="h-9 w-9 rounded-lg overflow-hidden border border-zinc-700 shrink-0 bg-[#E31937] flex items-center justify-center">
              {isAuthenticated && profile?.avatarUrl && !profile.avatarUrl.includes("ProfilePic.jpg") ? (
                <SmartImage
                  src={profile.avatarUrl}
                  alt={displayName}
                  fallbackType="avatar"
                  containerClassName="w-full h-full rounded-lg"
                  className="w-full h-full rounded-lg object-cover object-top"
                />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {displayName}
              </div>
              <div className="text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                <span className="px-1.5 py-0.2 rounded bg-white/10 text-zinc-300 border border-white/10 font-bold">
                  {planLabel}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Subscription CTA — authenticated users land on their own
              subscription management page; guests go to the pricing plans. */}
          <Link
            href={isAuthenticated ? "/account/subscription" : "/#plans"}
            onClick={() => { audioFX.playClick(); onClose(); }}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold bg-[#E31937] hover:bg-[#ff1f3d] text-white transition-colors shadow-sm cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Crown className="h-3.5 w-3.5 fill-current" />
              <span>{isAuthenticated ? "My Subscription" : "Subscribe to Plan"}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>

          {/* 2. Authenticated Features vs Guest Actions */}
          {isAuthenticated && (
            <>
              {/* Account Overview */}
              <Link
                href="/account"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <User className="h-3.5 w-3.5 text-zinc-400" />
                <span>My Account</span>
              </Link>

              {/* Admin Console */}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => { audioFX.playClick(); onClose(); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:text-white hover:bg-amber-500/10 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  <span>Admin Operations</span>
                </Link>
              )}

              {/* Taste Analytics */}
              <Link
                href="/statistics"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <BarChart2 className="h-3.5 w-3.5 text-zinc-400" />
                <span>Taste Analytics</span>
              </Link>

              {/* Achievements */}
              <Link
                href="/achievements"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Trophy className="h-3.5 w-3.5 text-zinc-400" />
                <span>Achievements &amp; XP</span>
              </Link>

              {/* My Library */}
              <Link
                href="/library"
                onClick={() => { audioFX.playClick(); onClose(); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Bookmark className="h-3.5 w-3.5 text-zinc-400" />
                <span>My Library</span>
              </Link>
            </>
          )}

          {/* ⚡ Ultra Data Saver Toggle */}
          <button
            type="button"
            onClick={handleToggleDataSaver}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer border ${
              dataSaver
                ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                : "text-zinc-300 hover:text-white hover:bg-zinc-800 border-transparent"
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className={`h-3.5 w-3.5 ${dataSaver ? "text-amber-400 fill-amber-400" : "text-zinc-400"}`} />
              <span>Data Saver</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                dataSaver ? "bg-amber-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {dataSaver ? "ON" : "OFF"}
            </span>
          </button>

          {/* Landing Page Overview Link */}
          <Link
            href="/"
            onClick={() => { audioFX.playClick(); onClose(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
            <span>Welcome / Landing Page</span>
          </Link>

          {/* Keyboard Shortcuts */}
          <button
            type="button"
            onClick={() => {
              onOpenShortcuts();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-left cursor-pointer"
          >
            <Keyboard className="h-3.5 w-3.5 text-zinc-400" />
            <span>Shortcuts (?)</span>
          </button>

          {/* Sign In / Sign Out Action */}
          <div className="pt-1 border-t border-zinc-800">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-1 pt-0.5">
                <Link
                  href="/login"
                  onClick={() => { audioFX.playClick(); onClose(); }}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-center text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => { audioFX.playClick(); onClose(); }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#E31937] hover:bg-[#ff1f3d] text-xs font-bold text-center text-white transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
