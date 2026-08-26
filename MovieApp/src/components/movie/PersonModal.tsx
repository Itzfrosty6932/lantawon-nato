"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, X, Star, Calendar, Loader2 } from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatYear } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import type { PersonDetails } from "@/types/media";

interface PersonModalProps {
  personId: string | number | null;
  onClose: () => void;
}

export function PersonModal({ personId, onClose }: PersonModalProps) {
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!personId) return;

    let isMounted = true;
    setIsLoading(true);
    setPerson(null);

    const fetchPerson = async () => {
      try {
        const res = await fetch(`/api/person/${personId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPerson(data);
            setIsLoading(false);
          }
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPerson();
    return () => {
      isMounted = false;
    };
  }, [personId]);

  if (!personId) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-950 shadow-modal overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-2 font-heading font-bold text-white text-base">
            <User className="h-5 w-5 text-primary" /> Creator & Actor Filmography
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>Exploring creator filmography...</span>
            </div>
          )}

          {!isLoading && person && (
            <div className="space-y-6">
              {/* Bio Header */}
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <SmartImage
                  src={
                    person.profile_path
                      ? `${TMDB_IMAGE_CONFIG.PROFILE_BASE}${person.profile_path}`
                      : TMDB_IMAGE_CONFIG.FALLBACK_AVATAR
                  }
                  alt={person.name}
                  fallbackType="avatar"
                  containerClassName="w-24 h-32 rounded-xl border border-white/10 shrink-0"
                  className="h-full w-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="font-heading text-xl font-extrabold text-white">{person.name}</h2>
                  <div className="text-xs text-zinc-400 mt-1 flex flex-wrap gap-3">
                    {person.known_for_department && <span>Role: {person.known_for_department}</span>}
                    {person.birthday && <span>Born: {person.birthday}</span>}
                    {person.place_of_birth && <span>Origin: {person.place_of_birth}</span>}
                  </div>
                  {person.biography && (
                    <p className="mt-3 text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                      {person.biography}
                    </p>
                  )}
                </div>
              </div>

              {/* Notable Filmography Grid */}
              <div>
                <h3 className="font-heading text-sm font-bold text-white mb-3">
                  Notable Works ({person.combined_credits?.cast?.length || 0})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(person.combined_credits?.cast || []).slice(0, 12).map((item, idx) => {
                    const poster = item.poster_path
                      ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.poster_path}`
                      : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;
                    const year = formatYear(item.release_date || item.first_air_date);
                    const itemType = item.media_type || (item.title ? "movie" : "tv");

                    return (
                      <Link
                        key={`${item.id}_${item.character || ""}_${idx}`}
                        href={`/watch/${item.id}?type=${itemType}`}
                        onClick={() => {
                          audioFX.playClick();
                          onClose();
                        }}
                        className="rounded-xl glass-card overflow-hidden group block"
                      >
                        <div className="aspect-[2/3] w-full bg-zinc-900 overflow-hidden">
                          <SmartImage
                            src={poster}
                            alt={item.title || item.name || "Title"}
                            fallbackType="poster"
                            containerClassName="h-full w-full"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                            {item.title || item.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center justify-between mt-1">
                            <span>{year}</span>
                            {item.vote_average > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                                <Star className="h-2.5 w-2.5 fill-current" />
                                {item.vote_average.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
