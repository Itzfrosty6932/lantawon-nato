"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Tv, Sparkles, Bookmark, LogIn, Trophy } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { StreakService } from "@/lib/services/streak-service";
import { StreakModal } from "@/components/gamification/StreakModal";
import { MobileDiscoverDrawer } from "@/components/layout/MobileDiscoverDrawer";
import { useAuth } from "@/context/AuthContext";

export function MobileNav({ onOpenLibrary }: { onOpenLibrary?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user && user.isLoggedIn === true && user.role !== "guest");
  const [streakCount, setStreakCount] = useState<number>(0);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isDiscoverDrawerOpen, setIsDiscoverDrawerOpen] = useState(false);

  const userId = isAuthenticated ? user.id : "anonymous";

  useEffect(() => {
    StreakService.getStreakInfo(userId).then((info) => setStreakCount(info.currentStreak));
  }, [userId, pathname]);

  const isDiscoverActive =
    isDiscoverDrawerOpen ||
    pathname.startsWith("/people") ||
    pathname.startsWith("/studios") ||
    pathname.startsWith("/networks") ||
    pathname.startsWith("/where-to-watch") ||
    pathname.startsWith("/anime") ||
    pathname.startsWith("/cartoons") ||
    pathname.startsWith("/documentaries");

  const NAV_ITEMS = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Explore", href: "/discover", icon: Compass },
    { label: "Shows", href: "/shows", icon: Tv },
    {
      label: "Discover",
      href: "#discover",
      icon: Sparkles,
      isDiscover: true,
    },
    { label: "Ranks", href: "/leaderboard", icon: Trophy },
    ...(isAuthenticated
      ? [{ label: "Library", href: "/library", icon: Bookmark }]
      : [{ label: "Sign In", href: "/login", icon: LogIn }]),
  ];

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    if (href === "#discover") return isDiscoverActive;
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#141414]/95 backdrop-blur-xl border-t border-zinc-800/80 shadow-2xl safe-area-pb">
        <div className="flex items-stretch justify-around">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);

            if (item.isDiscover) {
              return (
                <button
                  key="discover-drawer-button"
                  type="button"
                  onClick={() => {
                    audioFX.playPop();
                    setIsDiscoverDrawerOpen((prev) => !prev);
                  }}
                  className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 transition-colors relative ${
                    active ? "text-[#E31937]" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <div className="relative">
                    <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                  </div>
                  <span
                    className={`text-[10px] font-medium tracking-tight ${
                      active ? "font-bold text-[#E31937]" : "text-zinc-400"
                    }`}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#E31937]" />
                  )}
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  audioFX.playClick();
                  if (item.href === "/library" && onOpenLibrary) {
                    // optionally open side drawer
                  }
                }}
                className={`flex-1 py-2.5 flex flex-col items-center justify-center gap-1 transition-colors relative ${
                  active ? "text-[#E31937]" : "text-zinc-400 hover:text-white"
                }`}
              >
                <div className="relative">
                  <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight ${
                    active ? "font-bold text-[#E31937]" : "text-zinc-400"
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#E31937]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Discover Mega-Menu Sidebar / Drawer */}
      <MobileDiscoverDrawer
        isOpen={isDiscoverDrawerOpen}
        onClose={() => setIsDiscoverDrawerOpen(false)}
      />

      {/* Streak Details / Daily Reward Modal */}
      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
      />
    </>
  );
}
