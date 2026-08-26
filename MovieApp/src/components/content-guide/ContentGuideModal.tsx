"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  X,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Edit3,
  Check,
  Globe,
  Info,
} from "lucide-react";
import { ContentGuideService } from "@/features/content-guide/service";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import type {
  ContentClassification,
  ContentDimensions,
  SeverityLevel,
} from "@/types/content-guide";

interface ContentGuideModalProps {
  mediaId: string;
  title: string;
  classification: ContentClassification;
  onClose: () => void;
  onUpdated: (updated: ContentClassification) => void;
}

const SEVERITY_LEVELS: SeverityLevel[] = ["none", "mild", "moderate", "strong", "severe", "unknown"];

export function ContentGuideModal({
  mediaId,
  title,
  classification,
  onClose,
  onUpdated,
}: ContentGuideModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"dimensions" | "ratings" | "provenance" | "correct">("dimensions");
  const [editingDimension, setEditingDimension] = useState<keyof ContentDimensions | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel>("moderate");
  const [correctionNote, setCorrectionNote] = useState("");

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDimension) return;

    audioFX.playSuccess();
    await ContentGuideService.recordUserCorrection(
      mediaId,
      editingDimension,
      selectedSeverity,
      correctionNote
    );

    const updated = { ...classification };
    updated.dimensions[editingDimension] = selectedSeverity;
    updated.dimensionProvenance[editingDimension] = {
      level: selectedSeverity,
      source: "user_correction",
      confidence: 1.0,
      timestamp: new Date().toISOString(),
      verified: true,
      explanation: correctionNote || "User confirmed manual correction.",
    };
    updated.isUserOverridden = true;

    onUpdated(updated);
    showToast(`Updated ${String(editingDimension)} to ${selectedSeverity.toUpperCase()}`, "success");
    setEditingDimension(null);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0D0D0D] sm:bg-black/80 sm:backdrop-blur-md p-0 sm:p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] max-w-none sm:max-w-2xl rounded-none sm:rounded-2xl border-0 sm:border sm:border-white/10 bg-[#0D0D0D] sm:bg-zinc-950 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:p-4 border-b border-white/10 bg-zinc-900/60 pt-[calc(0.875rem+env(safe-area-inset-top,0px))] sm:pt-4 shrink-0">
          <div className="flex items-center gap-2.5 font-heading text-sm md:text-base font-bold text-white min-w-0 pr-2">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <span className="truncate">Content Classification Guide: {title}</span>
          </div>
          <button
            onClick={() => {
              audioFX.playClick();
              onClose();
            }}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            aria-label="Close Guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-zinc-950 px-3 sm:px-4 pt-2 gap-1.5 sm:gap-2 text-xs overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: "dimensions", label: "MTRCB Dimensions" },
            { id: "ratings", label: "Official Ratings" },
            { id: "provenance", label: "Metadata Provenance" },
            { id: "correct", label: "Report Correction" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                audioFX.playClick();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`pb-2.5 px-2 font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#E50914] text-[#E50914] font-bold"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs pb-[calc(2rem+env(safe-area-inset-bottom,0px))] sm:pb-5">
          {/* Tab 1: Dimensions */}
          {activeTab === "dimensions" && (
            <div className="space-y-3">
              <div className="text-zinc-400 text-[11px] leading-relaxed">
                Evaluated against the six core MTRCB parental advisory standards. All content remains 100% playable regardless of rating.
              </div>

              <div className="space-y-2">
                {[
                  { key: "violence", label: "1. Violence & Combat", level: classification.dimensions.violence },
                  { key: "sexualContent", label: "2. Sex & Nudity", level: classification.dimensions.sexualContent },
                  { key: "language", label: "3. Language & Profanity", level: classification.dimensions.language },
                  { key: "horror", label: "4. Horror, Dread & Jumpscares", level: classification.dimensions.horror },
                  { key: "drugs", label: "5. Drugs, Alcohol & Tobacco", level: classification.dimensions.drugs },
                  { key: "theme", label: "6. Mature Narrative Themes", level: classification.dimensions.theme },
                ].map((dim) => {
                  const prov = classification.dimensionProvenance[dim.key as keyof ContentDimensions];
                  return (
                    <div
                      key={dim.key}
                      className="p-3 rounded-xl ui-card space-y-1.5 border border-white/[0.08]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{dim.label}</span>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase font-mono ${
                            dim.level === "severe"
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : dim.level === "strong"
                              ? "bg-orange-500/15 text-orange-400 border border-orange-500/30"
                              : dim.level === "moderate"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                              : dim.level === "mild"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                              : dim.level === "none"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-400 border border-white/10"
                          }`}
                        >
                          {dim.level}
                        </span>
                      </div>
                      {prov && (
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {prov.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Flags */}
              {classification.flags && classification.flags.length > 0 && (
                <div className="pt-3 border-t border-white/10">
                  <div className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-2">
                    Advisory Flags & Descriptors
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {classification.flags.map((flag) => (
                      <span
                        key={flag}
                        className="rounded-lg bg-zinc-900 border border-white/10 px-2.5 py-1 text-xs text-zinc-300 capitalize font-medium"
                      >
                        {flag.replace("-", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Official Ratings */}
          {activeTab === "ratings" && (
            <div className="space-y-3">
              <div className="text-zinc-400 text-[11px]">
                Official certified age ratings issued by international classification boards:
              </div>

              {classification.officialRatings.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">No official board ratings filed for this title yet.</div>
              ) : (
                <div className="space-y-2">
                  {classification.officialRatings.map((rating, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl ui-card flex items-start justify-between gap-4 border border-white/[0.08]"
                    >
                      <div>
                        <div className="flex items-center gap-2 font-bold text-white text-xs">
                          <span>{rating.system} ({rating.region})</span>
                          <span className="rounded bg-amber-400/10 border border-amber-400/30 px-2 py-0.2 text-[10px] text-amber-300 font-mono">
                            {rating.value}
                          </span>
                        </div>
                        {rating.meaning && (
                          <p className="text-[11px] text-zinc-400 mt-1">{rating.meaning}</p>
                        )}
                        <div className="text-[10px] text-zinc-500 mt-1">Source: {rating.source}</div>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Provenance */}
          {activeTab === "provenance" && (
            <div className="space-y-3">
              <div className="text-zinc-400 text-[11px]">
                Full data lineage and verification audit trail for this title:
              </div>

              <div className="rounded-xl ui-surface p-4 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">Media ID:</span>
                  <span className="text-white">{classification.mediaId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">Analysis Status:</span>
                  <span className="text-emerald-400 uppercase font-bold">{classification.analysisStatus}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/[0.04]">
                  <span className="text-zinc-400">User Override:</span>
                  <span className="text-[#E50914]">{classification.isUserOverridden ? "YES (Locally Confirmed)" : "NO"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Last Evaluated:</span>
                  <span className="text-zinc-300">{new Date(classification.lastUpdated).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Report Correction */}
          {activeTab === "correct" && (
            <div className="space-y-4">
              <div className="text-zinc-400 text-[11px]">
                Notice inaccurate content advisory data? Submit a correction to permanently update your local database.
              </div>

              <form onSubmit={handleSaveCorrection} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Target Dimension</label>
                  <select
                    value={editingDimension || "violence"}
                    onChange={(e) => setEditingDimension(e.target.value as keyof ContentDimensions)}
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 p-2 text-xs text-white focus:outline-none focus:border-[#E50914]"
                  >
                    <option value="violence">Violence</option>
                    <option value="sexualContent">Sex & Nudity</option>
                    <option value="language">Language</option>
                    <option value="horror">Horror / Fear</option>
                    <option value="drugs">Drugs / Substances</option>
                    <option value="theme">Mature Themes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Correct Severity Level</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {SEVERITY_LEVELS.map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setSelectedSeverity(lvl)}
                        className={`py-1.5 rounded-lg border text-xs font-bold uppercase transition-all ${
                          selectedSeverity === lvl
                            ? "bg-[#E50914] text-white border-[#E50914] shadow-md"
                            : "bg-zinc-900 text-zinc-400 border-white/10 hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">Correction Note (Optional)</label>
                  <input
                    type="text"
                    value={correctionNote}
                    onChange={(e) => setCorrectionNote(e.target.value)}
                    placeholder="e.g. Mild animated combat only, no graphic blood."
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#E50914]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#E50914] hover:bg-red-600 py-2.5 text-xs font-bold text-white shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" /> Save Local Correction
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
