"use client";

import React, { useState, useEffect, useRef, use, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CineStreamEngine } from "@/features/streaming/engine/cinestream-engine";
import { LocalScannerService } from "@/features/library/local-scanner";
import { db, LantawonDatabase } from "@/lib/db/dexie-db";
import { GUEST_USER_ID } from "@/types/storage";
import { STREAM_SERVERS, getStreamingServersFor } from "@/lib/constants/streaming-servers";
import { formatYear } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { LibraryDrawer } from "@/components/library/LibraryDrawer";
import { PersonModal } from "@/components/movie/PersonModal";
import { lookupGuestDevice } from "@/lib/services/guest-device-service";
import { GuestTimerService } from "@/lib/services/guest-timer-service";
import { useAuth } from "@/context/AuthContext";
import { StreakService } from "@/lib/services/streak-service";
import { SaveToPlaylistModal } from "@/components/playlist/SaveToPlaylistModal";
import { CinemaPlayerViewport } from "@/components/watch/CinemaPlayerViewport";
import { ServerPickerDrawer } from "@/components/watch/ServerPickerDrawer";
import { EpisodeSelectorDrawer } from "@/components/watch/EpisodeSelectorDrawer";
import { WatchSettingsModal } from "@/components/watch/WatchSettingsModal";
import { MediaMetadataHero } from "@/components/watch/MediaMetadataHero";
import { DetailsEpisodesSection } from "@/components/watch/DetailsEpisodesSection";
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
  const rawType = (searchParams.get("type") || searchParams.get("media_type") || "movie").toLowerCase();
  const mediaType: "movie" | "tv" = rawType === "anime" || rawType === "tv" || rawType === "series" || rawType === "show" ? "tv" : "movie";
  const [detectedMediaType, setDetectedMediaType] = useState<"movie" | "tv">(mediaType);
  const effectiveMediaType = detectedMediaType || mediaType;
  const localId = searchParams.get("localId");
  const { showToast } = useToast();
  const router = useRouter();
  const { user: authUser, isLoading: isAuthLoading } = useAuth();
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

  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    return searchParams.get("play") === "true";
  });

  const [details, setDetails] = useState<MovieDetails | TvDetails | null>(null);
  const [activeServer, setActiveServer] = useState<string>(() => {
    if (isOfflineMode) return "local";
    return "server1";
  });
  const activeServerRef = useRef(activeServer);
  activeServerRef.current = activeServer;
  const userSelectedServerRef = useRef(false);

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const initialSeason = parseInt(searchParams.get("season") || searchParams.get("s") || "1", 10) || 1;
  const initialEpisode = parseInt(searchParams.get("episode") || searchParams.get("e") || "1", 10) || 1;
  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [seasonEpisodes, setSeasonEpisodes] = useState<Episode[]>([]);
  const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
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

  // Resolved mirror URLs (populated by server-side entitlement check)
  const [resolvedMirrors, setResolvedMirrors] = useState<Record<string, { url: string; name: string }>>({});
  const [isResolvingMirrors, setIsResolvingMirrors] = useState(true);
  const [entitlementDenial, setEntitlementDenial] = useState<
    "SUBSCRIPTION_REQUIRED" | "PENDING_APPROVAL" | "EXPIRED" | "GUEST_TRIAL_ENDED" | null
  >(null);

  // Clean up legacy global preferred_stream_server so titles aren't poisoned by stale server state
  useEffect(() => {
    try {
      localStorage.removeItem("preferred_stream_server");
    } catch {}
  }, []);

  // Auto-dismiss loading spinner after 4.5s so cross-origin embeds without standard onLoad don't stall UI
  useEffect(() => {
    if (!isFrameLoading) return;
    const timer = setTimeout(() => setIsFrameLoading(false), 4500);
    return () => clearTimeout(timer);
  }, [isFrameLoading, activeServer]);

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

  // Clearing the pending timer keeps back-to-back HUDs from cutting each
  // other short — the second message used to inherit the first one's deadline.
  const hudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showHud = useCallback((msg: string) => {
    setHudMessage(msg);
    if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => setHudMessage(null), 2500);
  }, []);

  const handleSelectServer = useCallback((serverId: string) => {
    audioFX.playClick();
    userSelectedServerRef.current = true;
    setActiveServer(serverId);
    setIsFrameLoading(true);
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
  //
  // ENTITLEMENT GATE (2026-08-27): only tick when the active mirror has a
  // resolved URL. When the entitlement check fails (guest trial ended,
  // subscription pending/expired), `resolvedMirrors` is empty and the
  // CinemaPlayerViewport does NOT mount an iframe — so counting "playback"
  // seconds and writing watchHistory here fabricates fake progress and
  // reports phantom data usage. Unentitled visits must produce zero
  // watchHistory rows and zero dataUsedMb.
  // ─── Watch Progress + TikTok Streak Tracker ──────────────────────────────
  // Ticks every 5 seconds. At 10 seconds of real playback, immediately writes
  // watch history and fires the streak (TikTok mechanic: any watch >= 10s
  // counts as the daily active day). XP accrual removed per user request.
  const streakFiredTodayRef = useRef(false);
  useEffect(() => {
    if (isOfflineMode || activeServer === "local" || activeServer === "trailer") return;
    if (!resolvedMirrors[activeServer]?.url || isFrameLoading || isResolvingMirrors) return;

    streakFiredTodayRef.current = false;
    const interval = setInterval(() => {
      iframeProgressRef.current.seconds += 5;
      setDataUsedMb(
        NetworkGuard.calculateDataUsedMb(iframeProgressRef.current.seconds, "720p", dataSaver)
      );

      // ── TikTok Streak: fire once at 10 seconds ──────────────────────────
      if (!streakFiredTodayRef.current && iframeProgressRef.current.seconds >= 10) {
        streakFiredTodayRef.current = true;
        const uid = vaultUserIdRef.current;
        StreakService.recordPlaybackStreak(uid, displayTitle).then(({ isNewDayStreak, streak }) => {
          if (isNewDayStreak) {
            showToast(
              `🔥 Day ${streak} Streak! Keep watching daily to grow your flame!`,
              "success"
            );
          }
        });
      }

      const now = Date.now();
      if (now - iframeProgressRef.current.lastWrite < 15_000) return;
      iframeProgressRef.current.lastWrite = now;

      const isGuest = !authUser || !authUser.isLoggedIn || authUser.role === "guest";
      if (isGuest) return;

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
    resolvedMirrors,
    isFrameLoading,
    isResolvingMirrors,
    mediaId,
    mediaType,
    currentSeason,
    currentEpisode,
    displayTitle,
    details,
    dataSaver,
    showToast,
  ]);

  // Tell the guest trial clock that a stream is genuinely on screen and playing.
  // Countdown MUST NOT decrement while loading, resolving mirrors, or on an offline/error mirror!
  const isCurrentServerWorking =
    serverHealth[activeServer]?.isPlayable !== false &&
    serverHealth[activeServer]?.status !== "offline";

  const isStreaming = Boolean(
    !isOfflineMode &&
    !entitlementDenial &&
    activeServer !== "trailer" &&
    resolvedMirrors[activeServer]?.url &&
    !isFrameLoading &&
    !isResolvingMirrors &&
    isCurrentServerWorking
  );

  // Safety cleanup: Ensure guest playback is paused when unmounting watch page
  useEffect(() => {
    return () => {
      GuestTimerService.setPlaybackActive(false);
    };
  }, []);

  // One-shot cellular/data-limit alert (resets per session via probeServers)
  useEffect(() => {
    if (dataAlertFiredRef.current || dataUsedMb <= 0) return;
    const limitMb = NetworkGuard.getDataLimitMb();
    if (dataUsedMb >= limitMb) {
      dataAlertFiredRef.current = true;
      showToast(`Data guard: ~${dataUsedMb} MB used (your limit: ${limitMb} MB).`, "info");
    }
  }, [dataUsedMb, showToast]);

  // XP accrual removed — leaderboard and XP system have been fully removed.
  // Daily streak is tracked instead via StreakService (, 10-second threshold).

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
      const category = rawType === "anime" ? "anime" : effectiveMediaType;
      const probeRes = await fetch(
        `/api/stream/probe?id=${mediaId}&type=${category}&s=${currentSeason}&e=${currentEpisode}`
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

        const currentPool = getStreamingServersFor(category);
        currentPool.forEach((server) => {
          const res = data.results?.[server.id];
          if (res) {
            healthMap[server.id] = {
              status: res.status,
              latencyMs: res.latencyMs,
              isPlayable: res.isPlayable,
            };
          } else {
            healthMap[server.id] = { status: "offline", latencyMs: 9999, isPlayable: false };
          }
        });

        setServerHealth(healthMap);
        setPlayableCount(data.playableCount || 0);
        const resolvedBest = data.bestServer || data.bestServerId || currentPool[0]?.id || "server1";
        setBestServerId(resolvedBest);

        const currentServ = activeServerRef.current;
        const currentIsBad =
          healthMap[currentServ]?.isPlayable === false ||
          healthMap[currentServ]?.status === "offline";

        // Auto-switch immediately if the current server is broken/missing, or on initial load to best server
        if (
          (currentIsBad || !userSelectedServerRef.current) &&
          resolvedBest &&
          resolvedBest !== currentServ &&
          healthMap[resolvedBest]?.isPlayable !== false
        ) {
          handleSelectServer(resolvedBest);
          if (currentIsBad) {
            showToast(
              `Auto-routed to verified working mirror (${currentPool.find((s) => s.id === resolvedBest)?.name || "Server"}).`,
              "info"
            );
          }
        }
      }
    } catch {
      // Fallback silently
    } finally {
      setIsProbing(false);
    }
  }, [mediaId, effectiveMediaType, rawType, currentSeason, currentEpisode, isOfflineMode, handleSelectServer, showToast]);

  // AUDIT QUOTA OPTIMIZATION: probeServers() is now triggered lazily
  // when the user opens the Mirrors panel or triggers Auto-Fix,
  // preventing 14 automatic HTTP requests on every single page load.

  // ─── 1b. AUDIT C6: Resolve mirror URLs SERVER-SIDE ─────────────────────────
  // The client never builds embed URLs anymore. This route enforces auth +
  // subscription server-side and returns mirror URLs only when entitled.

  useEffect(() => {
    if (isOfflineMode || mediaId.startsWith("local_")) {
      setIsResolvingMirrors(false);
      return;
    }

    // Wait for AuthContext to resolve the real session before asking the
    // server for mirrors.
    if (isAuthLoading) return;

    let cancelled = false;
    let retriedAfterFingerprint = false;

    const resolveMirrors = async () => {
      setIsResolvingMirrors(true);
      try {
        if (!authUser.isLoggedIn) {
          await lookupGuestDevice();
        }

        const category = rawType === "anime" ? "anime" : effectiveMediaType;
        const res = await fetch(
          `/api/stream/resolve?id=${mediaId}&type=${category}&s=${currentSeason}&e=${currentEpisode}`
        );
        if (!res.ok) {
          const body = res.status === 402 || res.status === 403
            ? await res.json().catch(() => ({}) as { code?: "SUBSCRIPTION_REQUIRED" | "PENDING_APPROVAL" | "EXPIRED" | "GUEST_TRIAL_ENDED" })
            : {};
          const denial = body.code || "SUBSCRIPTION_REQUIRED";
          if (!cancelled) setEntitlementDenial(denial);

          switch (denial) {
            case "GUEST_TRIAL_ENDED":
              showToast("Your free 30-minute trial has ended. Create an account or subscribe to keep watching!", "info");
              break;
            case "PENDING_APPROVAL":
              showToast(
                "Payment under review — streaming unlocks once an admin approves it.",
                "info"
              );
              break;
            case "EXPIRED":
              showToast("Your subscription has expired. Renew to keep watching.", "error");
              break;
            case "SUBSCRIPTION_REQUIRED":
              if (!retriedAfterFingerprint && !authUser.isLoggedIn) {
                retriedAfterFingerprint = true;
                await lookupGuestDevice();
                const retry = await fetch(
                  `/api/stream/resolve?id=${mediaId}&type=${category}&s=${currentSeason}&e=${currentEpisode}`
                );
                if (retry.ok && !cancelled) {
                  const retryData = await retry.json();
                  setEntitlementDenial(null);
                  applyMirrorMap(retryData);
                  return;
                }
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
        setEntitlementDenial(null);
        applyMirrorMap(data);
      } catch {
        if (!cancelled) {
          setEntitlementDenial(null);
          setResolvedMirrors({});
        }
      } finally {
        if (!cancelled) setIsResolvingMirrors(false);
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
  }, [
    mediaId,
    effectiveMediaType,
    currentSeason,
    currentEpisode,
    isOfflineMode,
    isAuthLoading,
    authUser.isLoggedIn,
    authUser.id,
    showToast,
    router,
  ]);

  // ─── 2. Fetch Media Details with Automatic Cross-Type Resolution ──────────
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

        let data: any = null;
        let resolvedType: "movie" | "tv" = mediaType;

        const primaryEndpoint = mediaType === "tv" ? `/api/series/${mediaId}` : `/api/movies/${mediaId}`;
        const res = await fetch(primaryEndpoint);
        if (res.ok) {
          data = await res.json();
          if (mediaType === "tv" && data.title && !data.name && !data.seasons) {
            resolvedType = "movie";
          }
        } else {
          // Automatic cross-type fallback (e.g. anime movie with type=tv or anime series with type=movie)
          const fallbackEndpoint = mediaType === "tv" ? `/api/movies/${mediaId}` : `/api/series/${mediaId}`;
          const fallbackRes = await fetch(fallbackEndpoint);
          if (fallbackRes.ok) {
            data = await fallbackRes.json();
            resolvedType = mediaType === "tv" ? "movie" : "tv";
          }
        }

        if (data) {
          if (data.seasons || data.number_of_seasons || ("name" in data && !("title" in data))) {
            resolvedType = "tv";
          } else if ("title" in data && !data.seasons) {
            resolvedType = "movie";
          }
          setDetectedMediaType(resolvedType);
          setDetails(data);

          // Fetch Trailer with canonical type
          const trailerRes = await fetch(`/api/trailer?id=${mediaId}&type=${resolvedType}`);
          if (trailerRes.ok) {
            const trailerData = await trailerRes.json();
            if (trailerData.key) {
              setTrailerKey(trailerData.key);
            }
          }

          // Fetch Recommendations with canonical type
          if (data.recommendations?.results && data.recommendations.results.length > 0) {
            setRecommendations(data.recommendations.results.slice(0, 12));
          } else {
            const genreList = (data.genres || []).map((g: { id: number }) => g.id).filter(Boolean);
            const genreParam = genreList.length > 0 ? genreList.join(",") : "28";
            const recsRes = await fetch(
              `/api/catalog/discover?media_type=${resolvedType}&genre=${genreParam}&sort_by=popularity.desc`
            );
            if (recsRes.ok) {
              const recsData = await recsRes.json();
              setRecommendations((recsData.results || []).slice(0, 12));
            }
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
  // Memoized so CinemaPlayerViewport's React.memo actually holds — an unstable
  // prop here re-rendered the whole player tree on every 5s progress tick.
  const handleTimeUpdate = useCallback(async () => {
    if (!localVideoRef.current) return;
    const cur = localVideoRef.current.currentTime;
    const dur = localVideoRef.current.duration || 1;
    const pct = Math.floor((cur / dur) * 100);

    const isGuest = !authUser || !authUser.isLoggedIn || authUser.role === "guest";
    if (isGuest) return;

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
  }, [mediaId, mediaType, currentSeason, currentEpisode, displayTitle, details]);

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

  const toggleWatchlist = async () => {
    audioFX.playPop();
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
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
        inWatchlist: nextSaved,
        isFavorite: isFavorited,
        addedAt: new Date().toISOString(),
      });
      showToast(nextSaved ? "Added to Watchlist" : "Removed from Watchlist", "success");
    }
  };

  const handleAutoSelectBest = () => {
    audioFX.playPop();
    if (bestServerId) {
      handleSelectServer(bestServerId);
    }
  };

  const handleSwitchNextServer = useCallback(() => {
    audioFX.playClick();
    const serverIds = STREAM_SERVERS.map((s) => s.id);
    const currentIndex = serverIds.indexOf(activeServer);

    // Try to find the next server that is not marked offline
    let nextIndex = (currentIndex + 1) % serverIds.length;
    for (let i = 1; i <= serverIds.length; i++) {
      const checkIdx = (currentIndex + i) % serverIds.length;
      const sid = serverIds[checkIdx];
      const health = serverHealth[sid];
      if (resolvedMirrors[sid]?.url && health?.status !== "offline" && health?.isPlayable !== false) {
        nextIndex = checkIdx;
        break;
      }
    }

    // handleSelectServer already raises a HUD naming the mirror and the resume
    // point; a toast on top of it was two notifications for one action.
    handleSelectServer(STREAM_SERVERS[nextIndex].id);
  }, [activeServer, serverHealth, resolvedMirrors, handleSelectServer]);

  const handleToggleTheaterMode = useCallback(() => {
    audioFX.playClick();
    setIsTheaterMode((prev) => {
      const next = !prev;
      showHud(next ? "Mode: Theater 21:9" : "Mode: Standard 16:9");
      return next;
    });
  }, [showHud]);

  const handleNextEpisode = useCallback(() => {
    audioFX.playClick();
    userSelectedServerRef.current = false;
    const hasNextInSeason = seasonEpisodes.some((ep) => ep.episode_number === currentEpisode + 1);
    if (hasNextInSeason) {
      setCurrentEpisode((prev) => prev + 1);
      scrollToPlayer();
      showToast(`Switched to Episode ${currentEpisode + 1}`, "info");
    } else if (details && "seasons" in details) {
      const tv = details as TvDetails;
      const nextSeasonNum = currentSeason + 1;
      const hasNextSeason = tv.seasons?.some((s) => s.season_number === nextSeasonNum);
      if (hasNextSeason) {
        setCurrentSeason(nextSeasonNum);
        setCurrentEpisode(1);
        scrollToPlayer();
        showToast(`Started Season ${nextSeasonNum} Episode 1`, "info");
      }
    }
  }, [seasonEpisodes, currentEpisode, details, currentSeason, showToast]);

  const handleToggleFullScreen = useCallback(async () => {
    audioFX.playPop();
    try {
      if (!isFullScreen) {
        const el = videoContainerRef.current;
        if (el?.requestFullscreen) {
          await el.requestFullscreen().catch(() => {});
        } else if ((el as any)?.webkitRequestFullscreen) {
          await (el as any).webkitRequestFullscreen();
        }
        setIsFullScreen(true);
        showHud("Full Mode: Active");

        // Attempt mobile / tablet landscape auto-rotation lock
        if (typeof window !== "undefined" && "screen" in window && (window.screen as any)?.orientation?.lock) {
          try {
            await (window.screen as any).orientation.lock("landscape");
          } catch {}
        }
      } else {
        if (typeof document !== "undefined" && document.fullscreenElement) {
          await document.exitFullscreen().catch(() => {});
        } else if (typeof document !== "undefined" && (document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullScreen(false);
        showHud("Full Mode: Standard");

        if (typeof window !== "undefined" && "screen" in window && (window.screen as any)?.orientation?.unlock) {
          try {
            (window.screen as any).orientation.unlock();
          } catch {}
        }
      }
    } catch {
      setIsFullScreen(!isFullScreen);
    }
  }, [isFullScreen, showHud]);

  // Sync fullscreen state with native browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFs = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isDocFs && isFullScreen) {
        setIsFullScreen(false);
        if (typeof window !== "undefined" && "screen" in window && (window.screen as any)?.orientation?.unlock) {
          try {
            (window.screen as any).orientation.unlock();
          } catch {}
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, [isFullScreen]);

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
      {/* ─── A. FULL-SCREEN IMMERSIVE CINEMA PLAYER VIEW (When Playing) ─── */}
      {isPlaying ? (
        <div className="fixed inset-0 z-[80] w-screen h-screen bg-black overflow-hidden flex flex-col items-center justify-center">
          <CinemaPlayerViewport
            videoContainerRef={videoContainerRef}
            localVideoRef={localVideoRef}
            activeServer={activeServer}
            displayTitle={displayTitle}
            mediaId={mediaId}
            mediaType={rawType === "anime" ? "anime" : effectiveMediaType}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            trailerKey={trailerKey}
            hudMessage={hudMessage}
            subtitlesUrl={subtitlesUrl}
            isFrameLoading={isFrameLoading}
            isProbing={isProbing}
            playableCount={playableCount}
            resolvedMirrors={resolvedMirrors}
            isResolvingMirrors={isResolvingMirrors}
            entitlementDenial={entitlementDenial}
            isTheaterMode={isTheaterMode}
            isFullScreen={isFullScreen}
            currentTime={iframeProgressRef.current.seconds}
            duration={details && "runtime" in details && typeof details.runtime === "number" && details.runtime > 0 ? details.runtime * 60 : 1609}
            tvDetails={details && "seasons" in details ? (details as TvDetails) : null}
            seasonEpisodes={seasonEpisodes}
            onSelectSeason={(s) => {
              userSelectedServerRef.current = false;
              setCurrentSeason(s);
              setCurrentEpisode(1);
            }}
            onSelectEpisode={(ep) => {
              userSelectedServerRef.current = false;
              setCurrentEpisode(ep);
            }}
            onNextEpisode={handleNextEpisode}
            onTimeUpdate={handleTimeUpdate}
            onFrameLoad={handleFrameLoad}
            onSelectServer={handleSelectServer}
            onAutoSelectBest={handleAutoSelectBest}
            onProbeServers={probeServers}
            onNextServer={handleSwitchNextServer}
            onToggleFullScreen={handleToggleFullScreen}
            onToggleTheaterMode={handleToggleTheaterMode}
            dataUsedMb={dataUsedMb}
            showToast={showToast}
            onBack={() => setIsPlaying(false)}
          />

          {/* Diagnostics Panel */}
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
      ) : (
        <>
          {/* ─── FULL-BLEED HERO BANNER (NO TOP/LEFT/RIGHT MARGINS) ─── */}
          <MediaMetadataHero
            displayTitle={displayTitle}
            year={year}
            mediaType={effectiveMediaType}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            details={details}
            trailerKey={trailerKey}
            isFavorited={isFavorited}
            isInWatchlist={isSaved}
            onPlay={() => setIsPlaying(true)}
            onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
            onToggleFavorite={toggleFavorite}
            onToggleWatchlist={toggleWatchlist}
            onBack={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/home");
              }
            }}
          />

          {/* ─── MEDIA DETAILS BODY SECTIONS ─── */}
          <main className="w-full px-6 sm:px-12 lg:px-16 py-10 space-y-12 pb-24">
            {/* TV Series / Anime Episodes List (Screenshot 1 Style) */}
            {effectiveMediaType === "tv" && (
              <DetailsEpisodesSection
                details={details && "seasons" in details ? (details as TvDetails) : null}
                currentSeason={currentSeason}
                currentEpisode={currentEpisode}
                episodes={seasonEpisodes}
                onSelectSeason={(s) => {
                  userSelectedServerRef.current = false;
                  setCurrentSeason(s);
                  setCurrentEpisode(1);
                }}
                onPlayEpisode={(s, ep) => {
                  userSelectedServerRef.current = false;
                  setCurrentSeason(s);
                  setCurrentEpisode(ep);
                  setIsPlaying(true);
                }}
              />
            )}

            {/* Cast & Recommendations (Screenshot 2 Style) */}
            <CastAndRecommendations
              mediaId={mediaId}
              mediaType={effectiveMediaType}
              displayTitle={displayTitle}
              details={details}
              recommendations={recommendations}
              onScrollToPlayer={() => setIsPlaying(true)}
            />
          </main>
        </>
      )}

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

