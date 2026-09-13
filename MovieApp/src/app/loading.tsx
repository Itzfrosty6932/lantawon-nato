import React from "react";

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-[#0D0D0D] select-none pointer-events-none"
    >
      {/* Top Precision Laser Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] overflow-hidden bg-black/40">
        <div className="h-full w-full bg-[#E50914] shadow-[0_0_10px_#E50914] animate-pulse" />
      </div>

      {/* Clean Minimalist Brand Logo (No Box, No Modal Border) */}
      <div className="relative flex flex-col items-center justify-center gap-3">
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex items-center justify-center animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Loading"
            className="h-full w-full object-contain filter drop-shadow-[0_0_24px_rgba(229,9,20,0.5)]"
          />
        </div>
      </div>
    </div>
  );
}

