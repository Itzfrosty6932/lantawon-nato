"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home, ChevronDown, Copy, Check } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[Lantawon Nato Error Boundary]", error);
  }, [error]);

  const handleCopy = () => {
    navigator.clipboard.writeText(error.stack || error.message || "Unknown error");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="max-w-lg w-full rounded-3xl bg-[#121215] border border-white/15 p-6 sm:p-8 text-center space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#ff3b30]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="h-16 w-16 rounded-2xl bg-[#ff3b30]/15 border border-[#ff3b30]/30 flex items-center justify-center text-[#ff3b30] mx-auto shadow-[0_0_30px_rgba(255,59,48,0.25)] relative">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Headings */}
        <div className="space-y-1.5 relative">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Playback or Render Encountered an Issue
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-sm mx-auto">
            {error.message || "An unexpected runtime error occurred while rendering this cinematic view."}
          </p>
        </div>

        {/* Error Details Expandable */}
        <div className="text-left">
          <button
            type="button"
            onClick={() => setShowDetails((p) => !p)}
            className="text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 flex items-center gap-1 mx-auto transition-colors"
          >
            <span>Technical Details</span>
            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`} />
          </button>

          {showDetails && (
            <div className="mt-2.5 rounded-xl bg-black/60 border border-white/10 p-3 text-[11px] font-mono text-rose-300/90 max-h-36 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-white/5 pb-1">
                <span>{error.name || "Error"}</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="break-all whitespace-pre-wrap leading-relaxed">{error.stack || error.message}</p>
            </div>
          )}
        </div>

        {/* High-Contrast Interactive Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              audioFX.playClick();
              reset();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-[#ff3b30] hover:bg-[#ff5247] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-[0_0_30px_rgba(255,59,48,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-white stroke-[2.5]" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            onClick={() => audioFX.playClick()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
          >
            <Home className="h-4 w-4 text-white stroke-[2.5]" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
