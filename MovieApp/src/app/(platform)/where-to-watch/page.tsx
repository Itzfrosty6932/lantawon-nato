"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Tv, ExternalLink, ShieldCheck, ChevronRight } from "lucide-react";
import { ISO_COUNTRIES, CountryEntry } from "@/lib/constants/taxonomies";
import { audioFX } from "@/lib/audio/audio-fx";

interface ProviderHubEntry {
  id: number;
  name: string;
  category: "subscription" | "free" | "rent_buy";
  badge: string;
  description: string;
  popularInRegion: string[];
  plansAvailable: string;
  website: string;
}

const GLOBAL_PROVIDERS: ProviderHubEntry[] = [
  {
    id: 8,
    name: "Netflix",
    category: "subscription",
    badge: "Subscription",
    description: "World-leading on-demand streaming service with vast international catalog and originals.",
    popularInRegion: ["PH", "US", "JP", "KR", "GB", "CA", "AU"],
    plansAvailable: "Mobile / Basic / Standard / Premium 4K",
    website: "https://netflix.com",
  },
  {
    id: 337,
    name: "Disney+",
    category: "subscription",
    badge: "Subscription",
    description: "The home of Disney, Pixar, Marvel, Star Wars, National Geographic, and Star content.",
    popularInRegion: ["PH", "US", "JP", "GB", "CA", "AU"],
    plansAvailable: "Standard / Premium 4K HDR",
    website: "https://disneyplus.com",
  },
  {
    id: 9,
    name: "Amazon Prime Video",
    category: "subscription",
    badge: "Subscription / Rent",
    description: "Global streaming service included with Prime, featuring blockbuster cinema and exclusive series.",
    popularInRegion: ["PH", "US", "JP", "GB", "DE", "IN"],
    plansAvailable: "Included with Amazon Prime",
    website: "https://primevideo.com",
  },
  {
    id: 283,
    name: "Crunchyroll",
    category: "subscription",
    badge: "Anime SVOD",
    description: "World's premier destination for anime streaming, simulcasts, and Japanese media.",
    popularInRegion: ["PH", "US", "JP", "GB", "FR", "ES", "DE"],
    plansAvailable: "Free with Ads / Fan / Mega Fan",
    website: "https://crunchyroll.com",
  },
  {
    id: 192,
    name: "YouTube Movies",
    category: "free",
    badge: "Free / VOD",
    description: "Official legal digital rental, purchase, and ad-supported free feature films.",
    popularInRegion: ["PH", "US", "JP", "GB", "CA", "AU", "IN"],
    plansAvailable: "Free (Ad-Supported) / Pay-per-title",
    website: "https://youtube.com",
  },
  {
    id: 2,
    name: "Apple TV / iTunes",
    category: "rent_buy",
    badge: "Rent / Buy",
    description: "Highest bitrate digital purchases and rentals with 4K Dolby Vision and Dolby Atmos.",
    popularInRegion: ["PH", "US", "JP", "GB", "FR", "DE", "CA", "AU"],
    plansAvailable: "Individual Digital Rental & Purchase",
    website: "https://apple.com/apple-tv-app",
  },
];

export default function WhereToWatchHubPage() {
  const [selectedCountry, setSelectedCountry] = useState<CountryEntry>(ISO_COUNTRIES[0]);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "subscription" | "free" | "rent_buy">("all");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_country_code");
    if (saved) {
      const match = ISO_COUNTRIES.find((c) => c.code === saved);
      if (match) setSelectedCountry(match);
    }
  }, []);

  const filteredProviders = GLOBAL_PROVIDERS.filter((p) => {
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    const matchesRegion = p.popularInRegion.includes(selectedCountry.code) || p.popularInRegion.includes("PH");
    return matchesCategory && matchesRegion;
  });

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1">
            <Tv className="h-4 w-4" />
            <span>Streaming Availability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Where to Watch Hub
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Check verified legal streaming, subscription, free, and digital rental availability in your territory.
          </p>
        </div>

        {/* ── Filter Controls ── */}
        <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-lg border border-zinc-700/80 shrink-0">
          {[
            { id: "all", label: "All" },
            { id: "subscription", label: "Subscription" },
            { id: "free", label: "Free / Ads" },
            { id: "rent_buy", label: "Rent & Buy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                audioFX.playClick();
                setCategoryFilter(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                categoryFilter === tab.id
                  ? "bg-[#E31937] text-white shadow"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transparency Banner ── */}
      <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Availability: </span>
          Lantawon indexes legal streaming providers in region <span className="font-mono font-bold text-emerald-400">{selectedCountry.code}</span>.
        </div>
      </div>

      {/* ── Providers Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => (
          <div
            key={provider.id}
            className="group flex flex-col justify-between bg-[#181818] rounded-xl p-4 border border-zinc-800/80 hover:border-zinc-600 transition-all shadow-md"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="font-bold text-base text-white group-hover:text-[#E31937] transition-colors">
                  {provider.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-emerald-400 border border-emerald-500/30">
                  {provider.badge}
                </span>
              </div>

              <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mt-1">
                {provider.description}
              </p>

              <div className="mt-3 text-[10px] text-zinc-400 font-medium">
                <span className="font-semibold text-zinc-300">Tiers: </span>
                {provider.plansAvailable}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
              <Link
                href={`/discover?provider=${provider.id}`}
                onClick={() => audioFX.playClick()}
                className="text-xs font-bold text-[#E31937] hover:underline flex items-center gap-1"
              >
                <span>Browse Titles</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>

              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => audioFX.playClick()}
                className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white flex items-center gap-1 border border-zinc-700/60 transition-all"
              >
                <span>Visit</span>
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
