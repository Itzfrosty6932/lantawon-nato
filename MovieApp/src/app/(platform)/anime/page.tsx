"use client";

import React, { Suspense } from "react";
import { Clapperboard, Loader2 } from "lucide-react";
import { DomainCatalogView } from "@/components/catalog/DomainCatalogView";

export default function AnimePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-xs">Loading anime universe catalog...</span>
        </div>
      }
    >
      <DomainCatalogView
        config={{
          title: "Japanese Anime Universe",
          subtitle: "Explore Shounen, Seinen, Isekai, Mecha, Slice of Life, and iconic anime films.",
          icon: Clapperboard,
          accentColor: "text-zinc-400",
          defaultMediaType: "anime",
          isAnimeDomain: true,
          showMediaTypeFilter: true,
          showGenreFilter: true,
          showDateFilter: true,
          showEraFilter: true,
          showCountryFilter: false, // anime is Japan-native
          showRatingFilter: true,
          showStatusFilter: true,
        }}
      />
    </Suspense>
  );
}
