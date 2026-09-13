"use client";

import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showWordmark?: boolean;
  hideWordmarkOnMobile?: boolean;
  className?: string;
}

export function LantawonIcon({ className = "h-11 w-11" }: { className?: string }) {
  return (
    <div className={`relative shrink-0 flex items-center justify-center overflow-visible bg-transparent ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.png"
        alt="Lantawon Logo"
        className="h-full w-full object-contain select-none bg-transparent"
      />
    </div>
  );
}

export function BrandLogo({
  size = "md",
  showWordmark = false,
  hideWordmarkOnMobile = true,
  className = "",
}: BrandLogoProps) {
  const iconDimensions = {
    sm: "h-8 w-8",
    md: "h-10 w-10 sm:h-11 sm:w-11",
    lg: "h-12 w-12 sm:h-14 sm:w-14",
    xl: "h-16 w-16 sm:h-20 sm:w-20",
  }[size];

  return (
    <div className={`flex items-center select-none ${className}`}>
      <LantawonIcon className={iconDimensions} />
    </div>
  );
}
