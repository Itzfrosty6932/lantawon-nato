"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MoreVertical, Play, Trash2, ListPlus } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { SaveToPlaylistModal } from "@/components/playlist/SaveToPlaylistModal";

export interface LibraryActionMediaItem {
  id: string | number;
  title: string;
  mediaType?: "movie" | "tv" | "anime";
  posterPath?: string | null;
  year?: string;
  rating?: number;
}

interface LibraryCardActionsMenuProps {
  item: LibraryActionMediaItem;
  onRemove: () => void;
  removeLabel?: string;
}

export function LibraryCardActionsMenu({
  item,
  onRemove,
  removeLabel = "Remove",
}: LibraryCardActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate and clamp floating position so portal popover never clips or overflows
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const menuWidth = 190;
        const menuHeight = 140;

        let top = rect.bottom + 6;
        if (top + menuHeight > window.innerHeight - 12) {
          top = Math.max(12, rect.top - menuHeight - 6);
        }

        const idealLeft = rect.right - menuWidth;
        const left = Math.max(12, Math.min(idealLeft, window.innerWidth - menuWidth - 12));
        setCoords({ top, left });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioFX.playClick();
    setIsOpen((prev) => !prev);
  };

  const handleOpenPlaylistModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioFX.playClick();
    setIsOpen(false);
    setIsPlaylistModalOpen(true);
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioFX.playPop();
    setIsOpen(false);
    onRemove();
  };

  return (
    <>
      {/* 3-Dots Trigger Button */}
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-label={`Options for ${item.title}`}
        aria-expanded={isOpen}
        className={`flex h-8 w-8 items-center justify-center rounded-full transition-all cursor-pointer shadow-md select-none ${
          isOpen
            ? "bg-[#E50914] text-white ring-2 ring-[#E50914]/50 scale-105"
            : "bg-black/75 hover:bg-black/95 text-white/90 hover:text-white border border-white/20 active:scale-95"
        }`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Portal Popover Menu (Never Clipped by Overflow Hidden) */}
      {isOpen &&
        coords &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className="w-[190px] rounded-2xl border border-white/15 bg-[#141517]/95 p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 select-none text-left"
          >
            {/* 1. Play / Resume */}
            <Link
              href={`/watch/${item.id}?type=${item.mediaType || "movie"}`}
              onClick={() => {
                audioFX.playClick();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current text-white shrink-0" />
              <span className="truncate">Play Now</span>
            </Link>

            {/* 2. Save to Playlist */}
            <button
              type="button"
              onClick={handleOpenPlaylistModal}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-zinc-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ListPlus className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">Save to Playlist</span>
            </button>

            <div className="h-px bg-white/10 my-1" />

            {/* 3. Remove Action */}
            <button
              type="button"
              onClick={handleRemoveClick}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{removeLabel}</span>
            </button>
          </div>,
          document.body
        )}

      {/* Save To Playlist Modal */}
      {isPlaylistModalOpen && (
        <SaveToPlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          item={{
            id: item.id,
            title: item.title,
            mediaType: item.mediaType || "movie",
            posterPath: item.posterPath,
            year: item.year,
            rating: item.rating,
          }}
        />
      )}
    </>
  );
}
