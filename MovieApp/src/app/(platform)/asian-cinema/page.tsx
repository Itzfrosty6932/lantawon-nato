"use client";

import React, { Suspense } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { DomainCatalogView } from "@/components/catalog/DomainCatalogView";

export default function AsianCinemaCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-xs">Loading Asian cinema &amp; K-dramas catalog...</span>
        </div>
      }
    >
      <DomainCatalogView
        config={{
          title: "Asian Cinema & K-Dramas",
          subtitle: "Explore blockbusters, thrillers, romances and series from Korea, Japan, Hong Kong, Thailand, and across Asia.",
          icon: Sparkles,
          accentColor: "text-red-500",
          defaultMediaType: "all",
          forcedCountry: "KR|JP|CN|HK|TW|TH|PH|ID|VN",
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
