"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

interface NavigationLoadingContextType {
  isNavigating: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isNavigating: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export const useNavigationLoading = () => useContext(NavigationLoadingContext);

function LoadingListener({
  isNavigating,
  setIsNavigating,
}: {
  isNavigating: boolean;
  setIsNavigating: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Stop loading when route completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname, searchParams, setIsNavigating]);

  // Global click interceptor for internal links
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore hash-only links on same page, new tabs, and external links
      if (
        href.startsWith("#") ||
        target.getAttribute("target") === "_blank" ||
        target.getAttribute("download") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      // If navigating to different path or search query
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (href !== currentUrl && !href.startsWith(currentUrl + "#")) {
        setIsNavigating(true);
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => document.removeEventListener("click", handleDocumentClick, { capture: true });
  }, [setIsNavigating]);

  return null;
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);

  const startLoading = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsNavigating(false);
  }, []);

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, startLoading, stopLoading }}>
      <Suspense fallback={null}>
        <LoadingListener isNavigating={isNavigating} setIsNavigating={setIsNavigating} />
      </Suspense>

      {/* Top Precision Laser Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-1 z-[99999] overflow-hidden bg-black/40 pointer-events-none">
          <div className="h-full w-full bg-gradient-to-r from-[#E31937] via-[#FFD106] to-[#E31937] animate-[shimmer_1s_infinite_linear] shadow-[0_0_12px_#E31937]" />
        </div>
      )}

      {/* Center Cinematic Brand Logo Loading Pop-up */}
      {isNavigating && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-150 select-none pointer-events-none"
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
      )}

      {children}
    </NavigationLoadingContext.Provider>
  );
}
