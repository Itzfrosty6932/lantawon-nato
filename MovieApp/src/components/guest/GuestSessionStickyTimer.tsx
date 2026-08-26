"use client";

import React, { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { GuestTimerService } from "@/lib/services/guest-timer-service";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";

export function GuestSessionStickyTimer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const isAuthenticated = Boolean(user && user.isLoggedIn === true && user.role !== "guest");

  const [mounted, setMounted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return GuestTimerService.getTimerData().remainingSeconds;
  });

  const isExpired = remainingSeconds <= 0;

  // Mount effect
  useEffect(() => {
    setMounted(true);
    setRemainingSeconds(GuestTimerService.getTimerData().remainingSeconds);

    const handleTimerReset = () => {
      setRemainingSeconds(GuestTimerService.getTimerData().remainingSeconds);
    };
    window.addEventListener("guest_timer_reset", handleTimerReset);
    return () => window.removeEventListener("guest_timer_reset", handleTimerReset);
  }, []);

  // Ticking countdown effect
  useEffect(() => {
    if (!mounted) return;
    // Only run if not authenticated and not on public landing/auth pages
    const isPublicPage =
      pathname === "/" || pathname === "/login" || pathname === "/signup";
    if (isAuthenticated || isPublicPage) return;

    // Server reconciliation: the Supabase guest_devices row is authoritative.
    // If the server says this device is fresh (e.g. database rows cleared), it restores the trial.
    GuestTimerService.syncWithServer().then((state) => {
      if (state?.isExpired) {
        router.push("/?expired=1#plans");
      } else if (state && !state.isExpired) {
        setRemainingSeconds(state.remainingSeconds);
      } else if (!state && GuestTimerService.isGuestExpired()) {
        // Only if offline and local timer is expired
        router.push("/?expired=1#plans");
      }
    }).catch(() => {
      if (GuestTimerService.isGuestExpired()) {
        router.push("/?expired=1#plans");
      }
    });

    const interval = setInterval(() => {
      // Side effects (clearInterval, navigation) must stay OUTSIDE the
      // state updater — React may run updaters during render, and a
      // router.push in there crashes with "Cannot update a component
      // (`Router`) while rendering a different component".
      const next = GuestTimerService.getTimerData().remainingSeconds - 1;
      if (next <= 0) {
        clearInterval(interval);
        setRemainingSeconds(0);
        GuestTimerService.markExpired();
        audioFX.playPop();
        startTransition(() => {
          router.push("/?expired=1#plans");
        });
        return;
      }
      GuestTimerService.updateRemainingSeconds(next);
      setRemainingSeconds(next);
    }, 1000);

    // Server heartbeat every 30s: reports elapsed, applies server clamps
    const heartbeatInterval = setInterval(() => {
      if (GuestTimerService.isGuestExpired()) {
        clearInterval(heartbeatInterval);
        return;
      }
      GuestTimerService.heartbeat(30);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(heartbeatInterval);
    };
  }, [mounted, isAuthenticated, pathname, router]);

  // If not mounted yet (SSR), or user is authenticated, or on public landing/auth pages, don't render
  if (!mounted || isAuthenticated || pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const timeFormatted = GuestTimerService.formatTime(remainingSeconds);
  const isUrgent = remainingSeconds <= 300; // Last 5 minutes

  return (
    <aside
      aria-label="Guest Trial Timer"
      className="fixed bottom-16 lg:bottom-6 right-4 sm:right-6 z-40 animate-in slide-in-from-bottom-5 duration-300 select-none"
    >
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2 rounded-full backdrop-blur-xl border shadow-2xl transition-all ${
          isUrgent
            ? "bg-black/95 border-[#E31937] shadow-[0_0_25px_rgba(227,25,55,0.4)] animate-pulse"
            : "bg-[#181818]/95 border-zinc-700/80 shadow-black/80 hover:border-zinc-500"
        }`}
      >
        {/* Animated Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
          <Clock className={`h-3.5 w-3.5 ${isUrgent ? "text-[#E31937] animate-spin" : "text-amber-400"}`} />
          <span className="text-[11px] text-zinc-400 hidden sm:inline">Guest Trial:</span>
          <span className={`font-mono text-xs ${isUrgent ? "text-[#E31937]" : "text-white"}`}>
            {timeFormatted}
          </span>
        </div>

        <div className="h-3 w-px bg-zinc-700 mx-0.5" />

        {/* Subscribe CTA Button */}
        <Link
          href="/#plans"
          onClick={() => audioFX.playClick()}
          className="px-2.5 py-1 rounded-full bg-[#E31937] hover:bg-[#ff1f3d] text-white text-[11px] font-bold flex items-center gap-1 transition-transform hover:scale-105 shadow-sm"
        >
          <Sparkles className="h-3 w-3 fill-current" />
          <span>Subscribe</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}
