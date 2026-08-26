"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  X,
  Search,
  Check,
  Film,
  Tv,
} from "lucide-react";
import { LocalScannerService } from "@/features/library/local-scanner";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { SmartImage } from "@/components/ui/SmartImage";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import type { LocalScannedMediaRecord } from "@/types/storage";
import type { CandidateMatch } from "@/types/resolver";

interface MatchCorrectionModalProps {
  item: LocalScannedMediaRecord | null;
  onClose: () => void;
  onMatchUpdated: () => void;
}

export function MatchCorrectionModal({
  item,
  onClose,
  onMatchUpdated,
}: MatchCorrectionModalProps) {
  const { showToast } = useToast();
  const [manualQuery, setManualQuery] = useState("");
  const [manualResults, setManualResults] = useState<CandidateMatch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!item) return null;

  const confidence = item.matchConfidence || 50;
  const status = item.matchStatus || "unknown";

  const getStatusBadge = () => {
    if (status === "confirmed" || status === "high_confidence") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" /> {confidence}% High Confidence
        </span>
      );
    }
    if (status === "review_needed") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" /> {confidence}% Review Suggested
        </span>
      );
    }
    if (status === "ambiguous") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 text-xs font-bold text-orange-400">
          <AlertTriangle className="h-3.5 w-3.5" /> {confidence}% Ambiguous Candidates
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-400">
        <HelpCircle className="h-3.5 w-3.5" /> {confidence}% Unknown Title
      </span>
    );
  };

  const handleSelectCandidate = async (candidate: CandidateMatch) => {
    audioFX.playSuccess();
    await LocalScannerService.overrideMatch(item.downloadId, {
      tmdbId: candidate.tmdbId,
      title: candidate.title,
      year: candidate.year,
      mediaType: candidate.mediaType,
      posterPath: candidate.posterPath,
      overview: candidate.overview,
    });
    showToast(`Confirmed match: ${candidate.title}`, "success");
    onMatchUpdated();
    onClose();
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQuery.trim()) return;

    audioFX.playClick();
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(manualQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).map((r: { id: number; title?: string; name?: string; release_date?: string; first_air_date?: string; media_type?: string; poster_path?: string; overview?: string }) => ({
          tmdbId: r.id,
          title: r.title || r.name || "Untitled",
          year: (r.release_date || r.first_air_date || "").split("-")[0],
          mediaType: (r.media_type === "tv" ? "tv" : "movie") as "movie" | "tv",
          score: 100,
          posterPath: r.poster_path,
          overview: r.overview,
          matchSignals: {
            titleSimilarity: 40,
            yearMatch: 15,
            typeMatch: 15,
            seasonEpisodeMatch: 15,
            popularityBonus: 10,
          },
        }));
        setManualResults(results);
      }
    } catch {
      showToast("Manual search failed", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const candidateList = manualResults.length > 0 ? manualResults : (item.candidates || []);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 shadow-modal overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-2.5 font-heading text-base font-bold text-white">
            <Sparkles className="h-5 w-5 text-primary" /> Resolve & Correct Metadata
          </div>
          <button
            onClick={() => {
              audioFX.playClick();
              onClose();
            }}
            className="rounded-lg p-1 text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* File Overview Box */}
          <div className="p-4 rounded-xl glass-panel space-y-2 border border-white/10">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">File Identity</div>
                <div className="font-mono text-xs text-white font-bold truncate max-w-md">{item.fileName}</div>
                <div className="font-mono text-[11px] text-zinc-400 mt-0.5">{item.fullRelativePath}</div>
              </div>
              {getStatusBadge()}
            </div>
          </div>

          {/* Manual Search Form */}
          <form onSubmit={handleManualSearch} className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              placeholder="Search exact title on TMDB (e.g., 'Spider-Man 2002')..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-24 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!manualQuery.trim() || isSearching}
              className="absolute right-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-zinc-950 disabled:opacity-40"
            >
              Search
            </button>
          </form>

          {/* Candidate Matches */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {manualResults.length > 0 ? "Search Results" : "Confidence-Ranked Candidates"}
            </div>

            {candidateList.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs">
                No candidate titles found. Use the search bar above to query by exact title.
              </div>
            ) : (
              candidateList.map((cand, idx) => {
                const poster = cand.posterPath
                  ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${cand.posterPath}`
                  : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;

                const isCurrent = item.title === cand.title && item.year === cand.year;

                return (
                  <div
                    key={`${cand.tmdbId}_${cand.year}_${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? "bg-primary/10 border-primary/40"
                        : "bg-white/[0.03] border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SmartImage
                        src={poster}
                        alt={cand.title}
                        fallbackType="poster"
                        containerClassName="w-10 h-14 rounded-lg border border-white/10 shrink-0"
                        className="h-full w-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white flex items-center gap-2 truncate">
                          <span>{cand.title}</span>
                          {cand.year && (
                            <span className="text-xs text-zinc-400 font-normal">({cand.year})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                          <span className="flex items-center gap-1 text-[11px] uppercase font-bold text-primary">
                            {cand.mediaType === "tv" ? <Tv className="h-3 w-3" /> : <Film className="h-3 w-3" />}
                            {cand.mediaType}
                          </span>
                          <span>• Score: {cand.score}%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectCandidate(cand)}
                      className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-transform hover:scale-105 ${
                        isCurrent
                          ? "bg-emerald-500 text-white"
                          : "bg-primary text-zinc-950 shadow-glow"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{isCurrent ? "Active Match" : "Select & Confirm"}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
