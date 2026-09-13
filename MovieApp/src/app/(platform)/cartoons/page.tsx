"use client";

import React, { Suspense } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { DomainCatalogView } from "@/components/catalog/DomainCatalogView";

export default function CartoonsCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-xs">Loading animation &amp; cartoons catalog...</span>
        </div>
      }
    >
      <DomainCatalogView
        config={{
          title: "Animation & Cartoons",
          subtitle: "Explore Western animation, animated feature films, family series, and cartoon classics.",
          icon: Sparkles,
          accentColor: "text-amber-400",
          defaultMediaType: "all",
          forcedGenre: "16",
          showMediaTypeFilter: true,
          showGenreFilter: true,
          showEraFilter: true,
          showCountryFilter: true,
          showRatingFilter: true,
          showStatusFilter: true,
        }}
      />
    </Suspense>
  );
}
