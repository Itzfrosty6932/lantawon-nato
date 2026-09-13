"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Film,
  Star,
  Heart,
  Hourglass,
  Sliders,
  Info,
  Flame,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

export function Sidebar() {
  const pathname = usePathname();

  const mainNav = [
    { code: "01", label: "01 // HOME PROTOCOL", href: "/home", icon: Home, isHome: true },
    { code: "02", label: "02 // DISCOVER MATRIX", href: "/discover", icon: Compass },
    { code: "03", label: "03 // CINEMA REPERTORY", href: "/movies", icon: Film },
    { code: "04", label: "04 // TOP RATED (8.0+)", href: "/top-rated", icon: Star },
    { code: "05", label: "05 // VAULT & FAVORITES", href: "/library", icon: Heart },
    { code: "06", label: "06 // TASTE ANALYTICS", href: "/statistics", icon: Sliders },
  ];

  const bottomNav = [
    { code: "SYS", label: "SYSTEM // SHORTCUTS", href: "/statistics", icon: Info },
  ];

  return (
    <nav className="w-14 fixed left-5 top-1/2 -translate-y-1/2 valorant-dock rounded-2xl flex flex-col items-center justify-between py-4 z-50 hidden lg:flex select-none border border-white/10 max-h-[85vh] overflow-y-auto scrollbar-none relative shadow-2xl">
      {/* Valorant Tactical Corner Accent Marks */}
      <div className="w-1.5 h-1.5 bg-[#FF4655] absolute top-2 left-2 rounded-none pointer-events-none" />
      <div className="w-1.5 h-1.5 bg-[#FF4655] absolute bottom-2 right-2 rounded-none pointer-events-none" />

      {/* Upper Navigation Rail */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.isHome
            ? pathname === "/home" || pathname === "/"
            : pathname.startsWith(item.href.split("?")[0]) &&
              (!item.href.includes("?") || pathname.includes("sports"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => audioFX.playClick()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all group relative ${
                isActive
                  ? "text-[#FF4655] border border-[#FF4655] bg-[#FF4655]/15 shadow-[0_0_15px_rgba(255,70,85,0.25)] scale-105"
                  : "text-zinc-400 hover:scale-105 hover:text-white hover:bg-white/10 border border-transparent"
              }`}
              title={item.label}
            >
              {/* Valorant Left Tactical Indicator Tab */}
              {isActive && (
                <span className="absolute -left-[9px] top-2 bottom-2 w-1 bg-[#FF4655] rounded-r-sm shadow-[0_0_8px_#FF4655]" />
              )}

              <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />

              {/* Valorant Tactical Tooltip */}
              <div className="absolute left-full ml-3 hidden rounded-lg bg-[#0F1923] border border-[#FF4655]/50 px-3 py-1.5 text-[11px] font-mono font-bold text-white shadow-2xl group-hover:block whitespace-nowrap z-50 pointer-events-none uppercase tracking-wider backdrop-blur-md">
                <span className="text-[#FF4655] mr-1.5">▸</span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tactical Line Divider */}
      <div className="w-6 h-[1px] bg-white/15 my-2.5 relative">
        <span className="w-1 h-1 bg-[#FF4655] absolute left-1/2 -top-0.5 -translate-x-1/2" />
      </div>

      {/* Lower User & Insights Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {bottomNav.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => audioFX.playClick()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all group relative ${
                isActive
                  ? "text-[#FF4655] border border-[#FF4655] bg-[#FF4655]/15 scale-105 shadow-[0_0_15px_rgba(255,70,85,0.25)]"
                  : "text-zinc-400 hover:scale-105 hover:text-white hover:bg-white/10 border border-transparent"
              }`}
              title={item.label}
            >
              {isActive && (
                <span className="absolute -left-[9px] top-2 bottom-2 w-1 bg-[#FF4655] rounded-r-sm shadow-[0_0_8px_#FF4655]" />
              )}

              <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "stroke-[2.5]" : "stroke-2"}`} />

              <div className="absolute left-full ml-3 hidden rounded-lg bg-[#0F1923] border border-[#FF4655]/50 px-3 py-1.5 text-[11px] font-mono font-bold text-white shadow-2xl group-hover:block whitespace-nowrap z-50 pointer-events-none uppercase tracking-wider backdrop-blur-md">
                <span className="text-[#FF4655] mr-1.5">▸</span>
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
