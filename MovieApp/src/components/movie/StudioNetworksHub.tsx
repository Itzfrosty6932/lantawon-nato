"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Tv, Sparkles, Globe, ExternalLink } from "lucide-react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import type { ProductionCompany, Network } from "@/types/media";

interface StudioNetworksHubProps {
  productionCompanies?: ProductionCompany[];
  networks?: Network[];
  mediaType: "movie" | "tv";
}

// Curated brand styling and accents for iconic worldwide studios & networks
const BRAND_THEMES: Record<string, { bg: string; text: string; border: string; iconLabel?: string }> = {
  netflix: { bg: "bg-red-950/40", text: "text-red-500", border: "border-red-500/40", iconLabel: "NETFLIX" },
  disney: { bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-500/40", iconLabel: "DISNEY" },
  marvel: { bg: "bg-red-950/50", text: "text-red-400", border: "border-red-500/50", iconLabel: "MARVEL" },
  "warner bros": { bg: "bg-sky-950/40", text: "text-sky-400", border: "border-sky-500/40", iconLabel: "WB" },
  hbo: { bg: "bg-purple-950/40", text: "text-purple-400", border: "border-purple-500/40", iconLabel: "HBO" },
  max: { bg: "bg-blue-950/40", text: "text-blue-400", border: "border-blue-500/40", iconLabel: "MAX" },
  paramount: { bg: "bg-blue-950/40", text: "text-sky-300", border: "border-sky-400/40", iconLabel: "PARAMOUNT" },
  universal: { bg: "bg-amber-950/30", text: "text-amber-300", border: "border-amber-500/40", iconLabel: "UNIVERSAL" },
  sony: { bg: "bg-zinc-900", text: "text-white", border: "border-white/30", iconLabel: "SONY" },
  columbia: { bg: "bg-amber-950/30", text: "text-amber-400", border: "border-amber-400/40", iconLabel: "COLUMBIA" },
  fox: { bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-500/40", iconLabel: "20th FOX" },
  "20th century": { bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-500/40", iconLabel: "20th CENTURY" },
  aniplex: { bg: "bg-rose-950/40", text: "text-rose-400", border: "border-rose-500/40", iconLabel: "ANIPLEX" },
  crunchyroll: { bg: "bg-orange-950/40", text: "text-orange-400", border: "border-orange-500/40", iconLabel: "CRUNCHYROLL" },
  toho: { bg: "bg-red-950/40", text: "text-red-400", border: "border-red-500/40", iconLabel: "TOHO" },
  ghibli: { bg: "bg-teal-950/40", text: "text-teal-300", border: "border-teal-400/40", iconLabel: "GHIBLI" },
  mappa: { bg: "bg-zinc-900", text: "text-cyan-400", border: "border-cyan-400/40", iconLabel: "MAPPA" },
  apple: { bg: "bg-zinc-900", text: "text-zinc-200", border: "border-white/25", iconLabel: "APPLE TV+" },
  amazon: { bg: "bg-sky-950/40", text: "text-sky-400", border: "border-sky-400/40", iconLabel: "PRIME VIDEO" },
  youtube: { bg: "bg-red-950/50", text: "text-red-500", border: "border-red-500/40", iconLabel: "YOUTUBE" },
  a24: { bg: "bg-zinc-900", text: "text-amber-300 font-serif", border: "border-amber-300/40", iconLabel: "A24" },
  lucasfilm: { bg: "bg-amber-950/40", text: "text-amber-400", border: "border-amber-400/40", iconLabel: "LUCASFILM" },
  bbc: { bg: "bg-zinc-900", text: "text-rose-400", border: "border-rose-400/40", iconLabel: "BBC" },
};

function getBrandTheme(name: string) {
  const lower = name.toLowerCase();
  for (const [key, theme] of Object.entries(BRAND_THEMES)) {
    if (lower.includes(key)) {
      return theme;
    }
  }
  return {
    bg: "bg-zinc-900/80",
    text: "text-cyan-400",
    border: "border-white/10",
  };
}

export function StudioNetworksHub({
  productionCompanies = [],
  networks = [],
  mediaType,
}: StudioNetworksHubProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Consolidate brands with deduplication
  const combinedBrands: Array<{
    id: number;
    name: string;
    logo_path?: string | null;
    origin_country?: string;
    kind: "network" | "studio";
  }> = [];

  const seenNames = new Set<string>();

  // Add networks first
  for (const net of networks) {
    if (net.name && !seenNames.has(net.name.toLowerCase().trim())) {
      seenNames.add(net.name.toLowerCase().trim());
      combinedBrands.push({
        id: net.id,
        name: net.name,
        logo_path: net.logo_path,
        origin_country: net.origin_country,
        kind: "network",
      });
    }
  }

  // Add production studios
  for (const comp of productionCompanies) {
    if (comp.name && !seenNames.has(comp.name.toLowerCase().trim())) {
      seenNames.add(comp.name.toLowerCase().trim());
      combinedBrands.push({
        id: comp.id,
        name: comp.name,
        logo_path: comp.logo_path,
        origin_country: comp.origin_country,
        kind: "studio",
      });
    }
  }

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [combinedBrands.length]);

  if (combinedBrands.length === 0) return null;

  return (
    <section className="rounded-2xl bg-[#18191a] p-5 space-y-3.5 border border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-zinc-400" />
          <h3 className="font-heading text-sm font-bold text-white">
            Studios &amp; Networks
          </h3>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {combinedBrands.length} Brand{combinedBrands.length > 1 ? "s" : ""}
        </span>
      </div>

      {/* Horizontal Carousel with Transparent Edge Fades */}
      <div className="relative">
        {canScrollLeft && (
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-[#18191a] via-[#18191a]/80 to-transparent z-10 transition-opacity duration-300" />
        )}

        {canScrollRight && (
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-20 bg-gradient-to-l from-[#18191a] via-[#18191a]/80 to-transparent z-10 transition-opacity duration-300" />
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-none snap-x items-center scroll-smooth"
        >
          {combinedBrands.map((brand, idx) => {
            const logoUrl = brand.logo_path
              ? `https://image.tmdb.org/t/p/w300${brand.logo_path}`
              : null;

            return (
              <Link
                key={`brand_${brand.id}_${idx}`}
                href={brand.kind === "network" ? `/discover?network=${brand.id}&q=${encodeURIComponent(brand.name)}` : `/discover?company=${brand.id}&q=${encodeURIComponent(brand.name)}`}
                onClick={() => audioFX.playClick()}
                title={`Explore all titles from ${brand.name}`}
                className="flex-none w-36 h-20 sm:w-44 sm:h-22 rounded-xl bg-white hover:bg-zinc-100 p-3.5 flex items-center justify-center shadow-md transition-all duration-200 hover:scale-105 group border border-white/20"
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={brand.name}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        const fallbackText = document.createElement("div");
                        fallbackText.className = "font-heading text-xs font-black tracking-wider uppercase text-center truncate text-zinc-950 px-2";
                        fallbackText.innerText = brand.name;
                        parent.appendChild(fallbackText);
                      }
                    }}
                    className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="font-heading text-xs font-black tracking-wider uppercase text-center truncate text-zinc-950 px-2">
                    {brand.name}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
