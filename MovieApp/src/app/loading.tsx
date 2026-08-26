import React from "react";

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-[#0D0D0D] select-none"
    >
      <div className="relative flex flex-col items-center gap-4 p-8 sm:p-10 rounded-3xl bg-[#141414]/95 border border-zinc-700/80 shadow-[0_0_60px_rgba(227,25,55,0.35)] animate-in zoom-in-95 duration-200">
        {/* Pulsing Ambient Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-[#E31937]/15 to-transparent blur-xl pointer-events-none" />

        {/* Rotating Red Glow Ring */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-2.5 rounded-2xl border-2 border-transparent border-t-[#E31937] border-r-[#E31937]/60 animate-spin" />

          {/* Brand Logo Emblem */}
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-[#0D0D0D] border border-white/15 shadow-2xl p-2 flex items-center justify-center animate-pulse">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.png"
              alt="Lantawon Nato"
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        {/* Brand Typography & Loading Text */}
        <div className="text-center space-y-1 relative z-10">
          <div className="font-heading text-sm sm:text-base font-black tracking-wider text-[#FFF8E7] flex items-center justify-center gap-1.5">
            <span>LANTAWON</span>
            <span className="text-[#E31937]">NATO</span>
          </div>
          <p className="text-[11px] sm:text-xs text-zinc-400 font-medium">
            Loading cinematic experience...
          </p>
        </div>
      </div>
    </div>
  );
}
