"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Star, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";

interface PersonCard {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for: Array<{
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    media_type?: string;
  }>;
}

function PeopleCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role") || "all";

  const [role, setRole] = useState<string>(roleParam);
  const [people, setPeople] = useState<PersonCard[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setRole(roleParam);
    setPage(1);
  }, [roleParam]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchPeople = async () => {
      try {
        const res = await fetch(`/api/people?page=${page}&role=${role}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setPeople(data.results || []);
            setTotalPages(Math.min(data.totalPages || 1, 50));
            setIsLoading(false);
          }
        }
      } catch {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPeople();
    return () => {
      isMounted = false;
    };
  }, [page, role]);

  const handleRoleChange = (newRole: string) => {
    audioFX.playClick();
    setRole(newRole);
    setPage(1);
    router.push(newRole === "all" ? "/people" : `/people?role=${newRole}`);
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E31937] mb-1">
            <Users className="h-4 w-4" />
            <span>People &amp; Creators</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {role === "actor"
              ? "Actors & Voice Stars"
              : role === "director"
              ? "Directors & Filmmakers"
              : role === "writer"
              ? "Writers & Authors"
              : "All Popular People"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Explore world-renowned actors, visionary directors, and acclaimed screenwriters.
          </p>
        </div>

        {/* ── Role Filter Pills ── */}
        <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-lg border border-zinc-700/80 shrink-0">
          {[
            { id: "all", label: "All" },
            { id: "actor", label: "Actors" },
            { id: "director", label: "Directors" },
            { id: "writer", label: "Writers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleRoleChange(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                role === tab.id
                  ? "bg-[#E31937] text-white shadow"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content Grid ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="h-8 w-8 text-[#E31937] animate-spin" />
          <p className="text-xs text-zinc-400">Loading filmography masters…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {people.map((person) => {
              const photoUrl = person.profile_path
                ? `${TMDB_IMAGE_CONFIG.PROFILE_BASE}${person.profile_path}`
                : undefined;

              return (
                <Link
                  key={person.id}
                  href={`/person/${person.id}`}
                  onClick={() => audioFX.playClick()}
                  className="group flex flex-col bg-[#181818] rounded-xl overflow-hidden border border-zinc-800/80 hover:border-[#E31937]/60 transition-all shadow-md"
                >
                  <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
                    <SmartImage
                      src={photoUrl}
                      alt={person.name}
                      fallbackType="avatar"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-transparent to-transparent opacity-80" />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-amber-400 border border-amber-500/30 flex items-center gap-1 font-mono">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>{Math.round(person.popularity)}</span>
                    </div>
                  </div>

                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-white group-hover:text-[#E31937] transition-colors line-clamp-1">
                        {person.name}
                      </h3>
                      <p className="text-[10px] font-medium text-zinc-400 mt-0.5">
                        {person.known_for_department || "Cast & Crew"}
                      </p>
                    </div>

                    {person.known_for && person.known_for.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 line-clamp-1">
                        <span className="text-zinc-300 font-semibold">Known: </span>
                        {person.known_for
                          .map((k) => k.title || k.name)
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              disabled={page <= 1}
              onClick={() => {
                audioFX.playClick();
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#242526] hover:bg-[#3a3b3c] disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1 border border-zinc-700/80 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-medium text-zinc-400">
              Page <span className="text-white font-bold">{page}</span> of {totalPages}
            </span>

            <button
              disabled={page >= totalPages}
              onClick={() => {
                audioFX.playClick();
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-3.5 py-1.5 rounded-lg bg-[#242526] hover:bg-[#3a3b3c] disabled:opacity-40 disabled:pointer-events-none text-xs font-semibold text-zinc-300 hover:text-white transition-all flex items-center gap-1 border border-zinc-700/80 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function PeopleCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#E31937] animate-spin" />
        </div>
      }
    >
      <PeopleCatalogContent />
    </Suspense>
  );
}
