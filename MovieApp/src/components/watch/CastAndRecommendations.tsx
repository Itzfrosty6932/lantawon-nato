"use client";

import React from "react";
import Link from "next/link";
import {
  Star,
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
  // Studio / Network or Production Creator
  const creatorName =
    details && "networks" in details && details.networks && details.networks.length > 0
      ? details.networks.map((n) => n.name).join(", ")
      : details?.production_companies && details.production_companies.length > 0
      ? details.production_companies.map((p) => p.name).slice(0, 2).join(", ")
      : null;

  return (
    <div className="space-y-12 select-none">
      {/* ─── 1. "ABOUT" & CAST SECTION ─── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
          <div>
            <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
              About {displayTitle}
            </h2>
            {creatorName && (
              <p className="text-xs text-zinc-400 font-medium">
                Created / Directed by <span className="text-zinc-200">{creatorName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Starring Cast Avatars Row */}
        {details?.credits?.cast && details.credits.cast.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-mono font-bold tracking-wider text-zinc-400 uppercase">
              Cast
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none scroll-smooth">
              {details.credits.cast.map((actor, idx) => {
                const initials = actor.name
                  ? actor.name
                      .trim()
                      .split(/\s+/)
                      .map((w) => w[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "??";

                return (
                  <Link
                    key={`${actor.id}_${idx}`}
                    href={`/person/${actor.id}`}
                    onClick={() => audioFX.playClick()}
                    className="flex-none w-28 sm:w-36 md:w-40 text-left cursor-pointer group block"
                  >
                    <div className="relative aspect-[3/4] w-28 sm:w-36 md:w-40 rounded-lg overflow-hidden border border-white/10 group-hover:border-white/40 transition-colors shadow-md bg-[#121316]">
                      {actor.profile_path ? (
                        <SmartImage
                          src={`${TMDB_IMAGE_CONFIG.PROFILE_BASE}${actor.profile_path.startsWith("/") ? "" : "/"}${actor.profile_path}`}
                          alt={actor.name}
                          fallbackType="avatar"
                          containerClassName="h-full w-full"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1c1d22] via-[#131417] to-[#0a0b0e] relative overflow-hidden group-hover:scale-105 transition-transform duration-300 p-3 select-none">
                          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center shadow-inner">
                            <span className="font-mono text-base sm:text-lg font-black text-zinc-200 tracking-wider">
                              {initials}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2.5">
                            Artist
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-white truncate mt-2 group-hover:text-zinc-200 transition-colors">
                      {actor.name}
                    </div>
                    <div className="text-[11px] text-zinc-400 truncate">
                      {actor.character || "Cast"}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ─── 2. CONTENT ADVISORY & PARENTS GUIDE ─── */}
      <ContentGuideWidget
        mediaId={mediaId}
        mediaType={mediaType === "tv" ? "tv" : "movie"}
        title={displayTitle}
      />

      {/* ─── 3. COLLECTIONS / FRANCHISE SERIES ─── */}
      {details && "collection" in details && details.collection && details.collection.parts && details.collection.parts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                {details.collection.name}
              </h2>
              <p className="text-xs text-zinc-400">
                {details.collection.parts.length} Franchise Films
              </p>
            </div>
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
                  className={`group relative block rounded-2xl overflow-hidden border transition-all ${
                    isCurrent
                      ? "border-[#E50914] bg-[#242526] ring-2 ring-[#E50914] shadow-lg shadow-red-950/30"
                      : "border-white/5 bg-zinc-900/40 hover:bg-zinc-900 hover:border-white/20"
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
                    {isCurrent && (
                      <span className="absolute top-1.5 left-1.5 rounded bg-[#E50914] text-white px-2 py-0.5 text-[9px] font-black uppercase font-mono shadow-md flex items-center gap-1">
                        <Play className="h-2.5 w-2.5 fill-current animate-pulse" /> Playing
                      </span>
                    )}
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

      {/* ─── 4. STUDIO & BROADCASTER NETWORKS ─── */}
      <StudioNetworksHub
        productionCompanies={details?.production_companies}
        networks={details && "networks" in details ? (details as TvDetails).networks : undefined}
        mediaType={mediaType === "tv" ? "tv" : "movie"}
      />

      {/* ─── 5. WATCHSTREAMS (WHERE TO WATCH / STREAMING PROVIDERS) ─── */}
      <WhereToWatchHub
        mediaId={mediaId}
        mediaType={mediaType === "tv" ? "tv" : "movie"}
        title={displayTitle}
      />

      {/* ─── 6. "YOU MAY LIKE" RECOMMENDATIONS GRID ─── */}
      {recommendations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
            <div>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-white tracking-tight">
                You may like
              </h2>
              <p className="text-xs text-zinc-400">More titles like this one</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {recommendations.map((rec, idx) => {
              const recType = rec.media_type || mediaType;
              const isCurrentRec = String(rec.id) === String(mediaId);

              const imgPath = rec.backdrop_path || rec.poster_path;
              const recThumb = imgPath
                ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${imgPath.startsWith("/") ? "" : "/"}${imgPath}`
                : TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP;

              const recTitle = rec.title || rec.name || "Untitled";
              const recYear = formatYear(rec.release_date || rec.first_air_date) || "2025";
              const recRating = rec.vote_average ? Number(rec.vote_average).toFixed(1) : "6.8";
              const recTypeLabel = recType === "tv" ? "TV Show" : "Movie";

              return (
                <Link
                  key={`${rec.id}_${idx}`}
                  href={`/watch/${rec.id}?type=${recType}`}
                  onClick={() => {
                    audioFX.playClick();
                    onScrollToPlayer();
                  }}
                  className={`group relative block rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${
                    isCurrentRec
                      ? "ring-2 ring-[#E50914] shadow-lg shadow-red-950/30"
                      : "hover:scale-[1.02]"
                  }`}
                >
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-white/30 transition-colors">
                    <SmartImage
                      src={recThumb}
                      alt={recTitle}
                      fallbackType="backdrop"
                      containerClassName="h-full w-full"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="h-10 w-10 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg">
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      </div>
                    </div>

                    {isCurrentRec && (
                      <span className="absolute top-2 left-2 rounded-md bg-[#E50914] text-white px-2 py-0.5 text-[9px] font-black uppercase font-mono shadow-md flex items-center gap-1">
                        <Play className="h-2.5 w-2.5 fill-current animate-pulse" /> Playing
                      </span>
                    )}
                  </div>

                  <div className="pt-2.5 px-1 space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-zinc-200 transition-colors">
                      {recTitle}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400">
                      <span className="flex items-center gap-0.5 text-[#E50914] font-bold">
                        <Star className="h-3 w-3 fill-current" />
                        <span>{recRating}</span>
                      </span>
                      <span>·</span>
                      <span className="font-mono">{recYear}</span>
                      <span>·</span>
                      <span>{recTypeLabel}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
