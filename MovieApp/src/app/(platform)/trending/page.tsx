"use client";

import React, { Suspense } from "react";
import { Flame, Loader2 } from "lucide-react";
import { DomainCatalogView } from "@/components/catalog/DomainCatalogView";

export default function TrendingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-xs">Loading worldwide trending titles...</span>
        </div>
      }
    >
      <DomainCatalogView
        config={{
          title: "Trending Worldwide",
          subtitle: "The most watched movies, TV series, and anime across global audiences today.",
          icon: Flame,
          accentColor: "text-zinc-400",
          defaultMediaType: "all",
          showMediaTypeFilter: true,
          showGenreFilter: true,
          showDateFilter: true,
          showEraFilter: true,
          showCountryFilter: true,
          showRatingFilter: true,
          showStatusFilter: false,
          customSortOptions: [
            { id: "popularity.desc",   label: "Trending (Most Popular)" },
            { id: "vote_count.desc",   label: "Most Watched / Discussed" },
            { id: "vote_average.desc", label: "Critically Acclaimed Trending" },
          ],
        }}
      />
    </Suspense>
  );
}
