"use client";

import React, { Suspense } from "react";
import { Star, Loader2 } from "lucide-react";
import { DomainCatalogView } from "@/components/catalog/DomainCatalogView";

export default function TopRatedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-xs">Loading acclaimed masterpieces...</span>
        </div>
      }
    >
      <DomainCatalogView
        config={{
          title: "Top Rated Masterpieces",
          subtitle: "Critically acclaimed titles with exceptional viewer ratings across cinema history.",
          icon: Star,
          accentColor: "text-zinc-400",
          defaultMediaType: "all",
          showGenreFilter: true,
          showEraFilter: true,
          showCountryFilter: true,
          showRatingFilter: true,
          showStatusFilter: false,
          customSortOptions: [
            { id: "vote_average.desc", label: "Rating (Highest First)" },
            { id: "vote_count.desc",   label: "Most Rated Masterpieces" },
            { id: "popularity.desc",   label: "Popular High Rated" },
          ],
        }}
      />
    </Suspense>
  );
}
