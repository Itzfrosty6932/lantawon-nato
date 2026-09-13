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

      {/* Top Precision Laser Progress Bar (YouTube/Netflix Style) */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] overflow-hidden bg-black/40 pointer-events-none">
          <div className="h-full w-full bg-[#E50914] shadow-[0_0_10px_#E50914] animate-[shimmer_1s_infinite_linear]" />
        </div>
      )}

      {children}
    </NavigationLoadingContext.Provider>
  );
}
