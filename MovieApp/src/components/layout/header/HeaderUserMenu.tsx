"use client";

import React, { useState, useEffect, RefObject } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  History,
  Bookmark,
  LogOut,
  LogIn,
  User,
  Shield,
  Wifi,
  Globe,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";

interface HeaderUserMenuProps {
  userMenuRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

export function HeaderUserMenu({
  userMenuRef,
  isOpen,
  onToggle,
  onClose,
}: HeaderUserMenuProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [dataSaver, setDataSaver] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lantawon_data_saver") === "true";
      setDataSaver(saved);
    }
  }, []);

  const handleToggleDataSaver = () => {
    const next = !dataSaver;
    setDataSaver(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("lantawon_data_saver", String(next));
    }
    showToast(
      next ? "Data Saver enabled: lower resolution mirrors prioritized" : "Data Saver disabled",
      "info"
    );
  };

  const isAuthenticated = user?.isLoggedIn && user?.role !== "guest";

  const displayName = isAuthenticated
    ? profile?.displayName || user?.email?.split("@")[0] || "Member"
    : "Guest Explorer";

  const userEmail = isAuthenticated
    ? user?.email || "user@lantawon.tv"
    : "guest@lantawon.tv";

  const isAdmin = isAuthenticated && (user.role === "admin" || user.role === "super_admin");

  const handleSignOut = async () => {
    audioFX.playClick();
    await signOut();
    onClose();
    showToast("Signed out successfully", "info");
    router.push("/");
  };

  const hasCustomAvatar = Boolean(
    isAuthenticated && profile?.avatarUrl && !profile.avatarUrl.includes("ProfilePic.jpg")
  );

  return (
    <div ref={userMenuRef} className="relative select-none">
      {/* ─── Profile Avatar Button ─── */}
      <button
        type="button"
        onClick={() => {
          audioFX.playClick();
          onToggle();
        }}
        className="h-8 w-8 rounded-full overflow-hidden border border-white/20 hover:border-white transition-all cursor-pointer flex items-center justify-center shrink-0 hover:scale-105 bg-zinc-800 text-zinc-300 hover:text-white"
        title={displayName}
      >
        {hasCustomAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile!.avatarUrl!}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-4 w-4 text-white" />
        )}
      </button>

      {/* ─── Profile Dropdown Menu ─── */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 mt-3 w-72 rounded-2xl bg-[#141518]/98 backdrop-blur-2xl p-3 shadow-2xl z-50 text-white space-y-1 animate-in fade-in zoom-in-95 border border-white/10"
        >
          {/* User Profile Header */}
          <div className="flex items-center gap-3 p-2">
            <div className="h-11 w-11 rounded-full overflow-hidden border border-white/20 shrink-0 bg-zinc-800 flex items-center justify-center">
              {hasCustomAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile!.avatarUrl!}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate">{displayName}</div>
              <div className="text-xs text-zinc-400 truncate">{userEmail}</div>
            </div>
          </div>

          <div className="h-px bg-white/10 my-1" />

          {/* Core Menu Items */}
          <div className="space-y-0.5">
            {/* My Account */}
            <Link
              href="/account"
              onClick={() => {
                audioFX.playClick();
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <User className="h-4 w-4 text-zinc-400" />
              <span>My Account</span>
            </Link>

            {/* Authenticated Members Only: History & Watchlist */}
            {isAuthenticated && (
              <>
                {/* History */}
                <Link
                  href="/library"
                  onClick={() => {
                    audioFX.playClick();
                    onClose();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <History className="h-4 w-4 text-zinc-400" />
                  <span>History</span>
                </Link>

                {/* Watchlist */}
                <Link
                  href="/library"
                  onClick={() => {
                    audioFX.playClick();
                    onClose();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Bookmark className="h-4 w-4 text-zinc-400" />
                  <span>Watchlist</span>
                </Link>
              </>
            )}

            {/* Landing Page */}
            <Link
              href="/"
              onClick={() => {
                audioFX.playClick();
                onClose();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Globe className="h-4 w-4 text-zinc-400" />
              <span>Landing Page</span>
            </Link>
          </div>

          <div className="h-px bg-white/10 my-1" />

          {/* Data Saver Toggle */}
          <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-zinc-300">
            <div className="flex items-center gap-3">
              <Wifi className="h-4 w-4 text-zinc-400" />
              <span>Data Saver</span>
            </div>
            <button
              type="button"
              onClick={handleToggleDataSaver}
              className="cursor-pointer"
              title="Toggle Data Saver mode"
            >
              <div
                className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${
                  dataSaver ? "bg-[#E50914] justify-end" : "bg-zinc-700 justify-start"
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </button>
          </div>

          {/* Admin Console if admin */}
          {isAdmin && (
            <>
              <div className="h-px bg-white/10 my-1" />
              <Link
                href="/admin"
                onClick={() => {
                  audioFX.playClick();
                  onClose();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-amber-300 hover:text-white hover:bg-amber-500/10 transition-colors"
              >
                <Shield className="h-4 w-4 text-amber-400" />
                <span>Admin Panel</span>
              </Link>
            </>
          )}

          <div className="h-px bg-white/10 my-1" />

          {/* Logout / Login */}
          <div>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
              >
                <LogOut className="h-4 w-4 text-zinc-400" />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => {
                  audioFX.playClick();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <LogIn className="h-4 w-4 text-zinc-400" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
