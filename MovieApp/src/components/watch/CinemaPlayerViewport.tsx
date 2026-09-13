"use client";

import React, { RefObject } from "react";
import { Loader2, AlertTriangle, Play, RefreshCw } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface CinemaPlayerViewportProps {
  videoContainerRef: RefObject<HTMLDivElement | null>;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  activeServer: string;
  displayTitle: string;
  mediaId: string;
  mediaType: "movie" | "tv";
  currentSeason: number;
  currentEpisode: number;
  trailerKey: string | null;
  hudMessage: string | null;
  subtitlesUrl: string | null;
  isFrameLoading: boolean;
  isProbing: boolean;
  playableCount: number;
  /** AUDIT C6: resolved mirror URLs from /api/stream/resolve — the client
   * no longer builds embed URLs itself (anti-inspection hardening). */
  resolvedMirrors: Record<string, { url: string; name: string }>;
  isTheaterMode?: boolean;
  isFullScreen?: boolean;
  onTimeUpdate: () => void;
  onFrameLoad: () => void;
  onSelectServer: (serverId: string) => void;
  onProbeServers: () => void;
  onToggleFullScreen?: () => void;
  onToggleTheaterMode?: () => void;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
}


export const CinemaPlayerViewport = React.memo(function CinemaPlayerViewport({
  videoContainerRef,
  localVideoRef,
  activeServer,
  displayTitle,
  mediaId,
  mediaType,
  currentSeason,
  currentEpisode,
  trailerKey,
  hudMessage,
  subtitlesUrl,
  isFrameLoading,
  isProbing,
  playableCount,
  resolvedMirrors,
  isTheaterMode = false,
  isFullScreen = false,
  onTimeUpdate,
  onFrameLoad,
  onSelectServer,
  onProbeServers,
  onToggleFullScreen,
  onToggleTheaterMode,
  showToast,
}: CinemaPlayerViewportProps) {
  // Safety timeout: Ensure loading screen dismisses even if iframe doesn't fire onLoad
  React.useEffect(() => {
    if (isFrameLoading) {
      const timeout = setTimeout(() => {
        onFrameLoad();
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [isFrameLoading, activeServer, onFrameLoad]);
  // containerClasses: handles normal and theater mode only.
  // Fullscreen is handled natively by the browser via requestFullscreen()
  // on the playerWrapperRef in page.tsx — no CSS `fixed` trick needed.
  const containerClasses = isTheaterMode
    ? "w-full max-w-none aspect-[21/9] sm:aspect-video h-[85vh] max-h-[85vh] relative bg-black overflow-hidden flex items-center justify-center transition-all duration-300"
    : "w-full max-w-[1560px] aspect-video max-h-[80vh] relative bg-black overflow-hidden flex items-center justify-center transition-all duration-300";

  return (
    <div
      ref={videoContainerRef}
      className={containerClasses}
    >
      {/* Floating On-Screen HUD */}
      {hudMessage && (
        <div className="absolute top-4 left-4 z-30 rounded-xl bg-black/90 border border-zinc-700 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-xl animate-in fade-in zoom-in-95">
          {hudMessage}
        </div>
      )}

      {/* 1. Local Offline Video Stream */}
      {activeServer === "local" ? (
        <video
          ref={localVideoRef}
          controls
          playsInline
          onTimeUpdate={onTimeUpdate}
          className="h-full w-full object-contain"
        >
          {subtitlesUrl && (
            <track
              kind="subtitles"
              label="Custom Subtitles"
              src={subtitlesUrl}
              default
            />
          )}
        </video>
      ) : activeServer === "trailer" && trailerKey ? (
        /* 2. Official Trailer */
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&playsinline=1`}
          title={displayTitle}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          className="h-full w-full border-none"
        />
      ) : (
        /* 3. Multi-Server Stream Frame */
        <div className="relative h-full w-full bg-black">
          {/* Temporary Connection Toast Indicator */}
          {isFrameLoading && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-zinc-700 text-xs text-white pointer-events-none shadow-lg animate-in fade-in duration-200">
              <Loader2 className="h-3.5 w-3.5 text-[#E50914] animate-spin" />
              <span className="font-medium text-[11px]">
                Connecting to {resolvedMirrors[activeServer]?.name || "Mirror"}...
              </span>
            </div>
          )}

          {resolvedMirrors[activeServer]?.url ? (
            <iframe
              key={`${activeServer}_${mediaId}_${currentSeason}_${currentEpisode}`}
              src={resolvedMirrors[activeServer].url}
              title={displayTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onLoad={onFrameLoad}
              className="h-full w-full border-none"
            />
          ) : (
            /* AUDIT C6: no resolved URL = not entitled or still resolving.
               Never fall back to client-built URLs. */
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-center px-6">
              <AlertTriangle className="h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-400 max-w-xs">
                Stream unavailable. Check your connection — an active
                subscription may be required to watch this title.
              </p>
              <button
                type="button"
                onClick={onProbeServers}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
