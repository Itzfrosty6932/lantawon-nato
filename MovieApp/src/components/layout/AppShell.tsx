"use client";

import React, { useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { LibraryDrawer } from "@/components/library/LibraryDrawer";
import { TrailerModal } from "@/components/movie/TrailerModal";
import { PersonModal } from "@/components/movie/PersonModal";
import { GuestSessionStickyTimer } from "@/components/guest/GuestSessionStickyTimer";
import { AdShieldPopup } from "@/components/common/AdShieldPopup";

interface ModalContextType {
  openTrailer: (id: string | number, type: string, title: string, year: string) => void;
  openPerson: (id: string | number) => void;
  openLibrary: () => void;
}

const ModalContext = createContext<ModalContextType>({
  openTrailer: () => {},
  openPerson: () => {},
  openLibrary: () => {},
});

export const useAppModals = () => useContext(ModalContext);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [trailerData, setTrailerData] = useState<{
    id: string | number | null;
    type: string;
    title: string;
    year: string;
  }>({ id: null, type: "movie", title: "", year: "" });
  const [personId, setPersonId] = useState<string | number | null>(null);

  const openTrailer = (id: string | number, type: string, title: string, year: string) => {
    setTrailerData({ id, type, title, year });
  };

  const openPerson = (id: string | number) => {
    setPersonId(id);
  };

  const openLibrary = () => {
    setIsLibraryOpen(true);
  };

  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "development") {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            for (const key of keys) {
              caches.delete(key);
            }
          });
        }
      } else {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    }
  }, []);

  const isFullWidthPage =
    pathname === "/" ||
    pathname === "/home" ||
    pathname.startsWith("/home") ||
    pathname === "/movies" ||
    pathname.startsWith("/movies") ||
    pathname === "/movie" ||
    pathname.startsWith("/movie") ||
    pathname === "/shows" ||
    pathname.startsWith("/shows") ||
    pathname === "/series" ||
    pathname.startsWith("/series") ||
    pathname === "/anime" ||
    pathname.startsWith("/anime") ||
    pathname.startsWith("/watch");

  return (
    <ModalContext.Provider value={{ openTrailer, openPerson, openLibrary }}>
      <div className="bg-[#0D0D0D] text-[#FFF8E7] min-h-screen relative font-sans selection:bg-[#E31937] selection:text-[#FFF8E7] overflow-x-hidden">
        {/* TopNavBar (Fixed Top Full-Width Lantawon Bar) */}
        <React.Suspense fallback={null}>
          <Header onOpenLibrary={openLibrary} />
        </React.Suspense>

        {/* Main Canvas: Edge-to-edge for Home, Timeline & Watch, padded container for catalog & subpages */}
        <main
          className={`w-full min-h-screen pb-24 flex flex-col z-10 relative ${
            isFullWidthPage
              ? ""
              : "pt-24 sm:pt-28 px-4 sm:px-8 lg:px-12 gap-6"
          }`}
        >
          {children}
        </main>

        {/* Mobile App Navigation */}
        <MobileNav onOpenLibrary={openLibrary} />

        {/* Global Slide-Over Library */}
        <LibraryDrawer isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />

        {/* Floating Device-Based Guest Session Timer */}
        <GuestSessionStickyTimer />

        {/* Floating Ad-Shield Protection Recommendation (Landing, Login, Register) */}
        <AdShieldPopup />

        {/* Global Trailer Pop-up */}
        <TrailerModal
          mediaId={trailerData.id}
          mediaType={trailerData.type}
          title={trailerData.title}
          year={trailerData.year}
          onClose={() => setTrailerData({ id: null, type: "movie", title: "", year: "" })}
        />

        {/* Global Person Explorer Modal */}
        <PersonModal personId={personId} onClose={() => setPersonId(null)} />
      </div>
    </ModalContext.Provider>
  );
}
