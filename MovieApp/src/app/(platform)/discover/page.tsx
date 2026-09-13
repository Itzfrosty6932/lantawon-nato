"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X, Loader2, SlidersHorizontal } from "lucide-react";
import { SearchResultsView } from "@/components/search/SearchResultsView";
import { useAppModals } from "@/components/layout/AppShell";
import { audioFX } from "@/lib/audio/audio-fx";
import { DiscoverFilterBar } from "@/components/discover/DiscoverFilterBar";
import type {
  UnifiedSearchResponse,
  SmartRelaxationSuggestion,
} from "@/features/search/engine/types";
import type { MediaItem } from "@/types/media";

const STORAGE_KEY = "lantawon_discover_session_v1";

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openTrailer } = useAppModals();

  // Search input state
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");

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
  const [network, setNetwork] = useState("");
  const [company, setCompany] = useState("");
  const [showFilters, setShowFilters] = useState(true);

  // Search results state
  const [searchResp, setSearchResp] = useState<UnifiedSearchResponse | null>(null);
  const [accumulated, setAccumulated] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounce ref
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // 1. Initial Load & Persistence: Restore from URL params or sessionStorage
  useEffect(() => {
    const hasUrlParams = searchParams && Array.from(searchParams.keys()).length > 0;

    if (hasUrlParams) {
      setQuery(searchParams.get("q") || searchParams.get("query") || "");
      setMediaType(
        searchParams.get("type") ||
          searchParams.get("mediaType") ||
          searchParams.get("media_type") ||
          "all"
      );
      const g = searchParams.get("genre") || searchParams.get("with_genres") || "";
      setGenres(g ? g.split(",").filter(Boolean) : []);
      setSelectedYear(
        searchParams.get("year") || searchParams.get("primary_release_year") || ""
      );
      setSelectedMonth(searchParams.get("month") || "");
      setCountry(searchParams.get("country") || searchParams.get("origin_country") || "ALL");
      setMinRating(searchParams.get("rating") || searchParams.get("minRating") || "");
      setTvStatus(searchParams.get("status") || "");
      setSortBy(searchParams.get("sort_by") || searchParams.get("sort") || "best_match");
      setNetwork(searchParams.get("network") || "");
      setCompany(searchParams.get("company") || "");
      setActiveTab(searchParams.get("tab") || "all");
    } else if (isInitialMount.current) {
      // Restore persisted filter state when navigating back
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.query) setQuery(parsed.query);
          if (parsed.mediaType) setMediaType(parsed.mediaType);
          if (parsed.genres && Array.isArray(parsed.genres)) setGenres(parsed.genres);
          if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
          if (parsed.selectedMonth) setSelectedMonth(parsed.selectedMonth);
          if (parsed.country) setCountry(parsed.country);
          if (parsed.minRating) setMinRating(parsed.minRating);
          if (parsed.tvStatus) setTvStatus(parsed.tvStatus);
          if (parsed.sortBy) setSortBy(parsed.sortBy);
          if (parsed.activeTab) setActiveTab(parsed.activeTab);
          if (typeof parsed.showFilters === "boolean") setShowFilters(parsed.showFilters);
        }
      } catch {}
    }

    isInitialMount.current = false;
  }, [searchParams]);

  // 2. Persist state to sessionStorage whenever filters/query change
  useEffect(() => {
    if (isInitialMount.current) return;
    try {
      const stateToSave = {
        query,
        mediaType,
        genres,
        selectedYear,
        selectedMonth,
        country,
        minRating,
        tvStatus,
        sortBy,
        activeTab,
        showFilters,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {}
  }, [
    query,
    mediaType,
    genres,
    selectedYear,
    selectedMonth,
    country,
    minRating,
    tvStatus,
    sortBy,
    activeTab,
    showFilters,
  ]);

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
        if (minRating) params.set("min_rating", minRating);
        if (tvStatus) params.set("status", tvStatus);
        if (sortBy && sortBy !== "best_match") params.set("sort_by", sortBy);
        if (network) params.set("network", network);
        if (company) params.set("company", company);
        if (activeTab && activeTab !== "all") params.set("tab", activeTab);
        params.set("page", String(page));

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data: UnifiedSearchResponse = await res.json();

        setSearchResp(data);
        setCurrentPage(page);
        setTotalPages(data.totalPages || 1);

        if (append) {
          setAccumulated((prev) => {
            const existingIds = new Set(prev.map((i) => `${i.media_type || "movie"}_${i.id}`));
            const fresh = (data.results || []).filter(
              (i) => !existingIds.has(`${i.media_type || "movie"}_${i.id}`)
            );
            return [...prev, ...fresh];
          });
        } else {
          setAccumulated(data.results || []);
        }
      } catch {
        // Fallback gracefully
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [
      query,
      mediaType,
      genres,
      selectedYear,
      selectedMonth,
      country,
      minRating,
      tvStatus,
      sortBy,
      network,
      company,
      activeTab,
    ]
  );

  // Trigger search on filter / query change (debounced 300ms for query)
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
    setActiveTab(tab);
    if (tab === "movie" || tab === "tv") {
      setMediaType(tab);
    } else if (tab === "all") {
      setMediaType("all");
    }
  };

  const handleClearSearch = () => {
    audioFX.playClick();
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    params.delete("query");
    router.push(`/discover?${params.toString()}`);
  };

  const handleReset = () => {
    audioFX.playClick();
    setQuery("");
    setMediaType("all");
    setGenres([]);
    setSelectedYear("");
    setSelectedMonth("");
    setCountry("ALL");
    setMinRating("");
    setTvStatus("");
    setSortBy("best_match");
    setNetwork("");
    setCompany("");
    setActiveTab("all");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    router.push("/discover");
  };

  const toggleGenre = (genreId: string) => {
    audioFX.playClick();
    setGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
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

  const activeFilterCount =
    (mediaType !== "all" ? 1 : 0) +
    genres.length +
    (selectedYear || selectedMonth ? 1 : 0) +
    (country !== "ALL" ? 1 : 0) +
    (minRating ? 1 : 0) +
    (tvStatus ? 1 : 0) +
    (sortBy !== "best_match" ? 1 : 0);

  const isSearchActive = Boolean(query.trim());

  return (
    <div className="space-y-4 sm:space-y-5 pt-1 pb-24 animate-in fade-in select-none w-full">
      {/* ── 1. Text Section (NASA TAAS) ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-[#E50914] rounded-full shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{isSearchActive ? "Search Catalog" : "Explore & Discover"}</span>
            </h1>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              {isSearchActive
                ? `Results for "${query}" across movies, TV series, anime, studios, and actors.`
                : "Browse the full catalog. Use filters to narrow down your results."}
            </p>
          </div>
        </div>

        {isSearchActive && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            <span>Back to Explorer</span>
          </button>
        )}
      </div>

      {/* ── 2. Search Bar (Left to Middle) + Filter Button (Right) in 1 Sleek Row ── */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows, anime, studios, actors..."
            className="w-full h-11 sm:h-12 rounded-2xl bg-[#141518] border border-white/10 pl-10 sm:pl-12 pr-10 sm:pr-12 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914] transition-all shadow-inner"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-all cursor-pointer"
              title="Clear search and return to catalog"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          ) : null}
        </div>

        {/* Filter Toggle Button (Right Side) */}
        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            setShowFilters((prev) => !prev);
          }}
          className={`h-11 sm:h-12 px-3.5 sm:px-4 rounded-2xl border transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-md active:scale-95 ${
            showFilters || activeFilterCount > 0
              ? "bg-[#E50914] border-[#E50914] text-white font-bold shadow-[#E50914]/20"
              : "bg-[#141518] border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
          }`}
          title={showFilters ? "Hide Filters" : "Show Filters"}
          aria-label="Toggle Filters"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-bold">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-white text-zinc-950 text-[10px] font-black font-mono">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── 3. Filter Bar (Sa Baba ng Search) ── */}
      {showFilters && (
        <div className="animate-in fade-in duration-200">
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
            activeCount={activeFilterCount}
            handleReset={handleReset}
            resultCount={searchResp?.totalResults ?? accumulated.length}
          />
        </div>
      )}

      {/* ── 4. Results Body (Category Tabs & Media Grid) ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
          <Loader2 className="h-7 w-7 animate-spin text-[#E50914]" />
          <span className="text-xs font-medium">Searching full catalog…</span>
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
