"use client";

import React, { Suspense } from "react";
import { Film, Loader2 } from "lucide-react";
import { DomainCatalogView } from "@/components/catalog/DomainCatalogView";

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24 gap-3 text-zinc-400">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
          <span className="text-xs">Loading feature films catalog...</span>
        </div>
      }
    >
      <DomainCatalogView
        config={{
          title: "Feature Films Catalog",
          subtitle: "Explore worldwide cinema masterpieces, recent blockbusters, and indie gems.",
          icon: Film,
          accentColor: "text-zinc-400",
          defaultMediaType: "movie",
          showGenreFilter: true,
          showEraFilter: true,
          showCountryFilter: true,
          showRatingFilter: true,
          showStatusFilter: false,
        }}
      />
    </Suspense>
  );
}
