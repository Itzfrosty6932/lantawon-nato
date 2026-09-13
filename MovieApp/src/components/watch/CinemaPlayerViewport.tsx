"use client";

import React, { RefObject, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AlertTriangle, Sparkles, Clock, Lock, RefreshCw, ShieldAlert } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { CleanPlayerOverlay } from "./CleanPlayerOverlay";
import {
  AudioSubtitlesModal,
  SubtitleAppearance,
  DEFAULT_SUBTITLE_APPEARANCE,
  SubtitleTrack,
  AudioTrack,
} from "./AudioSubtitlesModal";
import { InPlayerEpisodesModal } from "./InPlayerEpisodesModal";
import { GuestTimerService } from "@/lib/services/guest-timer-service";
import type { TvDetails, Episode } from "@/types/media";

interface CinemaPlayerViewportProps {
  videoContainerRef: RefObject<HTMLDivElement | null>;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  activeServer: string;
  displayTitle: string;
  mediaId: string;
  mediaType: "movie" | "tv" | "anime";
  currentSeason: number;
  currentEpisode: number;
  trailerKey: string | null;
  hudMessage: string | null;
  subtitlesUrl: string | null;
  isFrameLoading: boolean;
  isProbing: boolean;
  playableCount: number;
  resolvedMirrors: Record<string, { url: string; name: string }>;
  isResolvingMirrors?: boolean;
  entitlementDenial?: "SUBSCRIPTION_REQUIRED" | "PENDING_APPROVAL" | "EXPIRED" | "GUEST_TRIAL_ENDED" | null;
  isTheaterMode?: boolean;
  isFullScreen?: boolean;
  currentTime?: number;
  duration?: number;
  tvDetails?: TvDetails | null;
  seasonEpisodes?: Episode[];
  onSelectSeason?: (seasonNumber: number) => void;
  onSelectEpisode?: (episodeNumber: number) => void;
  onNextEpisode?: () => void;
  onTimeUpdate: () => void;
  onFrameLoad: () => void;
  onSelectServer: (serverId: string) => void;
  onAutoSelectBest?: () => void;
  onProbeServers?: () => void;
  onNextServer?: () => void;
  onToggleFullScreen?: () => void;
  onToggleTheaterMode?: () => void;
  dataUsedMb?: number;
  onSubtitleFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showToast: (message: string, type?: "info" | "success" | "error") => void;
  volumeBoost?: number;
  onCycleVolumeBoost?: () => void;
  onBack?: () => void;
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
  isResolvingMirrors = false,
  entitlementDenial = null,
  isTheaterMode = false,
  isFullScreen = false,
  currentTime: externalCurrentTime,
  duration: externalDuration,
  tvDetails = null,
  seasonEpisodes = [],
  dataUsedMb = 0,
  volumeBoost = 100,
  onCycleVolumeBoost,
  onSelectSeason,
  onSelectEpisode,
  onNextEpisode,
  onTimeUpdate,
  onFrameLoad,
  onSelectServer,
  onAutoSelectBest,
  onProbeServers,
  onNextServer,
  onToggleFullScreen,
  onToggleTheaterMode,
  onSubtitleFile,
  showToast,
  onBack,
}: CinemaPlayerViewportProps) {
  const activeMirrorUrl = resolvedMirrors[activeServer]?.url;

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1609);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Modals & Overlays state
  const [isAudioSubtitlesOpen, setIsAudioSubtitlesOpen] = useState(false);
  const [isEpisodesModalOpen, setIsEpisodesModalOpen] = useState(false);
  const [isAutoNext, setIsAutoNext] = useState(true);
  const [selectedAudioId, setSelectedAudioId] = useState("default");
  const [selectedSubtitle, setSelectedSubtitle] = useState<SubtitleTrack | null>(null);
  const [customSubtitles, setCustomSubtitles] = useState<SubtitleTrack[]>([]);

  // Subtitle Appearance state
  const [appearance, setAppearance] = useState<SubtitleAppearance>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lantawon_subtitle_appearance");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return DEFAULT_SUBTITLE_APPEARANCE;
  });

  // Smart TV & Keyboard Seeking / Volume HUD
  const [seekDeltaHUD, setSeekDeltaHUD] = useState<{ delta: number; targetTime: number } | null>(null);
  const [volumeHUD, setVolumeHUD] = useState<number | null>(null);
  const seekHUDTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeHUDTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync with external or local video currentTime
  useEffect(() => {
    if (externalCurrentTime !== undefined) {
      setCurrentTime(externalCurrentTime);
    }
  }, [externalCurrentTime]);

  useEffect(() => {
    if (externalDuration !== undefined && externalDuration > 0) {
      setDuration(externalDuration);
    }
  }, [externalDuration]);

  // If local subtitlesUrl was passed, add to subtitles list
  useEffect(() => {
    if (subtitlesUrl) {
      const customTrack: SubtitleTrack = {
        id: "local_custom_track",
        label: "Custom Uploaded Subtitle",
        language: "custom",
        url: subtitlesUrl,
      };
      setCustomSubtitles([customTrack]);
      setSelectedSubtitle(customTrack);
    }
  }, [subtitlesUrl]);

  // Play / Pause Toggle
  const handleTogglePlayPause = useCallback(() => {
    audioFX.playClick();
    if (localVideoRef.current) {
      if (localVideoRef.current.paused) {
        localVideoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        localVideoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [localVideoRef]);

  // Sync active playing state with GuestTimerService
  useEffect(() => {
    const isPlaybackActive = Boolean(
      isPlaying &&
      !isFrameLoading &&
      !isResolvingMirrors &&
      activeMirrorUrl &&
      !entitlementDenial
    );
    GuestTimerService.setPlaybackActive(isPlaybackActive);

    return () => {
      GuestTimerService.setPlaybackActive(false);
    };
  }, [isPlaying, isFrameLoading, isResolvingMirrors, activeMirrorUrl, entitlementDenial]);

  // Seeking (with live preview HUD)
  const handleSeek = useCallback((targetSeconds: number) => {
    const safeDuration = duration > 0 ? duration : 1609;
    const clampedTarget = Math.max(0, Math.min(targetSeconds, safeDuration));
    const delta = Math.round(clampedTarget - currentTime);

    setCurrentTime(clampedTarget);
    if (localVideoRef.current) {
      localVideoRef.current.currentTime = clampedTarget;
    }

    setSeekDeltaHUD({ delta: delta === 0 ? 10 : delta, targetTime: clampedTarget });
    if (seekHUDTimerRef.current) clearTimeout(seekHUDTimerRef.current);
    seekHUDTimerRef.current = setTimeout(() => {
      setSeekDeltaHUD(null);
    }, 1800);
  }, [currentTime, duration, localVideoRef]);

  // Volume Change
  const handleVolumeChange = useCallback((newVol: number) => {
    const clamped = Math.max(0, Math.min(1, newVol));
    setVolume(clamped);
    setIsMuted(clamped === 0);
    if (localVideoRef.current) {
      localVideoRef.current.volume = clamped;
      localVideoRef.current.muted = clamped === 0;
    }

    setVolumeHUD(clamped);
    if (volumeHUDTimerRef.current) clearTimeout(volumeHUDTimerRef.current);
    volumeHUDTimerRef.current = setTimeout(() => {
      setVolumeHUD(null);
    }, 1500);
  }, [localVideoRef]);

  const handleToggleMute = useCallback(() => {
    audioFX.playClick();
    setIsMuted((prev) => {
      const next = !prev;
      if (localVideoRef.current) {
        localVideoRef.current.muted = next;
      }
      handleVolumeChange(next ? 0 : volume > 0 ? volume : 0.8);
      return next;
    });
  }, [volume, localVideoRef, handleVolumeChange]);

  // Smart TV & Desktop Arrow Key Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        audioFX.playClick();
        handleSeek(currentTime - 10);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        audioFX.playClick();
        handleSeek(currentTime + 10);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        audioFX.playClick();
        handleVolumeChange(volume + 0.05);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        audioFX.playClick();
        handleVolumeChange(volume - 0.05);
      } else if (e.key === " " || e.key === "k" || e.key === "K") {
        e.preventDefault();
        handleTogglePlayPause();
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        handleToggleMute();
      } else if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        audioFX.playClick();
        setIsAudioSubtitlesOpen((prev) => !prev);
      } else if (e.key === "e" || e.key === "E") {
        if (mediaType === "tv") {
          e.preventDefault();
          audioFX.playClick();
          setIsEpisodesModalOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, volume, mediaType, handleSeek, handleVolumeChange, handleTogglePlayPause, handleToggleMute]);

  // Subtitle File Upload from modal
  const handleUploadSubtitleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const vttUrl = URL.createObjectURL(file);
      const newTrack: SubtitleTrack = {
        id: `uploaded_${Date.now()}`,
        label: file.name.replace(/\.[^/.]+$/, ""),
        language: "custom",
        url: vttUrl,
      };
      setCustomSubtitles((prev) => [newTrack, ...prev]);
      setSelectedSubtitle(newTrack);
      showToast(`Loaded subtitle: ${file.name}`, "success");
      onSubtitleFile?.(e);
    }
  };

  const containerClasses = "w-full h-full relative bg-black overflow-hidden flex items-center justify-center";

  const isTv = mediaType === "tv" || (mediaType === "anime" && seasonEpisodes.length > 0);
  const subTitle = isTv
    ? `S${currentSeason} E${currentEpisode} ${seasonEpisodes.find((ep) => ep.episode_number === currentEpisode)?.name ? `· ${seasonEpisodes.find((ep) => ep.episode_number === currentEpisode)?.name}` : ""} · ${duration > 0 ? `${Math.floor(duration / 60)}m` : "54m"}`
    : `${duration > 0 ? `${Math.floor(duration / 60)}m` : "27m"}`;

  const audioTracksList: AudioTrack[] = [
    { id: "default", label: "Default Audio (5.1 Surround)", isDefault: true },
    { id: "original", label: "Original Studio Track" },
    { id: "eng_stereo", label: "English (Stereo 2.0)" },
  ];

  const hasNextEpisode = Boolean(
    isTv && (seasonEpisodes.some((ep) => ep.episode_number === currentEpisode + 1) || onNextEpisode)
  );

  // Web Audio API Gain Node for local media volume boosting (>100%)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!localVideoRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const gainNode = ctx.createGain();
          const source = ctx.createMediaElementSource(localVideoRef.current);
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          audioCtxRef.current = ctx;
          gainNodeRef.current = gainNode;
        }
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = volumeBoost / 100;
      }
    } catch {
      // Ignored if media element source is already connected or cross-origin
    }
  }, [volumeBoost, localVideoRef]);

  return (
    <div ref={videoContainerRef} className={containerClasses}>
      {/* ─── FLOATING CLEAN PLAYER OVERLAY CONTROLS ─── */}
      <CleanPlayerOverlay
        displayTitle={displayTitle}
        subTitle={subTitle}
        isPlaying={isPlaying}
        activeServer={activeServer}
        mediaType={mediaType}
        onSelectServer={onSelectServer}
        onAutoSelectBest={onAutoSelectBest}
        onNextServer={onNextServer}
        isEpisodesModalOpen={isEpisodesModalOpen}
        onToggleEpisodesModal={() => setIsEpisodesModalOpen((prev) => !prev)}
        isTvSeries={isTv}
        currentSeason={currentSeason}
        currentEpisode={currentEpisode}
        dataUsedMb={dataUsedMb}
        seekDeltaHUD={seekDeltaHUD}
        volumeHUD={volumeHUD}
        volumeBoost={volumeBoost}
        onCycleVolumeBoost={onCycleVolumeBoost}
        onBack={onBack}
      />

      {/* ─── AUDIO & SUBTITLES 2-COLUMN FLOATING MODAL ─── */}
      <AudioSubtitlesModal
        isOpen={isAudioSubtitlesOpen}
        onClose={() => setIsAudioSubtitlesOpen(false)}
        audioTracks={audioTracksList}
        selectedAudioId={selectedAudioId}
        onSelectAudio={(id) => setSelectedAudioId(id)}
        subtitles={customSubtitles}
        selectedSubtitleId={selectedSubtitle ? selectedSubtitle.id : "off"}
        onSelectSubtitle={(sub) => setSelectedSubtitle(sub)}
        onUploadSubtitleFile={handleUploadSubtitleFile}
        appearance={appearance}
        onChangeAppearance={(app) => setAppearance(app)}
        onShowToast={showToast}
      />

      {/* ─── IN-PLAYER EPISODES MODAL (IMAGE 4) ─── */}
      {isTv && (
        <InPlayerEpisodesModal
          isOpen={isEpisodesModalOpen}
          onClose={() => setIsEpisodesModalOpen(false)}
          details={tvDetails}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          seasonEpisodes={seasonEpisodes}
          onSelectSeason={(s) => onSelectSeason?.(s)}
          onSelectEpisode={(ep) => onSelectEpisode?.(ep)}
          isAutoNext={isAutoNext}
          onToggleAutoNext={() => setIsAutoNext((prev) => !prev)}
        />
      )}

      {/* ─── FLOATING ON-SCREEN HUD (SERVER/STATUS) ─── */}
      {hudMessage && (
        <div className="absolute top-20 left-6 z-40 rounded-xl bg-black/90 border border-white/20 px-3.5 py-1.5 font-mono text-xs font-bold text-white shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
          {hudMessage}
        </div>
      )}

      {/* ─── SUBTITLE TEXT RENDERER OVERLAY (WHEN SUBTITLE ACTIVE) ─── */}
      {selectedSubtitle && selectedSubtitle.id !== "off" && (
        <div className="absolute bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-25 pointer-events-none max-w-[85%] text-center select-none">
          <div
            className="inline-block px-3 py-1 rounded-lg transition-all"
            style={{
              fontSize: `${appearance.fontSize}px`,
              color: `rgb(${appearance.color.r}, ${appearance.color.g}, ${appearance.color.b})`,
              backgroundColor: `rgba(0, 0, 0, ${appearance.backgroundBlur / 100})`,
              backdropFilter: `blur(${Math.round(appearance.backgroundBlur / 10)}px)`,
              textShadow: "0 2px 4px rgba(0,0,0,0.9)",
              fontWeight: 600,
            }}
          >
            <span>{`[${selectedSubtitle.label}]`}</span>
          </div>
        </div>
      )}

      {/* ─── 1. LOCAL OFFLINE VIDEO STREAM ─── */}
      {activeServer === "local" ? (
        <video
          ref={localVideoRef}
          playsInline
          onTimeUpdate={() => {
            if (localVideoRef.current) {
              setCurrentTime(localVideoRef.current.currentTime);
              if (localVideoRef.current.duration) {
                setDuration(localVideoRef.current.duration);
              }
            }
            onTimeUpdate();
          }}
          className="h-full w-full object-contain"
        >
          {selectedSubtitle?.url && (
            <track
              kind="subtitles"
              label={selectedSubtitle.label}
              src={selectedSubtitle.url}
              default
            />
          )}
        </video>
      ) : activeServer === "trailer" && trailerKey ? (
        /* ─── 2. OFFICIAL TRAILER ─── */
        <iframe
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&playsinline=1`}
          title={displayTitle}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          className="h-full w-full border-none"
        />
      ) : (
        /* ─── 3. MULTI-SERVER STREAM FRAME ─── */
        <div className="relative h-full w-full bg-black">
          {activeMirrorUrl ? (
            <iframe
              key={`${activeServer}_${mediaId}_${currentSeason}_${currentEpisode}`}
              src={activeMirrorUrl}
              title={displayTitle}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              referrerPolicy="origin"
              onLoad={onFrameLoad}
              className="h-full w-full border-none bg-black"
            />
          ) : isResolvingMirrors ? (
            <div className="h-full w-full bg-black" />
          ) : entitlementDenial ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-4 text-center px-6 bg-gradient-to-b from-zinc-950 via-[#141414] to-black">
              {entitlementDenial === "GUEST_TRIAL_ENDED" ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1 shadow-lg shadow-amber-500/10 animate-in zoom-in-95 duration-200">
                    <Clock className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Guest Free Trial Finished
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
                    Your 12-hour guest preview has ended. Subscribe to the <strong className="text-white font-semibold">Solo Pass (₱99)</strong> or create an account for unlimited ad-free HD streaming across all mirrors.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <Link
                      href="/#plans"
                      onClick={() => audioFX.playClick()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#E50914]/25 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="h-4 w-4 fill-current" />
                      <span>Subscribe Now (₱99 Solo Pass)</span>
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => audioFX.playClick()}
                      className="px-4 py-2.5 rounded-xl border border-zinc-700 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                </>
              ) : entitlementDenial === "PENDING_APPROVAL" ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mb-1 shadow-lg shadow-blue-500/10 animate-in zoom-in-95 duration-200">
                    <ShieldAlert className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Payment Under Verification
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
                    Your GCash payment proof is currently under review by our admin team. Streaming unlocks automatically as soon as your payment is approved.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <Link
                      href="/account"
                      onClick={() => audioFX.playClick()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold transition-transform hover:scale-105"
                    >
                      <span>Check Account Status</span>
                    </Link>
                  </div>
                </>
              ) : entitlementDenial === "EXPIRED" ? (
                <>
                  <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mb-1 shadow-lg shadow-red-500/10 animate-in zoom-in-95 duration-200">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Subscription Pass Expired
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
                    Your streaming pass has expired. Renew your plan to continue watching full HD movies and series with instant mirror switching.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <Link
                      href="/#plans"
                      onClick={() => audioFX.playClick()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#E50914]/25 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="h-4 w-4 fill-current" />
                      <span>Renew Solo Pass (₱99)</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3.5 rounded-2xl bg-[#E50914]/10 border border-[#E50914]/30 text-[#E50914] mb-1 shadow-lg shadow-[#E50914]/10 animate-in zoom-in-95 duration-200">
                    <Lock className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Solo Pass Required to Stream
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 max-w-md leading-relaxed">
                    Streaming on Lantawon requires an active <strong className="text-white font-semibold">Solo Pass (₱99)</strong>. Get 30 days of unlimited access to 15 HD fast streaming servers with multi-audio and subtitle support.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                    <Link
                      href="/#plans"
                      onClick={() => audioFX.playClick()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-xs sm:text-sm font-bold shadow-lg shadow-[#E50914]/25 transition-transform hover:scale-105 active:scale-95"
                    >
                      <Sparkles className="h-4 w-4 fill-current" />
                      <span>Get Solo Pass (₱99)</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-3 text-center px-6">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <p className="text-sm text-zinc-300 max-w-xs">
                Mirror connection timed out or unavailable.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {onNextServer && (
                  <button
                    type="button"
                    onClick={onNextServer}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Switch to Next Server
                  </button>
                )}
                <button
                  type="button"
                  onClick={onProbeServers}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-check Mirrors
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
