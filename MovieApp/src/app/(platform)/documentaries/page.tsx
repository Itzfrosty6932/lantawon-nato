"use client";

import React, { Suspense } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { DomainCatalogView } from "@/components/catalog/DomainCatalogView";

export default function DocumentariesCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-xs">Loading documentaries catalog...</span>
        </div>
      }
    >
      <DomainCatalogView
        config={{
          title: "Documentaries & Real Life",
          subtitle: "Explore true crime, nature chronicles, biographical films, and historical investigations.",
          icon: Sparkles,
          accentColor: "text-emerald-400",
          defaultMediaType: "all",
          forcedGenre: "99",
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
