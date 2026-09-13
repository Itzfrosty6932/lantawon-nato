"use client";

import React, { useState, useEffect, startTransition, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { GuestTimerService } from "@/lib/services/guest-timer-service";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";

export function GuestSessionStickyTimer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile, isLoading } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const isPaidSubscriber = Boolean(user?.isLoggedIn && (user?.tier === "solo" || profile?.tier === "solo"));
  const showTrialTimer = !isAdmin && !isPaidSubscriber;

  const [mounted, setMounted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return GuestTimerService.getTimerData().remainingSeconds;
  });
  const [isWatching, setIsWatching] = useState(false);
  const elapsedSinceLastHeartbeatRef = useRef(0);

  // Mount effect
  useEffect(() => {
    setMounted(true);
    const initial = GuestTimerService.getTimerData().remainingSeconds;
    setRemainingSeconds(initial);
    setIsWatching(GuestTimerService.isPlaybackActive());

    const handleTimerTick = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setRemainingSeconds(customEvent.detail);
      }
    };
    const handleTimerReset = () => {
      setRemainingSeconds(GuestTimerService.getTimerData().remainingSeconds);
    };
    const handlePlaybackChange = (e: Event) => {
      setIsWatching(Boolean((e as CustomEvent<boolean>).detail));
    };
    const handleExpired = () => {
      setRemainingSeconds(0);
      if (pathname.startsWith("/watch")) {
        startTransition(() => {
          router.push("/?expired=1#plans");
        });
      }
    };

    window.addEventListener("guest_timer_tick", handleTimerTick);
    window.addEventListener("guest_timer_reset", handleTimerReset);
    window.addEventListener("guest_timer_expired", handleExpired);
    window.addEventListener("guest_playback_changed", handlePlaybackChange);

    return () => {
      window.removeEventListener("guest_timer_tick", handleTimerTick);
      window.removeEventListener("guest_timer_reset", handleTimerReset);
      window.removeEventListener("guest_timer_expired", handleExpired);
      window.removeEventListener("guest_playback_changed", handlePlaybackChange);
    };
  }, [pathname, router]);

  const isPublicPage =
    pathname === "/" || pathname === "/login" || pathname === "/signup";

  // Server reconciliation: the Supabase guest_devices row is authoritative.
  useEffect(() => {
    if (!mounted || isLoading || !showTrialTimer || isPublicPage) return;

    const ejectIfWatching = () => {
      if (pathname.startsWith("/watch")) router.push("/?expired=1#plans");
    };

    GuestTimerService.syncWithServer()
      .then((state) => {
        if (state?.isExpired) {
          ejectIfWatching();
        } else if (state) {
          setRemainingSeconds((prev) => Math.min(prev, state.remainingSeconds));
        } else if (GuestTimerService.isGuestExpired()) {
          ejectIfWatching();
        }
      })
      .catch(() => {
        if (GuestTimerService.isGuestExpired()) ejectIfWatching();
      });
  }, [mounted, isLoading, showTrialTimer, isPublicPage, pathname, router]);

  // If not mounted yet (SSR), auth still loading, user is paid subscriber/admin, or on public landing/auth pages, don't render
  if (!mounted || isLoading || !showTrialTimer || isPublicPage) {
    return null;
  }

  const timeFormatted = GuestTimerService.formatTime(remainingSeconds);
  const isUrgent = isWatching && remainingSeconds <= 300; // Last 5 minutes

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
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            {isWatching ? "Watch time left:" : "Watch time:"}
          </span>
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
