"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, Film, Sparkles, ChevronRight } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface StudioEntry {
  id: number;
  name: string;
  countryCode: string;
  country: string;
  description: string;
  popularTitles: string[];
}

const FEATURED_STUDIOS: StudioEntry[] = [
  {
    id: 420,
    name: "Marvel Studios",
    countryCode: "US",
    country: "United States",
    description: "Architects of the Marvel Cinematic Universe and blockbuster superhero cinema.",
    popularTitles: ["Avengers: Endgame", "Iron Man", "Loki", "Black Panther"],
  },
  {
    id: 33,
    name: "Universal Pictures",
    countryCode: "US",
    country: "United States",
    description: "Centuries-old cinematic legacy spanning classic monsters to modern blockbusters.",
    popularTitles: ["Oppenheimer", "Jurassic Park", "Fast & Furious", "Jaws"],
  },
  {
    id: 174,
    name: "Warner Bros. Pictures",
    countryCode: "US",
    country: "United States",
    description: "Home of DC Comics, Harry Potter, The Matrix, and legendary cinematic sagas.",
    popularTitles: ["The Dark Knight", "Dune", "Interstellar", "Inception"],
  },
  {
    id: 41077,
    name: "A24",
    countryCode: "US",
    country: "United States",
    description: "Independent powerhouse celebrated for auteur-driven, Academy Award-winning cinema.",
    popularTitles: ["Everything Everywhere All at Once", "Midsommar", "Past Lives", "The Whale"],
  },
  {
    id: 10342,
    name: "Studio Ghibli",
    countryCode: "JP",
    country: "Japan",
    description: "Visionary animation studio founded by Hayao Miyazaki and Isao Takahata.",
    popularTitles: ["Spirited Away", "Princess Mononoke", "Howl's Moving Castle", "The Boy and the Heron"],
  },
  {
    id: 5627,
    name: "MAPPA",
    countryCode: "JP",
    country: "Japan",
    description: "High-octane modern anime powerhouse behind groundbreaking global hits.",
    popularTitles: ["Jujutsu Kaisen", "Attack on Titan", "Chainsaw Man", "Vinland Saga"],
  },
  {
    id: 5,
    name: "Columbia Pictures",
    countryCode: "US",
    country: "United States",
    description: "Iconic Hollywood studio with an illustrious century of genre-defining storytelling.",
    popularTitles: ["Spider-Man", "Ghostbusters", "Men in Black", "The Social Network"],
  },
  {
    id: 4,
    name: "Paramount Pictures",
    countryCode: "US",
    country: "United States",
    description: "Pioneering film studio responsible for iconic franchises and Hollywood classics.",
    popularTitles: ["Top Gun: Maverick", "Mission: Impossible", "The Godfather", "Titanic"],
  },
  {
    id: 34,
    name: "Sony Pictures",
    countryCode: "US",
    country: "United States",
    description: "Major entertainment conglomerate producing diverse theatrical and streaming entertainment.",
    popularTitles: ["Spider-Verse", "Venom", "Uncharted", "Jumanji"],
  },
];

export default function StudiosCatalogPage() {
  const [search, setSearch] = useState("");

  const filtered = FEATURED_STUDIOS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
            <Building2 className="h-4 w-4" />
            <span>Production Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Production Studios
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Browse cinematic releases produced by the world's most acclaimed movie studios and animation houses.
          </p>
        </div>

        {/* ── Search Filter ── */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter studios…"
            className="w-full bg-[#181818] border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* ── Studio Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((studio) => (
          <Link
            key={studio.id}
            href={`/discover?company=${studio.id}`}
            onClick={() => audioFX.playClick()}
            className="group flex flex-col justify-between bg-[#181818] rounded-xl p-4 border border-zinc-800/80 hover:border-amber-500/50 transition-all shadow-md"
          >
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="h-9 w-9 rounded-lg bg-zinc-800 flex items-center justify-center text-amber-400 font-mono font-bold text-xs border border-zinc-700/60 shrink-0">
                  {studio.countryCode}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                    {studio.name}
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    {studio.country}
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                {studio.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800">
              <div className="text-[10px] font-semibold text-zinc-400 mb-1.5">Key Productions:</div>
              <div className="flex flex-wrap gap-1">
                {studio.popularTitles.map((title) => (
                  <span
                    key={title}
                    className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 border border-zinc-700/50"
                  >
                    {title}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500 mt-3 group-hover:translate-x-0.5 transition-transform">
                <span>View Titles</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
