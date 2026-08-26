"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Loader2, Compass } from "lucide-react";
import { SearchResultsView } from "@/components/search/SearchResultsView";
import { useAppModals } from "@/components/layout/AppShell";
import { audioFX } from "@/lib/audio/audio-fx";
import { DiscoverFilterBar } from "@/components/discover/DiscoverFilterBar";
import type {
  UnifiedSearchResponse,
  SmartRelaxationSuggestion,
} from "@/features/search/engine/types";
import type { MediaItem } from "@/types/media";

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openTrailer } = useAppModals();

  // Search input state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "movie" | "tv" | "person">("all");

  // Advanced Filter state
  const [mediaType, setMediaType] = useState("all");
  const [genres, setGenres] = useState<string[]>([]);
  const [isGenreOpen, setIsGenreOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [country, setCountry] = useState("ALL");
  const [minRating, setMinRating] = useState("");
  const [tvStatus, setTvStatus] = useState("");
  const [sortBy, setSortBy] = useState("best_match");

  // Search results state
  const [searchResp, setSearchResp] = useState<UnifiedSearchResponse | null>(null);
  const [accumulated, setAccumulated] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync URL params on initial mount
  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("query") || "";
    if (q) setQuery(q);

    const type = searchParams.get("type") || searchParams.get("mediaType") || "all";
    setMediaType(type);

    const g = searchParams.get("genre") || searchParams.get("with_genres") || "";
    if (g) setGenres(g.split(",").filter(Boolean));

    const y = searchParams.get("year") || searchParams.get("primary_release_year") || "";
    if (y) setSelectedYear(y);

    const m = searchParams.get("month") || "";
    if (m) setSelectedMonth(m);

    const c = searchParams.get("country") || searchParams.get("origin_country") || "ALL";
    setCountry(c);

    const r = searchParams.get("rating") || searchParams.get("minRating") || "";
    setMinRating(r);

    const s = searchParams.get("status") || "";
    setTvStatus(s);

    const sort = searchParams.get("sort_by") || searchParams.get("sort") || "best_match";
    setSortBy(sort);
  }, [searchParams]);

  // Execute unified search query
  const executeSearch = useCallback(
    async (page = 1, append = false) => {
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);

      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (mediaType && mediaType !== "all") params.set("type", mediaType);
        if (genres.length > 0) params.set("genre", genres.join(","));
        if (selectedYear) params.set("year", selectedYear);
        if (selectedMonth) params.set("month", selectedMonth);
        if (country && country !== "ALL") params.set("country", country);
        if (minRating) params.set("rating", minRating);
        if (tvStatus) params.set("status", tvStatus);
        if (sortBy && sortBy !== "best_match") params.set("sort_by", sortBy);
        params.set("page", String(page));

        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data: UnifiedSearchResponse = await res.json();
          setSearchResp(data);

          const results = data.results || [];
          if (append) {
            setAccumulated((prev) => [...prev, ...results]);
          } else {
            setAccumulated(results);
          }

          setCurrentPage(data.page || page);
          setTotalPages(data.totalPages || 1);
        }
      } catch (e) {
        console.error("Discovery search error:", e);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [query, mediaType, genres, selectedYear, selectedMonth, country, minRating, tvStatus, sortBy]
  );

  // Trigger search on filter changes with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      executeSearch(1, false);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [executeSearch]);

  const handleLoadMore = () => {
    if (currentPage < totalPages && !isLoadingMore) {
      executeSearch(currentPage + 1, true);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "all" | "movie" | "tv" | "person");
    if (tab === "movie" || tab === "tv") {
      setMediaType(tab);
    } else if (tab === "all") {
      setMediaType("all");
    }
  };

  const toggleGenre = (gId: string) => {
    audioFX.playClick();
    setGenres((prev) =>
      prev.includes(gId) ? prev.filter((id) => id !== gId) : [...prev, gId]
    );
  };

  const handleReset = () => {
    setQuery("");
    setMediaType("all");
    setGenres([]);
    setSelectedYear("");
    setSelectedMonth("");
    setCountry("ALL");
    setMinRating("");
    setTvStatus("");
    setSortBy("best_match");
  };

  const handleRelaxation = (suggestion: SmartRelaxationSuggestion) => {
    audioFX.playSuccess();
    if (suggestion.action === "clear_genre") setGenres([]);
    else if (suggestion.action === "expand_year") {
      setSelectedYear("");
      setSelectedMonth("");
    } else if (suggestion.action === "include_all_media") setMediaType("all");
    else if (suggestion.action === "lower_rating") setMinRating("");
    else handleReset();
  };

  const activeCount =
    (query ? 1 : 0) +
    (mediaType !== "all" ? 1 : 0) +
    genres.length +
    (selectedYear || selectedMonth ? 1 : 0) +
    (country !== "ALL" ? 1 : 0) +
    (minRating ? 1 : 0) +
    (tvStatus ? 1 : 0) +
    (sortBy !== "best_match" ? 1 : 0);

  const isSearchActive = Boolean(query.trim());

  return (
    <div className="space-y-6 pt-2 pb-24 animate-in fade-in">
      {/* ── Search Hero Input ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, actors, directors, universes (e.g. Nolan, Spider-Man, Anime)..."
          className="w-full h-12 rounded-2xl bg-[#18191a] border border-zinc-700/80 pl-12 pr-12 text-sm text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-all shadow-inner"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Title / Status Bar ── */}
      <div>
        <h1 className="font-heading text-lg sm:text-xl font-black text-white flex items-center gap-2">
          {isSearchActive ? (
            <>
              <Search className="h-5 w-5 text-[#E50914]" />
              <span>Search Catalog</span>
            </>
          ) : (
            <>
              <Compass className="h-5 w-5 text-[#E50914]" />
              <span>Explore &amp; Discover</span>
            </>
          )}
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          {isSearchActive
            ? `Results for "${query}" across all media types.`
            : "Browse the full catalog. Use filters to narrow down your results."}
        </p>
      </div>

      {/* ── Filter Bar Dropdowns ── */}
      <DiscoverFilterBar
        query={query}
        setQuery={setQuery}
        mediaType={mediaType}
        setMediaType={setMediaType}
        genres={genres}
        setGenres={setGenres}
        toggleGenre={toggleGenre}
        isGenreOpen={isGenreOpen}
        setIsGenreOpen={setIsGenreOpen}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        country={country}
        setCountry={setCountry}
        minRating={minRating}
        setMinRating={setMinRating}
        tvStatus={tvStatus}
        setTvStatus={setTvStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        activeCount={activeCount}
        handleReset={handleReset}
      />

      {/* ── Results Body ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
          <Loader2 className="h-7 w-7 animate-spin text-[#E50914]" />
          <span className="text-xs">Searching catalog…</span>
        </div>
      ) : (
        <div className="min-h-0">
          <SearchResultsView
            data={searchResp}
            items={accumulated}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={currentPage < totalPages}
            activeTab={activeTab}
            query={query}
            onTabChange={handleTabChange}
            onLoadMore={handleLoadMore}
            onOpenTrailer={openTrailer}
            onApplyRelaxation={handleRelaxation}
            onSearchOverride={(q) => setQuery(q)}
          />
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 gap-2 text-zinc-600">
          <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
          <span className="text-xs">Loading discovery engine…</span>
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
