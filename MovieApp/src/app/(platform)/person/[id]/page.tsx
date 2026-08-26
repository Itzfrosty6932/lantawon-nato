"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Film,
  Tv,
  Clapperboard,
  Star,
  Calendar,
  MapPin,
  Sparkles,
  ArrowLeft,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { formatYear } from "@/lib/utils/formatters";
import { audioFX } from "@/lib/audio/audio-fx";
import { MediaCard } from "@/components/movie/MediaCard";
import { useAppModals } from "@/components/layout/AppShell";
import type { PersonDetails, MediaItem } from "@/types/media";

type FilmographyFilter = "all" | "movie" | "tv" | "crew";
type FilmographySort = "popularity.desc" | "vote_average.desc" | "release_date.desc" | "release_date.asc" | "title.asc";

export default function PersonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const personId = params?.id as string;
  const { openTrailer } = useAppModals();

  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilmographyFilter>("all");
  const [sortBy, setSortBy] = useState<FilmographySort>("popularity.desc");

  useEffect(() => {
    if (!personId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchPerson = async () => {
      try {
        const res = await fetch(`/api/person/${personId}`);
        if (!res.ok) {
          throw new Error("Failed to load creator profile");
        }
        const data = await res.json();
        if (isMounted) {
          setPerson(data);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to load creator profile");
          setIsLoading(false);
        }
      }
    };

    fetchPerson();
    return () => {
      isMounted = false;
    };
  }, [personId]);

  // Derived credits list based on active filter and sorting
  const { filteredCredits, stats } = useMemo(() => {
    if (!person || !person.combined_credits) {
      return {
        filteredCredits: [],
        stats: { all: 0, movies: 0, tv: 0, crew: 0, topRating: 0, startYear: 0, endYear: 0 },
      };
    }

    const rawCast = (person.combined_credits.cast || []).map((item) => ({
      ...item,
      media_type: (item.media_type || (item.title ? "movie" : "tv")) as "movie" | "tv",
      title: item.title || item.name || "Untitled",
    }));

    const rawCrew = (person.combined_credits.crew || []).map((item) => ({
      ...item,
      media_type: (item.media_type || (item.title ? "movie" : "tv")) as "movie" | "tv",
      title: item.title || item.name || "Untitled",
    }));

    // Deduplicate by media_type and id
    const dedupe = (list: MediaItem[]) => {
      const seen = new Set<string>();
      return list.filter((i) => {
        const key = `${i.media_type}_${i.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const uniqueCast = dedupe(rawCast);
    const uniqueCrew = dedupe(rawCrew);

    const moviesList = uniqueCast.filter((i) => i.media_type === "movie");
    const tvList = uniqueCast.filter((i) => i.media_type === "tv");

    // Calculate career statistics
    const allWorks = dedupe([...uniqueCast, ...uniqueCrew]);
    let topRating = 0;
    let minYear = 9999;
    let maxYear = 0;

    allWorks.forEach((item) => {
      const rating = Number(item.vote_average || 0);
      if (rating > topRating && (item.vote_count || 0) > 10) {
        topRating = rating;
      }
      const yStr = (item.release_date || item.first_air_date || "").split("-")[0];
      const y = parseInt(yStr, 10);
      if (!isNaN(y) && y > 1900 && y < 2050) {
        if (y < minYear) minYear = y;
        if (y > maxYear) maxYear = y;
      }
    });

    let activeList: MediaItem[] = [];
    if (activeFilter === "all") activeList = uniqueCast;
    else if (activeFilter === "movie") activeList = moviesList;
    else if (activeFilter === "tv") activeList = tvList;
    else if (activeFilter === "crew") activeList = uniqueCrew;

    // Apply sorting
    const sorted = [...activeList].sort((a, b) => {
      if (sortBy === "popularity.desc") {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      if (sortBy === "vote_average.desc") {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      if (sortBy === "release_date.desc") {
        const dateA = a.release_date || a.first_air_date || "0000";
        const dateB = b.release_date || b.first_air_date || "0000";
        return dateB.localeCompare(dateA);
      }
      if (sortBy === "release_date.asc") {
        const dateA = a.release_date || a.first_air_date || "9999";
        const dateB = b.release_date || b.first_air_date || "9999";
        return dateA.localeCompare(dateB);
      }
      if (sortBy === "title.asc") {
        const titleA = (a.title || a.name || "").toLowerCase();
        const titleB = (b.title || b.name || "").toLowerCase();
        return titleA.localeCompare(titleB);
      }
      return 0;
    });

    return {
      filteredCredits: sorted,
      stats: {
        all: uniqueCast.length,
        movies: moviesList.length,
        tv: tvList.length,
        crew: uniqueCrew.length,
        topRating,
        startYear: minYear === 9999 ? 0 : minYear,
        endYear: maxYear === 0 ? 0 : maxYear,
      },
    };
  }, [person, activeFilter, sortBy]);

  // Calculate age
  const age = useMemo(() => {
    if (!person?.birthday) return null;
    const birth = new Date(person.birthday);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      years--;
    }
    return years > 0 ? years : null;
  }, [person?.birthday]);

  if (isLoading) {
    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-4 text-zinc-400">
        <Loader2 className="h-10 w-10 animate-spin text-[#E50914]" />
        <p className="font-mono text-sm">Loading Actor & Creator Profile...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center p-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-white/10 text-rose-400">
          <User className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Creator Profile Not Found</h2>
        <p className="text-sm text-zinc-400 max-w-md">
          {error || "We couldn't retrieve the filmography details for this person."}
        </p>
        <button
          onClick={() => router.push("/discover")}
          className="mt-2 rounded-xl bg-[#E50914] px-4 py-2 text-xs font-bold text-white hover:bg-red-600 transition-colors shadow-lg shadow-[#E50914]/20"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  const profileImg = person.profile_path
    ? `${TMDB_IMAGE_CONFIG.PROFILE_BASE}${person.profile_path}`
    : TMDB_IMAGE_CONFIG.FALLBACK_AVATAR;

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* ─── Top Breadcrumb Navigation ─── */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <button
          onClick={() => {
            audioFX.playClick();
            router.back();
          }}
          className="flex items-center gap-1 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span>/</span>
        <Link href="/discover" className="hover:text-white transition-colors">
          Discover
        </Link>
        <span>/</span>
        <span className="text-white font-semibold truncate">{person.name}</span>
      </div>

      {/* ─── Actor Profile Banner & Bio Card ─── */}
      <div className="relative overflow-hidden rounded-2xl ui-surface border border-white/[0.08] p-6 sm:p-8">
        {/* Subtle Ambient Glow */}
        <div
          className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-red-600/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start relative z-10">
          {/* Portrait Image */}
          <div className="relative group shrink-0 mx-auto md:mx-0">
            <div className="w-40 sm:w-48 aspect-[2/3] rounded-2xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl">
              <SmartImage
                src={profileImg}
                alt={person.name}
                fallbackType="avatar"
                containerClassName="h-full w-full"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="absolute top-2 left-2 rounded-md bg-zinc-950/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 backdrop-blur-md z-10">
              {person.known_for_department || "Actor"}
            </div>
          </div>

          {/* Bio & Details */}
          <div className="flex-1 min-w-0 space-y-4 text-left">
            <div>
              <h1 className="font-heading text-2xl sm:text-4xl font-black text-white tracking-tight">
                {person.name}
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-zinc-400 mt-1">
                Known for: <span className="text-zinc-200">{person.known_for_department || "Acting & Cinema Production"}</span>
              </p>
            </div>

            {/* Quick Metadata Badges */}
            <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
              {person.birthday && (
                <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/90 border border-white/10 px-3 py-1.5 font-mono text-[11px]">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  <span>
                    Born {person.birthday} {age ? `(Age ${age})` : ""}
                  </span>
                </div>
              )}

              {person.place_of_birth && (
                <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/90 border border-white/10 px-3 py-1.5 text-[11px]">
                  <MapPin className="h-3.5 w-3.5 text-rose-400" />
                  <span>{person.place_of_birth}</span>
                </div>
              )}

              {stats.topRating > 0 && (
                <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-[11px] font-bold text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>Top Rated: ★ {stats.topRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Biography */}
            {person.biography ? (
              <div className="space-y-2">
                <p
                  className={`text-xs sm:text-sm text-zinc-300 leading-relaxed ${
                    !isBioExpanded ? "line-clamp-4" : ""
                  }`}
                >
                  {person.biography}
                </p>
                {person.biography.length > 280 && (
                  <button
                    onClick={() => {
                      audioFX.playClick();
                      setIsBioExpanded((p) => !p);
                    }}
                    className="text-xs font-bold text-[#E50914] hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <span>{isBioExpanded ? "Read Less" : "Read Full Biography"}</span>
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${isBioExpanded ? "rotate-180" : ""}`}
                    />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">No biography available for this creator.</p>
            )}

            {/* Quick Career Stats Shelf */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.08]">
              <div className="rounded-xl bg-zinc-900/50 border border-white/5 p-2.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Total Credits</div>
                <div className="text-lg font-black text-white font-mono">{stats.all}</div>
              </div>
              <div className="rounded-xl bg-zinc-900/50 border border-white/5 p-2.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Movies</div>
                <div className="text-lg font-black text-white font-mono">{stats.movies}</div>
              </div>
              <div className="rounded-xl bg-zinc-900/50 border border-white/5 p-2.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400">TV Series</div>
                <div className="text-lg font-black text-amber-400 font-mono">{stats.tv}</div>
              </div>
              <div className="rounded-xl bg-zinc-900/50 border border-white/5 p-2.5">
                <div className="text-[10px] uppercase font-bold text-zinc-400">Career Span</div>
                <div className="text-xs font-bold text-zinc-300 font-mono mt-1">
                  {stats.startYear && stats.endYear ? `${stats.startYear} – ${stats.endYear}` : "Active"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Filmography Catalog Section ─── */}
      <div className="space-y-4">
        {/* Controls Bar: Filter Tabs & Sorting */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              onClick={() => {
                audioFX.playClick();
                setActiveFilter("all");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                activeFilter === "all"
                  ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/25"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>All Works ({stats.all})</span>
            </button>

            <button
              onClick={() => {
                audioFX.playClick();
                setActiveFilter("movie");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                activeFilter === "movie"
                  ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/25"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>Movies ({stats.movies})</span>
            </button>

            <button
              onClick={() => {
                audioFX.playClick();
                setActiveFilter("tv");
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                activeFilter === "tv"
                  ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/25"
                  : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Series ({stats.tv})</span>
            </button>

            {stats.crew > 0 && (
              <button
                onClick={() => {
                  audioFX.playClick();
                  setActiveFilter("crew");
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                  activeFilter === "crew"
                    ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/25"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-white/5"
                }`}
              >
                <Clapperboard className="h-3.5 w-3.5" />
                <span>Crew & Directing ({stats.crew})</span>
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-[11px] font-bold text-zinc-400 flex items-center gap-1">
              <SlidersHorizontal className="h-3 w-3 text-[#E50914]" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                audioFX.playPop();
                setSortBy(e.target.value as FilmographySort);
              }}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-1.5 text-xs font-bold text-zinc-200 outline-none hover:border-[#E50914]/40 focus:border-[#E50914] transition-colors"
            >
              <option value="popularity.desc">Most Popular</option>
              <option value="vote_average.desc">Highest Rated</option>
              <option value="release_date.desc">Release Date (Newest)</option>
              <option value="release_date.asc">Release Date (Oldest)</option>
              <option value="title.asc">Title (A → Z)</option>
            </select>
          </div>
        </div>

        {/* Media Grid */}
        {filteredCredits.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredCredits.map((item, idx) => (
              <div key={`${item.id}_${item.media_type}_${idx}`} className="flex flex-col">
                <MediaCard item={item} onOpenTrailer={openTrailer} />
                {item.character && (
                  <span className="text-[10px] text-zinc-400 truncate mt-1 text-center italic">
                    as {item.character}
                  </span>
                )}
                {item.job && (
                  <span className="text-[10px] text-red-400 truncate mt-1 text-center font-semibold">
                    {item.job}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400">
            <Film className="h-10 w-10 text-zinc-600 mb-2" />
            <p className="text-sm font-semibold">No titles found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
