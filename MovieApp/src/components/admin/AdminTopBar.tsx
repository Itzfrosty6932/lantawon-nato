"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Play,
  Home,
  LogOut,
  Shield,
  User,
  ExternalLink,
  Crown,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { BrandLogo } from "@/components/brand/BrandLogo";

interface AdminTopBarProps {
  /** Title of the active section, shown next to the menu button. */
  title: string;
  /** Opens the mobile nav drawer. */
  onOpenMenu: () => void;
}

export function AdminTopBar({ title, onOpenMenu }: AdminTopBarProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { showToast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const email = profile?.email || user?.email || "";
  const name = profile?.displayName || email.split("@")[0] || "Admin";
  const avatarUrl = profile?.avatarUrl || null;
  const hasCustomAvatar = Boolean(avatarUrl && !avatarUrl.includes("ProfilePic.jpg"));

  const handleSignOut = async () => {
    audioFX.playClick();
    await signOut();
    setMenuOpen(false);
    showToast("Signed out successfully", "info");
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#0d0d0f]/95 backdrop-blur-2xl px-4 sm:px-6 select-none">
      {/* Left: Brand Logo & Section Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            onOpenMenu();
          }}
          aria-label="Open menu"
          className="rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <Link href="/home" onClick={() => audioFX.playClick()}>
            <BrandLogo size="sm" showWordmark={false} />
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-tight">Admin Console</span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-semibold text-zinc-400">{title}</span>
          </div>
          <span className="text-sm font-bold text-white sm:hidden">{title}</span>
        </div>
      </div>

      {/* Right: User Avatar & Dropdown Menu (Consistent with Watch Movies) */}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            setMenuOpen((v) => !v);
          }}
          className="h-9 w-9 rounded-full overflow-hidden border border-white/20 hover:border-white transition-all cursor-pointer flex items-center justify-center shrink-0 hover:scale-105 bg-zinc-800 text-zinc-300 hover:text-white"
          title={name}
        >
          {hasCustomAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl!}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
        </button>

        {/* Dropdown Menu matching Watch Movies */}
        {menuOpen && (
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
                    src={avatarUrl!}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                  <span>{name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-[#E50914] text-[9px] font-mono font-bold">
                    ADMIN
                  </span>
                </div>
                <div className="text-xs text-zinc-400 truncate">{email}</div>
              </div>
            </div>

            <div className="h-px bg-white/10 my-1" />

            {/* Navigation Switch Items */}
            <div className="space-y-0.5">
              <Link
                href="/home"
                onClick={() => {
                  audioFX.playClick();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Play className="h-4 w-4 text-emerald-400" />
                <span>Watch Movies &amp; Series</span>
              </Link>

              <Link
                href="/account"
                onClick={() => {
                  audioFX.playClick();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <User className="h-4 w-4 text-zinc-400" />
                <span>My Account Settings</span>
              </Link>

              <Link
                href="/"
                onClick={() => {
                  audioFX.playClick();
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Home className="h-4 w-4 text-zinc-400" />
                <span>Public Landing Page</span>
              </Link>
            </div>

            <div className="h-px bg-white/10 my-1" />

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
