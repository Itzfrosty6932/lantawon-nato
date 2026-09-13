"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Film, Tv, Clapperboard, Compass, Sparkles } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { MobileDiscoverDrawer } from "@/components/layout/MobileDiscoverDrawer";
import { useScrollDirection } from "@/hooks/useScrollDirection";

export function MobileNav({ onOpenLibrary }: { onOpenLibrary?: () => void }) {
  const pathname = usePathname();
  const [isDiscoverOpen, setIsDiscoverOpen] = useState(false);

  // Scroll Direction Awareness (Hide on Scroll Down, Show on Scroll Up)
  const isScrolledVisible = useScrollDirection({ threshold: 10, topThreshold: 40 });

  const isNavVisible = (isScrolledVisible || isDiscoverOpen) && !pathname.startsWith("/watch");

  const isDiscoveryRouteActive =
    pathname.startsWith("/people") ||
    pathname.startsWith("/studios") ||
    pathname.startsWith("/networks") ||
    pathname.startsWith("/where-to-watch") ||
    pathname.startsWith("/cartoons") ||
    pathname.startsWith("/documentaries") ||
    pathname.startsWith("/asian-cinema");

  const NAV_ITEMS = [
    { label: "Home", href: "/home", icon: Home },
    { label: "Movies", href: "/movies", icon: Film },
    { label: "TV Shows", href: "/shows", icon: Tv },
    { label: "Anime", href: "/anime", icon: Clapperboard },
    { label: "Explore", href: "/discover", icon: Compass },
  ];

  const isItemActive = (href: string) => {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname.startsWith(href);
  };

  const handleCloseDiscover = React.useCallback(() => {
    setIsDiscoverOpen(false);
  }, []);

  return (
    <>
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#121316]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl safe-area-pb select-none transition-transform duration-300 ease-in-out ${
          isNavVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-stretch justify-around px-1 py-1">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => audioFX.playClick()}
                className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 transition-colors relative cursor-pointer ${
                  active ? "text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                <div className="relative">
                  <item.icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight whitespace-nowrap ${
                    active ? "font-bold text-white" : "text-zinc-400"
                  }`}
                >
                  {item.label}
                </span>
                {active && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#E50914]" />
                )}
              </Link>
            );
          })}

          {/* 6. Discovery Action Trigger in Bottom Nav */}
          <button
            type="button"
            onClick={() => {
              audioFX.playPop();
              setIsDiscoverOpen(true);
            }}
            className={`flex-1 py-2 flex flex-col items-center justify-center gap-1 transition-colors relative cursor-pointer ${
              isDiscoverOpen || isDiscoveryRouteActive
                ? "text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <div className="relative">
              <Sparkles
                className={`h-5 w-5 ${
                  isDiscoverOpen || isDiscoveryRouteActive
                    ? "stroke-[2.5] text-amber-400"
                    : "stroke-[1.75]"
                }`}
              />
            </div>
            <span
              className={`text-[10px] font-medium tracking-tight whitespace-nowrap ${
                isDiscoverOpen || isDiscoveryRouteActive
                  ? "font-bold text-white"
                  : "text-zinc-400"
              }`}
            >
              Discovery
            </span>
            {(isDiscoverOpen || isDiscoveryRouteActive) && (
              <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </nav>

      {/* Full-Screen Mobile & Tablet Discovery Overlay Modal */}
      <MobileDiscoverDrawer
        isOpen={isDiscoverOpen}
        onClose={handleCloseDiscover}
      />
    </>
  );
}
