"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tv, Radio, ChevronRight } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface NetworkEntry {
  id: number;
  name: string;
  countryCode: string;
  country: string;
  description: string;
  popularShows: string[];
}

const FEATURED_NETWORKS: NetworkEntry[] = [
  {
    id: 49,
    name: "HBO",
    countryCode: "US",
    country: "United States",
    description: "Prestige television network renowned for critically acclaimed drama, miniseries, and storytelling.",
    popularShows: ["Game of Thrones", "Succession", "The Last of Us", "Chernobyl", "House of the Dragon"],
  },
  {
    id: 213,
    name: "Netflix",
    countryCode: "US",
    country: "Worldwide",
    description: "Global streaming pioneer delivering blockbuster original series and international television.",
    popularShows: ["Stranger Things", "Squid Game", "Wednesday", "Money Heist", "The Crown"],
  },
  {
    id: 174,
    name: "AMC",
    countryCode: "US",
    country: "United States",
    description: "Home of groundbreaking serialized television and genre-defining storytelling.",
    popularShows: ["Breaking Bad", "Better Call Saul", "The Walking Dead", "Mad Men"],
  },
  {
    id: 4,
    name: "BBC One",
    countryCode: "UK",
    country: "United Kingdom",
    description: "Flagship British public broadcast network producing acclaimed drama and documentaries.",
    popularShows: ["Doctor Who", "Sherlock", "Peaky Blinders", "Planet Earth"],
  },
  {
    id: 88,
    name: "FX",
    countryCode: "US",
    country: "United States",
    description: "Network celebrated for daring, boundary-pushing drama and sharp comedy series.",
    popularShows: ["The Bear", "Fargo", "Shōgun", "It's Always Sunny in Philadelphia"],
  },
  {
    id: 67,
    name: "Showtime",
    countryCode: "US",
    country: "United States",
    description: "Premium cable and streaming brand known for provocative drama and complex characters.",
    popularShows: ["Dexter", "Yellowjackets", "Billions", "Homeland"],
  },
  {
    id: 71,
    name: "The CW",
    countryCode: "US",
    country: "United States",
    description: "Broadcast network renowned for young adult drama, superhero sagas, and sci-fi series.",
    popularShows: ["Supernatural", "The Flash", "Arrow", "The Vampire Diaries"],
  },
  {
    id: 864,
    name: "tvN",
    countryCode: "KR",
    country: "South Korea",
    description: "Leading South Korean network producing globally viral K-drama series and romance hits.",
    popularShows: ["Crash Landing on You", "Goblin", "Vincenzo", "Twenty-Five Twenty-One"],
  },
  {
    id: 2552,
    name: "Apple TV+",
    countryCode: "US",
    country: "Worldwide",
    description: "Curated cinematic streamer emphasizing premier television, sci-fi, and comedy.",
    popularShows: ["Severance", "Ted Lasso", "Foundation", "Slow Horses", "Silō"],
  },
];

export default function NetworksCatalogPage() {
  const [search, setSearch] = useState("");
  const [logos, setLogos] = useState<Record<number, string | null>>({});
  const [brokenLogos, setBrokenLogos] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      FEATURED_NETWORKS.map(async (network) => {
        try {
          const res = await fetch(`/api/catalog/brand?kind=network&id=${network.id}`);
          if (!res.ok) return [network.id, null] as const;
          const data = await res.json();
          return [network.id, data.logo_path as string | null] as const;
        } catch {
          return [network.id, null] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setLogos(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = FEATURED_NETWORKS.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase()) ||
    n.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Tv className="h-4 w-4" />
            <span>Broadcasters &amp; Networks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Television Networks
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Explore world-renowned TV broadcasters, cable networks, and premier series publishers.
          </p>
        </div>

        {/* ── Search Filter ── */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter networks…"
            className="w-full bg-[#181818] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {/* ── Network Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((network) => (
          <Link
            key={network.id}
            href={`/discover?network=${network.id}&media_type=tv`}
            onClick={() => audioFX.playClick()}
            className="group flex flex-col justify-between bg-[#181818] rounded-xl p-4 border border-zinc-800/80 hover:border-blue-400/50 transition-all shadow-md"
          >
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-zinc-700/60 shrink-0">
                  {logos[network.id] && !brokenLogos[network.id] ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w300${logos[network.id]}`}
                      alt={network.name}
                      onError={() => setBrokenLogos((prev) => ({ ...prev, [network.id]: true }))}
                      className="max-h-full max-w-full object-contain p-1"
                    />
                  ) : (
                    <span className="text-blue-500 font-mono font-bold text-xs">
                      {network.countryCode}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                    {network.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {network.country}
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                {network.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-400 mb-1.5">Acclaimed Shows:</div>
              <div className="flex flex-wrap gap-1">
                {network.popularShows.map((title) => (
                  <span
                    key={title}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700/50"
                  >
                    {title}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-end gap-1 text-xs font-bold text-blue-400 mt-3 group-hover:translate-x-0.5 transition-transform">
                <span>View TV Shows</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
