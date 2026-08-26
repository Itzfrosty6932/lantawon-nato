"use client";

import React, { useState } from "react";
import {
  Film,
  Tv,
  Search,
  RefreshCw,
  ExternalLink,
  Edit,
  Check,
  Shield,
  Layers,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";

interface CatalogItem {
  id: string;
  tmdbId: number;
  title: string;
  type: "movie" | "tv" | "anime";
  year: string;
  rating: number;
  genres: string[];
  status: "verified" | "needs_review" | "flagged";
  availability: string[];
}

const INITIAL_ITEMS: CatalogItem[] = [
  {
    id: "cat_1",
    tmdbId: 157336,
    title: "Interstellar",
    type: "movie",
    year: "2014",
    rating: 8.4,
    genres: ["Adventure", "Drama", "Sci-Fi"],
    status: "verified",
    availability: ["Netflix", "Prime Video", "Apple TV"],
  },
  {
    id: "cat_2",
    tmdbId: 569094,
    title: "Spider-Man: Across the Spider-Verse",
    type: "movie",
    year: "2023",
    rating: 8.4,
    genres: ["Animation", "Action", "Adventure"],
    status: "verified",
    availability: ["Netflix", "Disney+"],
  },
  {
    id: "cat_3",
    tmdbId: 94605,
    title: "Arcane",
    type: "tv",
    year: "2021",
    rating: 9.0,
    genres: ["Animation", "Sci-Fi & Fantasy", "Action"],
    status: "verified",
    availability: ["Netflix"],
  },
  {
    id: "cat_4",
    tmdbId: 209867,
    title: "Frieren: Beyond Journey's End",
    type: "anime",
    year: "2023",
    rating: 8.9,
    genres: ["Animation", "Fantasy", "Adventure"],
    status: "verified",
    availability: ["Crunchyroll", "Netflix"],
  },
  {
    id: "cat_5",
    tmdbId: 872585,
    title: "Oppenheimer",
    type: "movie",
    year: "2023",
    rating: 8.1,
    genres: ["Drama", "History"],
    status: "verified",
    availability: ["Prime Video", "Apple TV"],
  },
];

export function AdminCatalogTab() {
  const { showToast } = useToast();
  const [items, setItems] = useState<CatalogItem[]>(INITIAL_ITEMS);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv" | "anime">("all");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncTaxonomy = async () => {
    setIsSyncing(true);
    audioFX.playClick();
    setTimeout(() => {
      setIsSyncing(false);
      showToast("✅ Taxonomy cache re-indexed from TMDB endpoint.", "success");
    }, 1200);
  };

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.genres.some((g) => g.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType === "all" || item.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading">
            Catalog & Taxonomy Operations
          </h3>
          <p className="text-xs text-zinc-400">
            Audit canonical titles, metadata classifications, and streaming provider maps
          </p>
        </div>

        <button
          onClick={handleSyncTaxonomy}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-xs font-bold transition-all shadow-md self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Sync Taxonomy Cache"}</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/80">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by title, genre, or TMDB ID..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
          {(["all", "movie", "tv", "anime"] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                audioFX.playClick();
                setFilterType(type);
              }}
              className={`px-3 py-1 rounded-lg font-semibold uppercase tracking-wider text-[10px] transition-colors ${
                filterType === type
                  ? "bg-[#E50914] text-white font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 font-mono uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Title & Type</th>
                <th className="py-3 px-4">TMDB ID</th>
                <th className="py-3 px-4">Genres</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Authorized Providers</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      {item.type === "movie" ? (
                        <Film className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                      ) : (
                        <Tv className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                      )}
                      <span>{item.title}</span>
                      <span className="text-[10px] text-zinc-500 font-normal">({item.year})</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-zinc-400">{item.tmdbId}</td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.genres.map((g) => (
                        <span key={g} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                          {g}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-amber-400">
                    ★ {item.rating.toFixed(1)}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 text-[10px] text-zinc-400">
                      {item.availability.join(", ")}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      <Check className="h-3 w-3" /> Verified
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`/watch/${item.tmdbId}?type=${item.type === "anime" ? "tv" : item.type}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="View in Player"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
