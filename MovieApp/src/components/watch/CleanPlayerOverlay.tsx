"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Tv,
  Check,
  Server,
  Activity,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1,
  Wifi,
  Clock,
  ChevronDown,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { STREAM_SERVERS, getStreamingServersFor } from "@/lib/constants/streaming-servers";
import { useAuth } from "@/context/AuthContext";
import { GuestTimerService } from "@/lib/services/guest-timer-service";
import { formatDataSizeMb } from "@/lib/utils/formatters";

interface CleanPlayerOverlayProps {
  displayTitle: string;
  subTitle?: string; // e.g. "S1 E1 Welcome to Margrave · 54m"
  isPlaying: boolean;
  activeServer: string;
  mediaType?: string;
  onSelectServer: (serverId: string) => void;
  onAutoSelectBest?: () => void;
  onNextServer?: () => void;
  isEpisodesModalOpen?: boolean;
  onToggleEpisodesModal?: () => void;
  isTvSeries?: boolean;
  currentSeason?: number;
  currentEpisode?: number;
  dataUsedMb?: number;
  // Seeking & Volume HUDs triggered by keyboard
  seekDeltaHUD?: { delta: number; targetTime: number } | null;
  volumeHUD?: number | null;
  onBack?: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CleanPlayerOverlay({
  displayTitle,
  subTitle,
  isPlaying,
  activeServer,
  mediaType,
  onSelectServer,
  onAutoSelectBest,
  onNextServer,
  isEpisodesModalOpen = false,
  onToggleEpisodesModal,
  isTvSeries = false,
  currentSeason = 1,
  currentEpisode = 1,
  dataUsedMb = 0,
  seekDeltaHUD,
  volumeHUD,
  onBack,
}: CleanPlayerOverlayProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isGuest = !user?.isLoggedIn || user?.role === "guest";
  const showTrialTimer = isGuest;

  const [guestRemainingSeconds, setGuestRemainingSeconds] = useState(() => {
    return GuestTimerService.getTimerData().remainingSeconds;
  });

  // Listen to centralized timer tick events
  useEffect(() => {
    if (!showTrialTimer) return;

    const handleTick = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (typeof customEvent.detail === "number") {
        setGuestRemainingSeconds(customEvent.detail);
      }
    };

    const handleReset = () => {
      setGuestRemainingSeconds(GuestTimerService.getTimerData().remainingSeconds);
    };

    window.addEventListener("guest_timer_tick", handleTick);
    window.addEventListener("guest_timer_reset", handleReset);

    // Initial sync
    setGuestRemainingSeconds(GuestTimerService.getTimerData().remainingSeconds);

    return () => {
      window.removeEventListener("guest_timer_tick", handleTick);
      window.removeEventListener("guest_timer_reset", handleReset);
    };
  }, [showTrialTimer]);

  const [isServerMenuOpen, setIsServerMenuOpen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls after 7s of inactivity
  const resetHideTimer = useCallback(() => {
    setAreControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);

    // Keep visible if dropdown or episodes modal is open
    if (isServerMenuOpen || isEpisodesModalOpen) return;

    hideTimeoutRef.current = setTimeout(() => {
      setAreControlsVisible(false);
    }, 7000);
  }, [isServerMenuOpen, isEpisodesModalOpen]);

  const handleBackAction = useCallback(() => {
    audioFX.playClick();
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/home");
    }
  }, [onBack, router]);

  useEffect(() => {
    resetHideTimer();

    // Global listeners for any mouse movement, touch, click, keypress or window activity
    const handleUserActivity = () => {
      resetHideTimer();
    };

    // When the user clicks inside a cross-origin video iframe, window triggers 'blur'
    const handleIframeClick = () => {
      resetHideTimer();
    };

    window.addEventListener("mousemove", handleUserActivity, { passive: true });
    window.addEventListener("pointermove", handleUserActivity, { passive: true });
    window.addEventListener("mousedown", handleUserActivity, { passive: true });
    window.addEventListener("touchstart", handleUserActivity, { passive: true });
    window.addEventListener("keydown", handleUserActivity, { passive: true });
    window.addEventListener("blur", handleIframeClick);
    window.addEventListener("focus", handleUserActivity);

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("pointermove", handleUserActivity);
      window.removeEventListener("mousedown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("blur", handleIframeClick);
      window.removeEventListener("focus", handleUserActivity);
    };
  }, [resetHideTimer]);

  const currentServers = getStreamingServersFor(mediaType);
  const serverDisplayName =
    currentServers.find((s) => s.id === activeServer)?.name.split("(")[0]?.trim() || "Server 1";

  const isHudVisible = areControlsVisible || isServerMenuOpen || isEpisodesModalOpen;

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-between select-none pointer-events-none"
    >
      {/* ─── TOP BAR HUD (Permanently Visible, 15px Top Offset, Ultra-Responsive down to 280px-320px) ─── */}
      <div
        className="w-full bg-gradient-to-b from-black/90 via-black/45 to-transparent px-2.5 sm:px-6 py-2 sm:py-3 pt-[max(env(safe-area-inset-top),15px)] sm:pt-[15px] pl-[max(env(safe-area-inset-left),12px)] pr-[max(env(safe-area-inset-right),12px)] flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto select-none"
      >
        {/* Left: Circular Icon-Only Back Button + Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={handleBackAction}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-black/80 hover:bg-black text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center pointer-events-auto"
            aria-label="Back to Previous Page"
            title="Return to Details"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          <div
            className="min-w-0 hidden md:block flex-1 max-w-[320px] lg:max-w-none"
          >
            <h2 className="text-xs sm:text-base font-bold text-white tracking-tight truncate drop-shadow-md">
              {displayTitle}
            </h2>
            {subTitle && (
              <p className="text-[10px] sm:text-xs text-zinc-300 font-mono drop-shadow truncate">
                {subTitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Episodes Switcher, Server Dropdown, Volume Boost, Data MB Usage, and Guest Timer (Responsive Micro-Pills) */}
        <div
          className="flex items-center gap-1 sm:gap-2 shrink-0 pointer-events-auto flex-nowrap overflow-visible py-1"
        >
          {/* 1. Episodes Button (For TV Series & Anime) */}
          {isTvSeries && onToggleEpisodesModal && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                audioFX.playClick();
                onToggleEpisodesModal();
              }}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border backdrop-blur-md text-[10px] sm:text-xs font-semibold transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 shrink-0 ${
                isEpisodesModalOpen
                  ? "bg-white text-zinc-950 border-white font-bold"
                  : "bg-black/70 hover:bg-white/20 text-white border-white/20"
              }`}
              aria-label="Select Episodes"
            >
              <Tv className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
              <span className="text-[10px] sm:text-[11px] text-zinc-300 font-mono">
                S{currentSeason}:E{currentEpisode}
              </span>
            </button>
          )}

          {/* 2. Server Selector Dropdown */}
          <div className="relative shrink-0 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                audioFX.playClick();
                setIsServerMenuOpen((prev) => !prev);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-white border border-emerald-500/40 hover:border-emerald-400 backdrop-blur-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 shrink-0"
              aria-label="Switch Streaming Server Mirror"
              title="Click to choose a streaming server mirror"
            >
              <Server className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">{serverDisplayName}</span>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <ChevronDown className={`h-3 w-3 text-zinc-400 transition-transform duration-200 ${isServerMenuOpen ? "rotate-180 text-white" : ""}`} />
            </button>

            {/* Dropdown Menu List */}
            {isServerMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-9 sm:top-11 right-0 w-56 sm:w-64 max-w-[calc(100vw-24px)] rounded-2xl bg-[#141517]/95 backdrop-blur-2xl border border-white/15 p-2.5 shadow-2xl z-50 text-white space-y-1.5 animate-in fade-in zoom-in-95 pointer-events-auto"
              >
                <div className="flex items-center justify-between px-2 pt-1 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    <Server className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Streaming Mirrors</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Online
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 pr-1">
                  {currentServers.map((srv) => {
                    const isSelected = activeServer === srv.id;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          audioFX.playClick();
                          onSelectServer(srv.id);
                          setIsServerMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-[#E50914] text-white font-bold shadow-md"
                            : "hover:bg-white/10 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-400"}`} />
                          <span className="truncate font-medium">
                            {srv.name}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>



          {/* 3. Data / MB Consumed Badge */}
          <div
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-[9px] sm:text-xs font-mono text-zinc-300 shadow-md shrink-0 whitespace-nowrap"
            aria-label="Data Usage"
          >
            <Wifi className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400 shrink-0" />
            <span>{dataUsedMb > 0 ? formatDataSizeMb(dataUsedMb) : "Active"}</span>
          </div>

          {/* 4. Guest / Free Trial Watch Time Badge */}
          {showTrialTimer && (
            <Link
              href="/#plans"
              onClick={(e) => {
                e.stopPropagation();
                audioFX.playClick();
              }}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full backdrop-blur-md text-[9px] sm:text-xs font-mono font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                guestRemainingSeconds <= 300
                  ? "bg-[#E50914]/30 border border-[#E50914] text-red-400 animate-pulse"
                  : "bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30"
              }`}
              aria-label="Guest Trial Watch Time Remaining"
            >
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0 text-amber-400" />
              <span>{GuestTimerService.formatTime(guestRemainingSeconds)}</span>
            </Link>
          )}
        </div>
      </div>

        {/* ─── CENTER: MINIMALIST KEYBOARD HUD (SEEKING & VOLUME) ─── */}
        <div className="flex-1 flex items-center justify-center pointer-events-none p-4">
          {seekDeltaHUD && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl text-white animate-in zoom-in-95 duration-150">
              {seekDeltaHUD.delta < 0 ? (
                <RotateCcw className="h-6 w-6 text-[#E50914] animate-pulse" />
              ) : (
                <RotateCw className="h-6 w-6 text-[#E50914] animate-pulse" />
              )}
              <span className="text-xl sm:text-2xl font-black font-mono tracking-tight">
                {seekDeltaHUD.delta > 0 ? `+${seekDeltaHUD.delta}s` : `${seekDeltaHUD.delta}s`}
              </span>
              <span className="text-xs font-mono text-zinc-300 font-bold border-l border-white/20 pl-3">
                {formatTime(seekDeltaHUD.targetTime)}
              </span>
            </div>
          )}

          {!seekDeltaHUD && volumeHUD !== null && volumeHUD !== undefined && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl text-white animate-in zoom-in-95 duration-150">
              {volumeHUD === 0 ? (
                <VolumeX className="h-6 w-6 text-[#E50914]" />
              ) : volumeHUD < 0.5 ? (
                <Volume1 className="h-6 w-6 text-zinc-300" />
              ) : (
                <Volume2 className="h-6 w-6 text-white" />
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-white">
                  {Math.round(volumeHUD * 100)}%
                </span>
                <div className="w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ width: `${Math.round(volumeHUD * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── BOTTOM AREA ─── */}
        <div className="h-12 w-full pointer-events-none" />
      </div>
  );
}
