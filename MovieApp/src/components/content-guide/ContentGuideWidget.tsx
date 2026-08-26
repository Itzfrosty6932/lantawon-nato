"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { ContentGuideModal } from "@/components/content-guide/ContentGuideModal";
import type { ContentClassification, SeverityLevel } from "@/types/content-guide";

interface ContentGuideWidgetProps {
  mediaId: string;
  mediaType: "movie" | "tv" | "anime" | "documentary";
  title: string;
  initialClassification?: ContentClassification | null;
}

const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string; border: string; label: string }> = {
  none: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "None" },
  mild: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Mild" },
  moderate: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Moderate" },
  strong: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", label: "Strong" },
  severe: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30", label: "Severe" },
  unknown: { bg: "bg-zinc-800/40", text: "text-zinc-400", border: "border-white/10", label: "Unknown" },
};

export function ContentGuideWidget({
  mediaId,
  mediaType,
  title,
  initialClassification,
}: ContentGuideWidgetProps) {
  const [classification, setClassification] = useState<ContentClassification | null>(initialClassification || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialClassification);

  useEffect(() => {
    if (initialClassification) {
      setClassification(initialClassification);
      return;
    }

    let isMounted = true;
    const fetchClassification = async () => {
      try {
        const res = await fetch(`/api/content-guide/${mediaId}?type=${mediaType}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setClassification(data);
        }
      } catch (e) {
        console.warn("[ContentGuideWidget Error]", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchClassification();
    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType, initialClassification]);

  if (isLoading) {
    return (
      <div className="rounded-xl ui-surface p-3 animate-pulse flex items-center justify-between text-xs text-zinc-500">
        <span>Loading content advisory metrics...</span>
      </div>
    );
  }

  if (!classification) return null;

  const dimensions = classification.dimensions;
  const ratingBadge = classification.primaryRating || "NR";
  const ratingSystem = classification.primaryRatingSystem || "RATING";

  const dimensionList = [
    { key: "violence", label: "Violence", level: dimensions.violence },
    { key: "sexualContent", label: "Sex & Nudity", level: dimensions.sexualContent },
    { key: "language", label: "Language", level: dimensions.language },
    { key: "horror", label: "Horror / Fear", level: dimensions.horror },
    { key: "drugs", label: "Drugs & Alcohol", level: dimensions.drugs },
    { key: "theme", label: "Mature Themes", level: dimensions.theme },
  ];

  return (
    <>
      <div className="rounded-2xl bg-[#18191a] p-4 space-y-3 border border-zinc-800/80">
        {/* Header Row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <h3 className="font-heading text-xs font-bold text-white uppercase tracking-wider">
              Content Advisory
            </h3>
            <span className="rounded-lg bg-white/10 border border-white/20 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-200">
              {ratingSystem}: {ratingBadge}
            </span>
          </div>

          <button
            onClick={() => {
              audioFX.playClick();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <span>Full Analysis</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Unified 1-Row Wrap Dimension Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          {dimensionList.map((dim) => {
            const config = SEVERITY_COLORS[dim.level];
            return (
              <div
                key={dim.key}
                className="flex items-center gap-1.5 rounded-xl bg-[#242526] border border-zinc-700/80 px-2.5 py-1 text-xs"
              >
                <span className="text-[11px] text-zinc-300 font-medium">{dim.label}</span>
                <span
                  className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold border font-mono ${config.bg} ${config.text} ${config.border}`}
                >
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Warning Flags */}
        {classification.flags && classification.flags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-zinc-800">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Flags:</span>
            {classification.flags.slice(0, 6).map((flag) => (
              <span
                key={flag}
                className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-[10px] text-zinc-300 capitalize font-medium"
              >
                {flag.replace("-", " ")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Full Content Guide Modal */}
      {isModalOpen && (
        <ContentGuideModal
          mediaId={mediaId}
          title={title}
          classification={classification}
          onClose={() => setIsModalOpen(false)}
          onUpdated={(updated) => setClassification(updated)}
        />
      )}
    </>
  );
}
