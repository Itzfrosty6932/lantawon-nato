"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[#0D0D0D] text-[#FFF8E7] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#E31937] selection:text-[#FFF8E7]">
      {/* Dynamic Background Backdrop */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/80 to-[#0D0D0D]/90 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0D0D0D]/60 to-[#0D0D0D] z-10" />
        <div
          className="w-full h-full bg-cover bg-center filter blur-[2px] scale-105"
          style={{
            backgroundImage: `url('/background.jpg')`,
          }}
        />
      </div>

      {/* Top Header with Brand Logo and Back to Landing Page */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
          <BrandLogo size="md" />
        </Link>
        <Link
          href="/"
          className="text-xs sm:text-sm font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shadow-sm"
        >
          <span>← Back to Landing Page</span>
        </Link>
      </header>

      {/* Main Viewport (Centered) */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4">
          <span>LANTAWON NATO &copy; 2026. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
