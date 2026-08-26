"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, ChevronDown, Play, Home, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AdminTopBarProps {
  /** Title of the active section, shown next to the menu button. */
  title: string;
  /** Opens the mobile nav drawer. */
  onOpenMenu: () => void;
}

export function AdminTopBar({ title, onOpenMenu }: AdminTopBarProps) {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const email = profile.email || user.email || "";
  const name = profile.displayName || email.split("@")[0] || "Admin";
  const initial = name.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="hidden text-sm font-semibold text-white sm:inline">
            Lantawon Admin
          </span>
          <span className="hidden text-zinc-600 sm:inline">/</span>
          <span className="text-sm font-medium text-zinc-300">{title}</span>
        </div>
      </div>

      {/* Profile dropdown: switch between Admin / Watch / Landing */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 text-sm text-zinc-300 hover:bg-zinc-900"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E50914] text-xs font-bold text-white">
            {initial}
          </span>
          <span className="hidden max-w-[120px] truncate sm:inline">{name}</span>
          <ChevronDown className="h-4 w-4 text-zinc-500" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-xl">
            <div className="border-b border-zinc-800 px-3 py-2.5">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="truncate text-xs text-zinc-500">{email}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded bg-[#E50914]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#E50914]">
                <Shield className="h-2.5 w-2.5" />
                {user.role}
              </span>
            </div>
            <div className="p-1">
              <p className="px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-zinc-600">
                Switch to
              </p>
              <button
                onClick={() => router.push("/home")}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                <Play className="h-4 w-4 text-zinc-500" />
                Watch Movies
              </button>
              <button
                onClick={() => router.push("/")}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                <Home className="h-4 w-4 text-zinc-500" />
                Landing Page
              </button>
            </div>
            <div className="border-t border-zinc-800 p-1">
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-rose-400 hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
