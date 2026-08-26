"use client";

import Link from "next/link";
import { Film, Home, ArrowLeft } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6 select-none bg-[#0a0a0a] text-white">
      <div className="max-w-md w-full rounded-3xl bg-[#121215] border border-white/15 p-6 sm:p-8 text-center space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/10 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#ff3b30]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="h-16 w-16 rounded-2xl bg-[#ff3b30]/15 border border-[#ff3b30]/30 flex items-center justify-center text-[#ff3b30] mx-auto shadow-[0_0_30px_rgba(255,59,48,0.25)] relative">
          <Film className="h-8 w-8" />
        </div>

        <span className="inline-block rounded-full bg-[#ff3b30]/15 border border-[#ff3b30]/30 px-3.5 py-1 font-mono text-[11px] text-[#ff3b30] font-bold tracking-wider">
          404 — SCENE NOT FOUND
        </span>

        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Title or Route Does Not Exist
        </h1>

        <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed max-w-sm mx-auto">
          The movie, series, or destination you requested has either moved or is not in the active catalog index.
        </p>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            onClick={() => audioFX.playClick()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#ff3b30] hover:bg-[#ff5247] px-6 py-3 text-xs sm:text-sm font-black text-white shadow-[0_0_30px_rgba(255,59,48,0.4)] hover:scale-105 active:scale-95 transition-all"
          >
            <Home className="h-4 w-4 text-white stroke-[2.5]" />
            <span>Return to Discovery</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
