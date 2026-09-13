"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import type { MediaItem } from "@/types/media";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";

interface MediaCardProps {
  item: MediaItem;
  priority?: boolean;
}

export function MediaCard({ item }: MediaCardProps) {
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const title = item.title || item.name || "Untitled";
  const year = (item.release_date || item.first_air_date || "").split("-")[0];
  const posterUrl = item.poster_path
    ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.poster_path}`
    : item.backdrop_path
    ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${item.backdrop_path}`
    : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;

  return (
    <Link
      href={`/title/${item.id}?type=${mediaType}`}
      className="group block space-y-2 flex-shrink-0"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-[#E50914]/50 transition-all">
        <SmartImage
          src={posterUrl}
          alt={title}
          fallbackType="poster"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {rating && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-sm flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs font-bold">{rating}</span>
          </div>
        )}
      </div>
      <div className="space-y-1 px-1">
        <h3 className="text-sm font-bold text-white line-clamp-2 group-hover:text-[#E50914] transition-colors">
          {title}
        </h3>
        {year && <p className="text-xs text-zinc-500">{year}</p>}
      </div>
    </Link>
  );
}

interface MediaRowProps {
  title: string;
  items: MediaItem[];
}

export function MediaRow({ title, items }: MediaRowProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-black text-white px-4 sm:px-0">{title}</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 px-4 sm:px-0 scrollbar-hide">
        {items.map((item, index) => (
          <div key={item.id} className="w-[140px] sm:w-[160px] flex-shrink-0">
            <MediaCard item={item} priority={index < 3} />
          </div>
        ))}
      </div>
    </div>
  );
}
