"use client";

import React from "react";
import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  Play,
  Calendar,
  Clock,
  Radio,
  Tv,
  Film,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { formatYear } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import { ContentGuideWidget } from "@/components/content-guide/ContentGuideWidget";
import { StudioNetworksHub } from "@/components/movie/StudioNetworksHub";
import { WhereToWatchHub } from "@/components/movie/WhereToWatchHub";
import type { MovieDetails, TvDetails, MediaItem } from "@/types/media";

function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return "TBA";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface CastAndRecommendationsProps {
  mediaId: string;
  mediaType: "movie" | "tv";
  displayTitle: string;
  details: MovieDetails | TvDetails | null;
  recommendations: MediaItem[];
  onScrollToPlayer: () => void;
}

export function CastAndRecommendations({
  mediaId,
  mediaType,
  displayTitle,
  details,
  recommendations,
  onScrollToPlayer,
}: CastAndRecommendationsProps) {
  return (
    <>
      {/* ─── Content Advisory Widget ─── */}
      <ContentGuideWidget
        mediaId={mediaId}
        mediaType={mediaType === "tv" ? "tv" : "movie"}
        title={displayTitle}
      />

      {/* ─── Production Studios & Streaming Networks Hub ─── */}
      <StudioNetworksHub
        productionCompanies={details?.production_companies}
        networks={details && "networks" in details ? (details as TvDetails).networks : undefined}
        mediaType={mediaType === "tv" ? "tv" : "movie"}
      />

      {/* ─── Where to Watch Hub ─── */}
      <WhereToWatchHub
        mediaId={mediaId}
        mediaType={mediaType === "tv" ? "tv" : "movie"}
        title={displayTitle}
      />

      {/* ─── Starring Cast ─── */}
      {details?.credits?.cast && details.credits.cast.length > 0 && (
        <section className="rounded-2xl bg-[#18191a] p-5 space-y-3.5 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-white">Starring Cast</h3>
            <span className="text-[11px] font-mono text-zinc-400">
              {details.credits.cast.length} Cast Members
            </span>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-20 bg-gradient-to-l from-[#18191a] via-[#18191a]/80 to-transparent z-10" />

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
              {details.credits.cast.map((actor, idx) => (
                <Link
                  key={`${actor.id}_${idx}`}
                  href={`/person/${actor.id}`}
                  onClick={() => audioFX.playClick()}
                  className="flex-none w-20 text-center cursor-pointer group block"
                >
                  <div className="relative h-20 w-20 rounded-full overflow-hidden border border-zinc-700/80 mx-auto group-hover:border-white transition-colors shadow-sm bg-zinc-900">
                    <SmartImage
                      src={
                        actor.profile_path
                          ? `${TMDB_IMAGE_CONFIG.PROFILE_BASE}${actor.profile_path.startsWith("/") ? "" : "/"}${actor.profile_path}`
                          : TMDB_IMAGE_CONFIG.FALLBACK_AVATAR
                      }
                      alt={actor.name}
                      fallbackType="avatar"
                      containerClassName="h-full w-full"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="text-[11px] font-bold text-white truncate mt-2 group-hover:text-white transition-colors">
                    {actor.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">
                    {actor.character || "Cast"}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Franchise Collection (Spider-Man Collection, Avengers, etc.) ─── */}
      {details && "collection" in details && details.collection && details.collection.parts && details.collection.parts.length > 0 && (
        <section className="rounded-2xl bg-gradient-to-b from-[#1c1d1e] to-[#141414] p-5 space-y-3.5 border border-zinc-800/80 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0">
              <h2 className="font-heading text-sm sm:text-base font-bold text-white flex items-center gap-2 truncate">
                <Film className="h-4 w-4 text-[#E50914] shrink-0" />
                <span className="truncate">{details.collection.name}</span>
              </h2>
              {details.collection.overview && (
                <p className="text-[11px] text-zinc-400 line-clamp-1 max-w-2xl">
                  {details.collection.overview}
                </p>
              )}
            </div>
            <span className="text-[11px] font-mono text-zinc-300 shrink-0 bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/60 font-semibold">
              {details.collection.parts.length} Franchise Films
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {details.collection.parts.map((part, idx) => {
              const isCurrent = String(part.id) === String(mediaId);
              const partPoster = part.poster_path
                ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${part.poster_path.startsWith("/") ? "" : "/"}${part.poster_path}`
                : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

              return (
                <Link
                  key={`${part.id}_${idx}`}
                  href={`/watch/${part.id}?type=movie`}
                  onClick={() => {
                    audioFX.playClick();
                    onScrollToPlayer();
                  }}
                  className={`group relative block rounded-xl overflow-hidden border transition-all ${
                    isCurrent
                      ? "border-[#E50914] bg-[#242526] ring-2 ring-[#E50914] shadow-lg shadow-red-950/30"
                      : "border-zinc-700/80 bg-[#242526] hover:bg-[#3a3b3c] hover:border-zinc-400"
                  }`}
                >
                  <div className="relative aspect-[2/3] w-full bg-zinc-900">
                    <SmartImage
                      src={partPoster}
                      alt={part.title || ""}
                      fallbackType="poster"
                      containerClassName="h-full w-full"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950 shadow-md">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    {isCurrent ? (
                      <span className="absolute top-1.5 left-1.5 rounded bg-[#E50914] text-white px-2 py-0.5 text-[9px] font-black uppercase font-mono shadow-md flex items-center gap-1">
                        <Play className="h-2.5 w-2.5 fill-current animate-pulse" /> Playing
                      </span>
                    ) : (part.vote_average ?? 0) > 0 ? (
                      <span className="absolute top-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-white/10">
                        ★ {(part.vote_average ?? 0).toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-2.5">
                    <div
                      className={`text-xs font-bold truncate transition-colors ${
                        isCurrent ? "text-[#E50914] font-extrabold" : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {part.title}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {formatYear(part.release_date)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── More Like This (Recommendations) ─── */}
      {recommendations.length > 0 && (
        <section className="rounded-2xl bg-[#18191a] p-5 space-y-3.5 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-zinc-400" />
              <span>
                {mediaType === "tv" ? "More Series Like This" : "More Films Like This"}
              </span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-400">
              {recommendations.length} titles
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recommendations.map((rec, idx) => {
              const recType = rec.media_type || mediaType;
              const isCurrentRec = String(rec.id) === String(mediaId);
              const recPoster = rec.poster_path
                ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${rec.poster_path.startsWith("/") ? "" : "/"}${rec.poster_path}`
                : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;
              return (
                <Link
                  key={`${rec.id}_${idx}`}
                  href={`/watch/${rec.id}?type=${recType}`}
                  onClick={() => {
                    audioFX.playClick();
                    onScrollToPlayer();
                  }}
                  className={`group relative block rounded-xl overflow-hidden border transition-all ${
                    isCurrentRec
                      ? "border-[#E50914] bg-[#242526] ring-1 ring-[#E50914]/50 shadow-lg shadow-red-950/20"
                      : "border-zinc-700/80 bg-[#242526] hover:bg-[#3a3b3c] hover:border-zinc-500"
                  }`}
                >
                  <div className="relative aspect-[2/3] w-full bg-zinc-900">
                    <SmartImage
                      src={recPoster}
                      alt={rec.title || rec.name || ""}
                      fallbackType="poster"
                      containerClassName="h-full w-full"
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950 shadow-md">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </div>
                    </div>
                    {isCurrentRec ? (
                      <span className="absolute top-1.5 left-1.5 rounded bg-[#E50914] text-white px-1.5 py-0.5 text-[9px] font-black uppercase font-mono shadow-md flex items-center gap-1">
                        <Play className="h-2.5 w-2.5 fill-current animate-pulse" /> Playing
                      </span>
                    ) : (rec.vote_average ?? 0) > 0 ? (
                      <span className="absolute top-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-white/10">
                        ★ {(rec.vote_average ?? 0).toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <div className="p-2.5">
                    <div
                      className={`text-xs font-bold truncate transition-colors ${
                        isCurrentRec ? "text-white font-extrabold" : "text-zinc-200"
                      }`}
                    >
                      {rec.title || rec.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {formatYear(rec.release_date || rec.first_air_date)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Release Schedule & Broadcast Timeline ─── */}
      <section className="rounded-2xl bg-[#18191a] p-5 space-y-4 border border-zinc-800/80">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#242526] border border-zinc-700/80 flex items-center justify-center text-zinc-300 shadow-sm">
              <Calendar className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-white flex items-center gap-2">
                Release Schedule &amp; Broadcast Timeline
              </h2>
              <p className="text-[11px] text-zinc-400">
                Official broadcast milestones and episode schedule
              </p>
            </div>
          </div>

          {/* Production / Broadcast Status Badge */}
          {details?.status && (
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${
                details.status === "Returning Series" || details.status === "In Production"
                  ? "bg-white/10 text-white border-white/20"
                  : details.status === "Ended" || details.status === "Canceled"
                  ? "bg-zinc-800 text-zinc-400 border-zinc-700"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              ● {details.status}
            </span>
          )}
        </div>

        {/* Schedule Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Premiere Date */}
          <div className="rounded-xl bg-[#242526] border border-zinc-700/80 p-3.5 space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Calendar className="h-3 w-3 text-zinc-400" /> Premiere Date
            </div>
            <div className="text-xs font-bold text-white font-mono">
              {formatDateOnly(details?.first_air_date || details?.release_date)}
            </div>
            <div className="text-[10px] text-zinc-400">
              {details?.first_air_date ? "First Official TV Broadcast" : "Theatrical / Digital Debut"}
            </div>
          </div>

          {/* 2. Latest Episode / Release */}
          <div className="rounded-xl bg-[#242526] border border-zinc-700/80 p-3.5 space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-zinc-400" /> Latest Broadcast
            </div>
            <div className="text-xs font-bold text-white font-mono truncate">
              {details && "last_episode_to_air" in details && details.last_episode_to_air?.air_date
                ? formatDateOnly(details.last_episode_to_air.air_date)
                : details && "last_air_date" in details && details.last_air_date
                ? formatDateOnly(details.last_air_date)
                : formatDateOnly(details?.release_date)}
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {details && "last_episode_to_air" in details && details.last_episode_to_air?.name
                ? `S${details.last_episode_to_air.season_number}E${details.last_episode_to_air.episode_number}: ${details.last_episode_to_air.name}`
                : "Worldwide Digital Release"}
            </div>
          </div>

          {/* 3. Next Airing Target */}
          <div className="rounded-xl bg-[#242526] border border-zinc-700/80 p-3.5 space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-zinc-400" /> Next Airing Target
            </div>
            <div className="text-xs font-bold text-white font-mono truncate">
              {details && "next_episode_to_air" in details && details.next_episode_to_air?.air_date
                ? formatDateOnly(details.next_episode_to_air.air_date)
                : details?.status === "Returning Series"
                ? "Next Season TBA"
                : details?.status === "Ended"
                ? "Series Complete"
                : "Available Now"}
            </div>
            <div className="text-[10px] text-zinc-400 truncate">
              {details && "next_episode_to_air" in details && details.next_episode_to_air?.name
                ? `S${details.next_episode_to_air.season_number}E${details.next_episode_to_air.episode_number}: ${details.next_episode_to_air.name}`
                : details?.status === "Ended"
                ? "All Episodes Live"
                : "Streaming On Demand"}
            </div>
          </div>

          {/* 4. Network / Studio Broadcast */}
          <div className="rounded-xl bg-[#242526] border border-zinc-700/80 p-3.5 space-y-1">
            <div className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1.5">
              <Tv className="h-3 w-3 text-zinc-400" /> Network / Studio
            </div>
            <div className="text-xs font-bold text-white truncate">
              {details && "networks" in details && (details as TvDetails).networks?.length
                ? (details as TvDetails).networks?.map((n) => n.name).join(", ")
                : details?.production_companies?.[0]?.name || "Universal Studio"}
            </div>
            <div className="text-[10px] text-zinc-400">
              {mediaType === "tv" ? "Primary Television Network" : "Original Production Studio"}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
