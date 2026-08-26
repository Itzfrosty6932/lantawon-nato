"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Film, Video, X, Play, Loader2 } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface TrailerModalProps {
  mediaId: string | number | null;
  mediaType?: string;
  title?: string;
  year?: string;
  onClose: () => void;
}

export function TrailerModal({
  mediaId,
  mediaType = "movie",
  title = "Official Trailer",
  year = "",
  onClose,
}: TrailerModalProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mediaId) return;

    let isMounted = true;
    setIsLoading(true);
    setTrailerKey(null);

    const fetchTrailer = async () => {
      try {
        const res = await fetch(`/api/${mediaType === "tv" ? "series" : "movies"}/${mediaId}`);
        if (res.ok) {
          const data = await res.json();
          const videos = data.videos?.results || [];
          const officialTrailer = videos.find(
            (v: { site: string; type: string; key: string }) =>
              v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
          );
          if (isMounted) {
            setTrailerKey(officialTrailer?.key || (videos[0]?.key ?? null));
            setIsLoading(false);
          }
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchTrailer();
    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType]);

  if (!mediaId) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl rounded-2xl border border-white/10 bg-zinc-950 shadow-modal overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-2.5 font-heading text-base font-bold text-white">
            <Video className="h-5 w-5 text-rose-500" />
            <span>{title}</span>
            {year && (
              <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-zinc-400">
                {year}
              </span>
            )}
          </div>
          <button
            onClick={() => {
              audioFX.playClick();
              onClose();
            }}
            className="rounded-lg p-1 text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Player Box */}
        <div className="relative aspect-video w-full bg-black">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">Fetching official HD trailer...</span>
            </div>
          )}

          {!isLoading && trailerKey ? (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&playsinline=1`}
              title={title}
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-none"
            />
          ) : !isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400 p-6 text-center">
              <span className="text-base font-semibold text-white">Trailer Unavailable</span>
              <p className="text-xs text-zinc-500">No public official trailer video was found for this title.</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t border-white/[0.08] bg-zinc-950">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Film className="h-4 w-4 text-[#E50914]" />
            <span className="capitalize">{mediaType} Preview</span>
          </div>
          <Link
            href={`/watch/${mediaId}?type=${mediaType}`}
            onClick={() => {
              audioFX.playClick();
              onClose();
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#E50914] px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-red-600 hover:scale-105 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current ml-0.5" /> Watch Full Title
          </Link>
        </div>
      </div>
    </div>
  );
}
