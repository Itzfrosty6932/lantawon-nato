"use client";

import React, { useState, useEffect, useRef, use, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CineStreamEngine } from "@/features/streaming/engine/cinestream-engine";
import { LocalScannerService } from "@/features/library/local-scanner";
import { db, LantawonDatabase } from "@/lib/db/dexie-db";
import { GUEST_USER_ID } from "@/types/storage";
import { STREAM_SERVERS } from "@/lib/constants/streaming-servers";
import { formatYear } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { LibraryDrawer } from "@/components/library/LibraryDrawer";
import { PersonModal } from "@/components/movie/PersonModal";
import { GuestSessionStickyTimer } from "@/components/guest/GuestSessionStickyTimer";
import { lookupGuestDevice } from "@/lib/services/guest-device-service";
import { useAuth } from "@/context/AuthContext";
import { supabase as supabaseBrowserClient } from "@/lib/supabase/client";
import { SaveToPlaylistModal } from "@/components/playlist/SaveToPlaylistModal";
import { CinemaPlayerViewport } from "@/components/watch/CinemaPlayerViewport";
import { CinemaControlBar } from "@/components/watch/CinemaControlBar";
import { ServerPickerDrawer } from "@/components/watch/ServerPickerDrawer";
import { EpisodeSelectorDrawer } from "@/components/watch/EpisodeSelectorDrawer";
import { WatchSettingsModal } from "@/components/watch/WatchSettingsModal";
import { MediaMetadataHero } from "@/components/watch/MediaMetadataHero";
import { CastAndRecommendations } from "@/components/watch/CastAndRecommendations";
import { NetworkGuard } from "@/lib/utils/network-guard";
import type {
  MovieDetails,
  TvDetails,
  Episode,
  Season,
  MediaItem,
} from "@/types/media";
import type { PlayerMetrics } from "@/types/stream";
import type { LocalScannedMediaRecord } from "@/types/storage";

function WatchPageContent({ mediaId }: { mediaId: string }) {
  const searchParams = useSearchParams();
  const mediaType = (searchParams.get("type") || "movie") as "movie" | "tv";
  const localId = searchParams.get("localId");
  const { showToast } = useToast();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const isAuthenticatedRef = useRef(authUser.isLoggedIn);
  isAuthenticatedRef.current = authUser.isLoggedIn;

  // STREAK FIX: local vault rows (watch history / library) are scoped to the
  // signed-in user's id so logged-in watches count toward THEIR streak —
  // not the shared guest bucket that previously inflated fresh accounts.
  const vaultUserId =
    authUser.isLoggedIn && authUser.role !== "guest" ? authUser.id : GUEST_USER_ID;
  const vaultUserIdRef = useRef(vaultUserId);
  vaultUserIdRef.current = vaultUserId;

  const isOfflineMode = Boolean(
    localId ||
    mediaId.startsWith("local_") ||
    (typeof window !== "undefined" && window.location.search.includes("localId"))
  );

  // Core Playback State
  const [details, setDetails] = useState<MovieDetails | TvDetails | null>(null);
  const [activeServer, setActiveServer] = useState<string>(() => {
    if (isOfflineMode) return "local";
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("preferred_stream_server");
        if (saved && STREAM_SERVERS.some((s) => s.id === saved)) {
          return saved;
        }
      } catch {}
    }
    return "server1";
  });
  const activeServerRef = useRef(activeServer);
  activeServerRef.current = activeServer;
  const userSelectedServerRef = useRef(false);

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  // playerWrapperRef wraps BOTH the viewport AND the control bar.
  // This is the element we hand to requestFullscreen() so controls
  // remain visible inside the native fullscreen surface.
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  // Player Surface State
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [isProbing, setIsProbing] = useState(false);
  const [playableCount, setPlayableCount] = useState(0);
  const [serverHealth, setServerHealth] = useState<
    Record<string, { status: "online" | "degraded" | "offline" | "probing"; latencyMs?: number; isPlayable?: boolean }>
  >({});
  const [bestServerId, setBestServerId] = useState<string>("server1");
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isServerDrawerOpen, setIsServerDrawerOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<PlayerMetrics | null>(null);
  const [subtitlesUrl, setSubtitlesUrl] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<CineStreamEngine | null>(null);
  // AUDIT M8: one-shot guard so the cellular data alert fires once per
  // media session, and resets whenever the title/episode changes.
  const dataAlertFiredRef = useRef(false);
  // AUDIT C5: wall-clock progress accumulator for third-party iframe
  // playback — embeds expose no timeupdate events, so we count time.
  const iframeProgressRef = useRef<{ seconds: number; lastWrite: number }>({
    seconds: 0,
    lastWrite: 0,
  });

  // Network Guard: Data Saver + live usage estimate
  const [dataSaver, setDataSaver] = useState(false);
  const [dataUsedMb, setDataUsedMb] = useState(0);

  useEffect(() => {
    setDataSaver(NetworkGuard.getNetworkStatus().isDataSaver);
    const onSaverChange = () => setDataSaver(NetworkGuard.getNetworkStatus().isDataSaver);
    window.addEventListener("data_saver_changed", onSaverChange);
    return () => window.removeEventListener("data_saver_changed", onSaverChange);
  }, []);

  const displayTitle = details?.title || details?.name || "Loading Title...";
  const year = formatYear(details?.release_date || details?.first_air_date);

  const handleSelectServer = useCallback((serverId: string) => {
    audioFX.playClick();
    userSelectedServerRef.current = true;
    setActiveServer(serverId);
    setIsFrameLoading(true);
    try {
      localStorage.setItem("preferred_stream_server", serverId);
    } catch {}
  }, []);

  // Load favorite / watchlist flags for this title from the local vault
  useEffect(() => {
    const loadFlags = async () => {
      try {
        const rec = await db.libraryItems.get(LantawonDatabase.libraryKey(vaultUserIdRef.current, String(mediaId)));
        setIsFavorited(Boolean(rec?.isFavorite));
        setIsSaved(Boolean(rec?.inWatchlist));
      } catch {}
    };
    loadFlags();
  }, [mediaId]);

  // ─── AUDIT C5: Wall-clock progress tracking for iframe mirrors ─────────────
  // Accumulates +5s every 5s while a mirror iframe is active and persists
  // resume position to the local vault at most every 15 seconds.
  useEffect(() => {
    if (isOfflineMode || activeServer === "local" || activeServer === "trailer") return;
    const interval = setInterval(() => {
      iframeProgressRef.current.seconds += 5;
      setDataUsedMb(
        NetworkGuard.calculateDataUsedMb(iframeProgressRef.current.seconds, "720p", dataSaver)
      );

      const now = Date.now();
      if (now - iframeProgressRef.current.lastWrite < 15_000) return;
      iframeProgressRef.current.lastWrite = now;

      (async () => {
        try {
          const key = LantawonDatabase.historyKey(vaultUserIdRef.current, mediaId, currentSeason, currentEpisode);
          const existing = await db.watchHistory.get(key);
          const duration =
            existing?.duration && existing.duration > 0 ? existing.duration : 2700; // ~45min fallback
          const currentTime = Math.min(iframeProgressRef.current.seconds, duration);
          await db.watchHistory.put({
            id: key,
            userId: vaultUserIdRef.current,
            mediaId,
            mediaType,
            title: displayTitle,
            posterPath: details?.poster_path || "",
            season: currentSeason,
            episode: currentEpisode,
            currentTime,
            duration,
            percentage: Math.min(99, Math.floor((currentTime / duration) * 100)),
            lastWatchedAt: new Date().toISOString(),
            completed: existing?.completed ?? false,
          });
        } catch {}
      })();
    }, 5000);
    return () => clearInterval(interval);
  }, [
    activeServer,
    isOfflineMode,
    mediaId,
    mediaType,
    currentSeason,
    currentEpisode,
    displayTitle,
    details,
    dataSaver,
  ]);

  // One-shot cellular/data-limit alert (resets per session via probeServers)
  useEffect(() => {
    if (dataAlertFiredRef.current || dataUsedMb <= 0) return;
    const limitMb = NetworkGuard.getDataLimitMb();
    if (dataUsedMb >= limitMb) {
      dataAlertFiredRef.current = true;
      showToast(`Data guard: ~${dataUsedMb} MB used (your limit: ${limitMb} MB).`, "info");
    }
  }, [dataUsedMb, showToast]);

  // ─── XP accrual: 1 XP per 5-minute block of actual playback ───────────────
  // Authenticated members only — guests never rank on the leaderboard, so
  // they never accrue. Fire-and-forget: the process_xp_event trigger keeps
  // profile totals authoritative; failures here must never disturb playback.
  useEffect(() => {
    if (!authUser.isLoggedIn || authUser.role === "guest" || isOfflineMode) return;
    let secondsWatched = 0;
    const interval = setInterval(() => {
      secondsWatched += 5;
      if (secondsWatched < 300) return; // 5-min block
      secondsWatched -= 300;

      supabaseBrowserClient
        .from("xp_events")
        .insert({
          user_id: authUser.id,
          event_type: "watch_time",
          xp_amount: 1,
          description: "Watched 5 minutes",
        })
        .then(({ error }) => {
          if (error) console.warn("[xp] insert failed:", error.message);
        });
    }, 5000);
    return () => clearInterval(interval);
  }, [authUser.isLoggedIn, authUser.role, authUser.id, isOfflineMode]);

  const showHud = (msg: string) => {
    setHudMessage(msg);
    setTimeout(() => setHudMessage(null), 1500);
  };

  const scrollToPlayer = () => {
    if (videoContainerRef.current) {
      videoContainerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ─── 1. Probe Streaming Servers ─────────────────────────────────────────────
  const probeServers = useCallback(async () => {
    if (isOfflineMode || mediaId.startsWith("local_")) return;
    setIsProbing(true);
    // AUDIT M8: reset the one-shot data warning when the media or
    // episode changes — otherwise a fired alert suppresses all future ones.
    dataAlertFiredRef.current = false;
    // Reset iframe wall-clock progress for the new session.
    iframeProgressRef.current = { seconds: 0, lastWrite: 0 };

    try {
      const probeRes = await fetch(
        `/api/stream/probe?id=${mediaId}&type=${mediaType}&s=${currentSeason}&e=${currentEpisode}`
      );
      if (probeRes.ok) {
        const data = await probeRes.json();
        const healthMap: Record<
          string,
          {
            status: "online" | "degraded" | "offline" | "probing";
            latencyMs?: number;
            isPlayable?: boolean;
          }
        > = {};

        STREAM_SERVERS.forEach((server) => {
          const res = data.results?.[server.id];
          if (res) {
            healthMap[server.id] = {
              status: res.status,
              latencyMs: res.latencyMs,
              isPlayable: res.isPlayable,
            };
          } else {
            healthMap[server.id] = { status: "online", latencyMs: 120, isPlayable: true };
          }
        });

        setServerHealth(healthMap);
        setPlayableCount(data.playableCount || 0);
        const resolvedBest = data.bestServer || data.bestServerId || "server1";
        setBestServerId(resolvedBest);

        const currentServ = activeServerRef.current;
        if (
          !userSelectedServerRef.current &&
          healthMap[currentServ]?.status === "offline" &&
          resolvedBest &&
          resolvedBest !== currentServ
        ) {
          handleSelectServer(resolvedBest);
          showToast(
            `Active mirror was offline. Auto-routed to fastest verified server (${resolvedBest}).`,
            "info"
          );
        }
      }
    } catch {
      // Fallback silently
    } finally {
      setIsProbing(false);
    }
  }, [mediaId, mediaType, currentSeason, currentEpisode, isOfflineMode, handleSelectServer, showToast]);

  // ─── Probe is NOW LAZY ────────────────────────────────────────────────────
  // Previously probeServers() fired on every mount and on every episode
  // change, fanning out 14 concurrent requests to external hosts on every
  // page load. This consumed Vercel Edge Requests rapidly and provided no
  // benefit because the user may never open the Mirrors drawer at all.
  //
  // Probe is now triggered ONLY when the user explicitly:
  //   • opens the Mirrors drawer  (handled in onProbeServers callback below)
  //   • clicks Auto-Fix           (handleAutoSelectBest calls probeServers)
  //   • clicks Retry inside the player (onProbeServers prop)
  //
  // Initial health state remains empty {}; the player still works because
  // resolvedMirrors supplies the active URL directly from the server.

  // ─── 1b. AUDIT C6: Resolve mirror URLs SERVER-SIDE ─────────────────────────
  // The client never builds embed URLs anymore. This route enforces auth +
  // subscription server-side and returns mirror URLs only when entitled.
  const [resolvedMirrors, setResolvedMirrors] = useState<Record<string, { url: string; name: string }>>({});

  useEffect(() => {
    if (isOfflineMode || mediaId.startsWith("local_")) return;

    let cancelled = false;
    let retriedAfterFingerprint = false;

    const resolveMirrors = async () => {
      try {
        // Guests must register their device fingerprint FIRST — the resolve
        // route reads the httpOnly cookie that /api/guest-device sets. Best-
        // effort: it also returns authoritative remaining trial time.
        // Authenticated users skip this so they never drain device trial time.
        if (!isAuthenticatedRef.current) {
          await lookupGuestDevice();
        }

        const res = await fetch(
          `/api/stream/resolve?id=${mediaId}&type=${mediaType}&s=${currentSeason}&e=${currentEpisode}`
        );
        if (!res.ok) {
          const body = res.status === 402 || res.status === 403
            ? await res.json().catch(() => ({}) as { code?: string })
            : {};
          switch (body.code) {
            case "GUEST_TRIAL_ENDED":
              showToast("Your free 30-minute trial has ended. Create an account to keep watching!", "info");
              router.push("/?expired=1#plans");
              break;
            case "PENDING_APPROVAL":
              showToast(
                "Payment under review — streaming unlocks once an admin approves it. Check Account → Subscription.",
                "info"
              );
              break;
            case "EXPIRED":
              showToast("Your subscription has expired. Renew to keep watching.", "error");
              break;
            case "SUBSCRIPTION_REQUIRED":
              // No fingerprint cookie existed yet (first visit / cookies
              // blocked) — register once and retry before giving up.
              if (!retriedAfterFingerprint && !isAuthenticatedRef.current) {
                retriedAfterFingerprint = true;
                await lookupGuestDevice();
                const retry = await fetch(
                  `/api/stream/resolve?id=${mediaId}&type=${mediaType}&s=${currentSeason}&e=${currentEpisode}`
                );
                if (retry.ok && !cancelled) {
                  const retryData = await retry.json();
                  applyMirrorMap(retryData);
                  return;
                }
                if (!cancelled) showToast("Sign up or subscribe to stream this title.", "info");
              } else if (!cancelled) {
                showToast("Sign up or subscribe to stream this title.", "info");
              }
              break;
            default:
              break;
          }
          if (!cancelled) setResolvedMirrors({});
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        applyMirrorMap(data);
      } catch {
        if (!cancelled) setResolvedMirrors({});
      }
    };

    const applyMirrorMap = (data: { mirrors?: Array<{ id: string; url: string; name: string }> }) => {
      const map: Record<string, { url: string; name: string }> = {};
      (data.mirrors || []).forEach((m) => {
        map[m.id] = { url: m.url, name: m.name };
      });
      setResolvedMirrors(map);
    };

    resolveMirrors();
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaType, currentSeason, currentEpisode, isOfflineMode, showToast, router]);

  // ─── 2. Fetch Media Details ────────────────────────────────────────────────
  useEffect(() => {
    const loadMediaDetails = async () => {
      try {
        if (isOfflineMode && localId) {
          const record = await db.localScannedMedia.get(localId);
          if (record) {
            setDetails({
              id: Number(record.id) || 999999,
              title: record.title,
              name: record.title,
              overview: record.overview || `Local playback of file: ${record.fileName}`,
              release_date: record.year ? `${record.year}-01-01` : "",
              first_air_date: record.year ? `${record.year}-01-01` : "",
              poster_path: record.poster_path || "",
              backdrop_path: record.poster_path || "",
              vote_average: 8.5,
              vote_count: 100,
              genres: [{ id: 18, name: "Local Cinema" }],
            } as unknown as MovieDetails);
          }
          return;
        }

        const endpoint = mediaType === "tv" ? `/api/series/${mediaId}` : `/api/movies/${mediaId}`;
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setDetails(data);

          // Fetch Trailer
          const trailerRes = await fetch(`/api/trailer?id=${mediaId}&type=${mediaType}`);
          if (trailerRes.ok) {
            const trailerData = await trailerRes.json();
            if (trailerData.key) {
              setTrailerKey(trailerData.key);
            }
          }

          // Fetch Recommendations (Direct TMDB Recommendations first, then discover fallback)
          if (data.recommendations?.results && data.recommendations.results.length > 0) {
            setRecommendations(data.recommendations.results.slice(0, 12));
          } else {
            const genreList = (data.genres || []).map((g: { id: number }) => g.id).filter(Boolean);
            const genreParam = genreList.length > 0 ? genreList.join(",") : "28";
            const recsRes = await fetch(
              `/api/catalog/discover?media_type=${mediaType}&genre=${genreParam}&sort_by=popularity.desc`
            );
            if (recsRes.ok) {
              const recsData = await recsRes.json();
              setRecommendations((recsData.results || []).slice(0, 12));
            }
          }

          // AUDIT C5 FIX: Create history entry ONLY if none exists yet.
          // The old unconditional put() overwrote real resume positions
          // with junk (currentTime: 0) every time details loaded or the
          // season/episode changed. Existing records keep their progress;
          // handleTimeUpdate owns all subsequent writes.
          const historyKey = LantawonDatabase.historyKey(vaultUserIdRef.current, mediaId, currentSeason, currentEpisode);
          const existing = await db.watchHistory.get(historyKey);
          if (!existing) {
            await db.watchHistory.put({
              id: historyKey,
              userId: vaultUserIdRef.current,
              mediaId,
              mediaType,
              title: data.title || data.name || "Untitled",
              posterPath: data.poster_path || "",
              season: currentSeason,
              episode: currentEpisode,
              currentTime: 0,
              duration: 0,
              percentage: 0,
              lastWatchedAt: new Date().toISOString(),
              completed: false,
            });
          }
        }
      } catch (e) {
        console.error("[WatchPage] Failed to load media details", e);
      }
    };

    loadMediaDetails();
  }, [mediaId, mediaType, localId, currentSeason, currentEpisode, isOfflineMode]);

  // Load Season Episodes for TV Series
  useEffect(() => {
    if (mediaType === "tv" && !mediaId.startsWith("local_")) {
      const fetchEpisodes = async () => {
        try {
          const res = await fetch(`/api/series/${mediaId}/season/${currentSeason}`);
          if (res.ok) {
            const data: Season = await res.json();
            setSeasonEpisodes(data.episodes || []);
          }
        } catch {}
      };
      fetchEpisodes();
    }
  }, [mediaId, mediaType, currentSeason]);

  // Auto-resume from IndexedDB
  useEffect(() => {
    const checkResumeTime = async () => {
      try {
        const key = LantawonDatabase.historyKey(vaultUserIdRef.current, mediaId, currentSeason, currentEpisode);
        const record = await db.watchHistory.get(key);
        if (record && record.currentTime > 15 && localVideoRef.current) {
          localVideoRef.current.currentTime = record.currentTime;
          const mins = Math.floor(record.currentTime / 60);
          const secs = Math.floor(record.currentTime % 60);
          showToast(`Resumed playback at ${mins}:${String(secs).padStart(2, "0")}`, "info");
        }
      } catch {}
    };
    checkResumeTime();
  }, [mediaId, currentSeason, currentEpisode, activeServer, showToast]);

  // Handle Local Playback Engine Attachment
  useEffect(() => {
    if (activeServer === "local" && localVideoRef.current && localId) {
      const blobUrl = LocalScannerService.getLocalFileBlobUrl(localId);
      if (blobUrl) {
        localVideoRef.current.src = blobUrl;
        localVideoRef.current.play().catch(() => {});
        engineRef.current = new CineStreamEngine({
          onMetricsUpdate: (m) => setMetrics(m),
        });
        engineRef.current.init(localVideoRef.current);
      }
    }

    return () => {
      engineRef.current?.destroy();
    };
  }, [activeServer, localId]);

  // Local Video Progress Tracker
  const handleTimeUpdate = async () => {
    if (!localVideoRef.current) return;
    const cur = localVideoRef.current.currentTime;
    const dur = localVideoRef.current.duration || 1;
    const pct = Math.floor((cur / dur) * 100);

    if (Math.floor(cur) % 3 === 0) {
      await db.watchHistory.put({
        id: LantawonDatabase.historyKey(vaultUserIdRef.current, mediaId, currentSeason, currentEpisode),
        userId: vaultUserIdRef.current,
        mediaId: String(mediaId),
        mediaType,
        title: displayTitle,
        posterPath: details?.poster_path || "",
        season: currentSeason,
        episode: currentEpisode,
        currentTime: cur,
        duration: dur,
        percentage: pct,
        lastWatchedAt: new Date().toISOString(),
        completed: pct > 90,
      });
    }
  };

  // Subtitle File Upload Handler
  const handleSubtitleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const vttUrl = URL.createObjectURL(file);
      setSubtitlesUrl(vttUrl);
      showToast(`Loaded subtitle track: ${file.name}`, "success");
      showHud("CC: Subtitles Loaded");
    }
  };

  const handleShare = async () => {
    audioFX.playClick();
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: displayTitle,
          url: window.location.href,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!", "success");
      }
    } catch {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Link copied to clipboard!", "success");
      }
    }
  };

  const toggleFavorite = async () => {
    audioFX.playPop();
    const nextFav = !isFavorited;
    setIsFavorited(nextFav);
    if (details) {
      const mediaIdStr = String(mediaId);
      await db.libraryItems.put({
        id: LantawonDatabase.libraryKey(vaultUserIdRef.current, mediaIdStr),
        userId: vaultUserIdRef.current,
        mediaId: mediaIdStr,
        mediaType,
        title: displayTitle,
        posterPath: details.poster_path || "",
        genres: details.genres?.map((g) => g.name) || [],
        rating: details.vote_average || 0,
        inWatchlist: isSaved,
        isFavorite: nextFav,
        addedAt: new Date().toISOString(),
      });
      showToast(nextFav ? "Added to Favorites" : "Removed from Favorites", "success");
    }
  };

  const handleAutoSelectBest = () => {
    audioFX.playPop();
    if (bestServerId) {
      handleSelectServer(bestServerId);
      showToast(`Selected fastest verified mirror: ${bestServerId}`, "success");
    }
  };

  const handleSwitchNextServer = useCallback(() => {
    audioFX.playClick();
    const currentIndex = STREAM_SERVERS.findIndex((s) => s.id === activeServer);
    const nextIndex = (currentIndex + 1) % STREAM_SERVERS.length;
    const nextServer = STREAM_SERVERS[nextIndex];
    handleSelectServer(nextServer.id);
    showToast(`Switched to Mirror #${nextIndex + 1}: ${nextServer.name}`, "info");
    showHud(`Mirror: ${nextServer.name}`);
  }, [activeServer, handleSelectServer, showToast]);

  const handleToggleTheaterMode = useCallback(() => {
    audioFX.playClick();
    setIsTheaterMode((prev) => {
      const next = !prev;
      showToast(next ? "Theater Mode Active" : "Standard Mode", "info");
      showHud(next ? "Mode: Theater 21:9" : "Mode: Standard 16:9");
      return next;
    });
  }, [showToast]);

  // ─── Fullscreen Toggle ───────────────────────────────────────────────────
  // We request fullscreen on playerWrapperRef which contains BOTH the video
  // viewport AND the CinemaControlBar — so controls stay visible inside the
  // native fullscreen surface.
  //
  // State is NOT set optimistically here (race condition fix). Instead the
  // fullscreenchange event listener below is the single source of truth for
  // isFullScreen. This avoids stuck-fullscreen CSS when requestFullscreen()
  // fails silently on mobile browsers.
  const handleToggleFullScreen = useCallback(async () => {
    audioFX.playPop();
    try {
      if (!document.fullscreenElement) {
        const target = playerWrapperRef.current;
        if (target?.requestFullscreen) {
          await target.requestFullscreen();
          // state will be set by the fullscreenchange listener
        } else {
          // Browser doesn't support Fullscreen API (some older mobile)
          // Fall back to CSS-only fullscreen as a last resort
          setIsFullScreen(true);
          showToast("Cinema Fullscreen Active (ESC to exit)", "success");
          showHud("Full Mode: Active");
        }
      } else {
        await document.exitFullscreen();
        // state will be cleared by the fullscreenchange listener
      }
    } catch {
      // requestFullscreen can throw in restricted contexts (e.g. iOS Safari
      // requires a direct user gesture on the video element). Silently ignore.
    }
  }, [showToast]);

  // ─── Fullscreen State Sync (authoritative) ─────────────────────────────
  // This is the ONLY place isFullScreen state changes for native fullscreen.
  // It reacts to both our own toggle and the user pressing ESC.
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = Boolean(document.fullscreenElement);
      setIsFullScreen(inFullscreen);
      if (inFullscreen) {
        showHud("Full Mode: Active");
      } else {
        showHud("Full Mode: Standard");
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  // showHud is stable (no deps needed) — eslint-disable-next-line is intentional
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Shortcuts: 'S' (Switch Mirror), 'T' (Theater Mode), 'F' (Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        handleSwitchNextServer();
      } else if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        handleToggleTheaterMode();
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        handleToggleFullScreen();
      } else if (e.key === "Escape" && isFullScreen) {
        e.preventDefault();
        handleToggleFullScreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSwitchNextServer, handleToggleTheaterMode, handleToggleFullScreen, isFullScreen]);

  const handleFrameLoad = useCallback(() => {
    setIsFrameLoading(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#111112] text-zinc-100 flex flex-col selection:bg-[#E50914] selection:text-white">
      {/* ─── Header ─── */}
      <Header onOpenLibrary={() => setIsLibraryOpen(true)} />

      {/* ─── Hero Video Viewport Section ─── */}
      {/*
        playerWrapperRef wraps the viewport + control bar together.
        requestFullscreen() is called on this element so the controls remain
        visible inside the native fullscreen surface. Without this wrapper,
        CinemaControlBar was a sibling OUTSIDE the fullscreen element and
        disappeared when fullscreen was entered.
      */}
      <div
        ref={playerWrapperRef}
        className={[
          "w-full flex flex-col items-center bg-black pt-[57px] sm:pt-[65px]",
          // In native fullscreen the browser makes this element fill the
          // screen via :fullscreen. We reinforce with explicit sizing so
          // the nested flex children also fill correctly.
          isFullScreen ? "[&:fullscreen]:p-0 [&:-webkit-full-screen]:p-0" : "",
        ].join(" ")}
      >
        <CinemaPlayerViewport
          videoContainerRef={videoContainerRef}
          localVideoRef={localVideoRef}
          activeServer={activeServer}
          displayTitle={displayTitle}
          mediaId={mediaId}
          mediaType={mediaType}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          trailerKey={trailerKey}
          hudMessage={hudMessage}
          subtitlesUrl={subtitlesUrl}
          isFrameLoading={isFrameLoading}
          isProbing={isProbing}
          playableCount={playableCount}
          resolvedMirrors={resolvedMirrors}
          isTheaterMode={isTheaterMode}
          isFullScreen={isFullScreen}
          onTimeUpdate={handleTimeUpdate}
          onFrameLoad={handleFrameLoad}
          onSelectServer={handleSelectServer}
          onProbeServers={probeServers}
          onToggleFullScreen={handleToggleFullScreen}
          onToggleTheaterMode={handleToggleTheaterMode}
          showToast={showToast}
        />

        {/* ─── Cinema Control Bar (Below Player, INSIDE the fullscreen wrapper) ─── */}
        <CinemaControlBar
          activeServer={activeServer}
          isOfflineMode={isOfflineMode}
          playableCount={playableCount}
          isServerDrawerOpen={isServerDrawerOpen}
          isSettingsOpen={isSettingsOpen}
          isTheaterMode={isTheaterMode}
          isFullScreen={isFullScreen}
          dataUsedMb={dataUsedMb}
          isDataSaver={dataSaver}
          onAutoSelectBest={handleAutoSelectBest}
          onSwitchNextServer={handleSwitchNextServer}
          onToggleServerDrawer={() => {
            // Probe lazily: only when user opens the Mirrors drawer
            if (!isServerDrawerOpen) probeServers();
            setIsServerDrawerOpen(!isServerDrawerOpen);
          }}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          onToggleTheaterMode={handleToggleTheaterMode}
          onToggleFullScreen={handleToggleFullScreen}
          onSubtitleFile={handleSubtitleFile}
        />

        {/* ─── Diagnostics & Data Guard Dropdown Panel ─── */}
        <WatchSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          metrics={metrics ?? {
            currentTime: 0,
            duration: 0,
            bufferedSeconds: 0,
            bandwidthKbps: 0,
            droppedFrames: 0,
            decodedFrames: 0,
            avDriftMs: 0,
            rebufferCount: 0,
            rebufferDurationMs: 0,
            qoeScore: 100,
            server: activeServer,
          }}
          activeServer={activeServer}
          dataUsedMb={dataUsedMb}
          onSelectServer={handleSelectServer}
        />
      </div>

      {/* ─── Main Content Lower Body ─── */}
      <main className="w-full px-4 sm:px-8 lg:px-14 py-6 space-y-6 pb-20">
        {/* ─── Hero Title, Metadata & Quick Actions ─── */}
        <MediaMetadataHero
          displayTitle={displayTitle}
          year={year}
          mediaType={mediaType}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          details={details}
          isFavorited={isFavorited}
          onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
          onToggleFavorite={toggleFavorite}
          onShare={handleShare}
        />

        {/* ─── TV Series Seasons & Episodes Grid ─── */}
        {mediaType === "tv" && details && "seasons" in details && (
          <EpisodeSelectorDrawer
            details={details as TvDetails}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            seasonEpisodes={seasonEpisodes}
            onSelectSeason={(s) => {
              setCurrentSeason(s);
              setCurrentEpisode(1);
              scrollToPlayer();
            }}
            onSelectEpisode={(ep) => {
              setCurrentEpisode(ep);
              scrollToPlayer();
            }}
            onScrollToPlayer={scrollToPlayer}
          />
        )}

        {/* ─── Cast, Advisory & Recommendations ─── */}
        <CastAndRecommendations
          mediaId={mediaId}
          mediaType={mediaType}
          displayTitle={displayTitle}
          details={details}
          recommendations={recommendations}
          onScrollToPlayer={scrollToPlayer}
        />
      </main>

      {/* ─── Floating Streaming Mirrors Modal / Drawer ─── */}
      <ServerPickerDrawer
        isOpen={isServerDrawerOpen}
        onClose={() => setIsServerDrawerOpen(false)}
        activeServer={activeServer}
        onSelectServer={handleSelectServer}
        localId={localId}
        serverHealth={serverHealth}
        isProbing={isProbing}
        onProbeServers={probeServers}
        onAutoSelectBest={handleAutoSelectBest}
        playableCount={playableCount}
      />

      {/* ─── Global Modals ─── */}
      <LibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />

      {selectedPersonId && (
        <PersonModal personId={selectedPersonId} onClose={() => setSelectedPersonId(null)} />
      )}

      {details && (
        <SaveToPlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          item={{
            id: details.id,
            title: displayTitle,
            mediaType,
            posterPath: details.poster_path || "",
            year,
            rating: details.vote_average || 0,
          }}
        />
      )}

      {/* ─── Floating Device-Based 30-Minute Guest Session Timer ─── */}
      <GuestSessionStickyTimer />
    </div>
  );
}

export default function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-[#111112]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E50914] border-t-transparent" />
        </div>
      }
    >
      <WatchPageContent mediaId={resolvedParams.id} />
    </React.Suspense>
  );
}

