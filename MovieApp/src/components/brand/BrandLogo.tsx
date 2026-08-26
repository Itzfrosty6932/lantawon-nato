"use client";

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  hideWordmarkOnMobile?: boolean;
  className?: string;
}

export function LantawonIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center overflow-hidden rounded-lg bg-[#0D0D0D] border border-white/10 shadow-md shadow-[#E31937]/20 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="Lantawon Nato Icon"
        className="h-full w-full object-cover select-none"
      />
    </div>
  );
}

export function BrandLogo({
  size = "md",
  showWordmark = true,
  hideWordmarkOnMobile = true,
  className = "",
}: BrandLogoProps) {
  const iconDimensions = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-9 w-9",
    xl: "h-11 w-11",
  }[size];

  const textSizes = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-xl sm:text-2xl",
    xl: "text-2xl sm:text-3xl",
  }[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* ─── Custom Lantawon Lang Icon Emblem ─── */}
      <LantawonIcon className={iconDimensions} />

      {/* ─── Wordmark (Warm White: #FFF8E7) ─── */}
      {showWordmark && (
        <span
          className={`font-heading ${textSizes} font-black tracking-wider text-[#FFF8E7] whitespace-nowrap items-center leading-none ${
            hideWordmarkOnMobile ? "hidden sm:flex" : "flex"
          }`}
        >
          <span>LANTAWON</span>
          <span className="text-[#E31937] ml-1.5 font-bold">NATO</span>
        </span>
      )}
    </div>
  );
}
