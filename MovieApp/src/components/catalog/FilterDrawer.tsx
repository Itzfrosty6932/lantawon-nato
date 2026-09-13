"use client";

import React, { useCallback, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { SlidersHorizontal, ArrowLeft, RotateCcw, Check } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useSheetDismiss } from "@/lib/hooks/useSheetDismiss";

interface FilterDrawerProps {
  children: React.ReactNode;
  activeCount: number;
  onReset: () => void;
  resultCount?: number | null;
}

export function FilterDrawer({
  children,
  activeCount,
  onReset,
  resultCount,
}: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);
  useSheetDismiss(isOpen, handleClose);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const closeDrawer = () => {
    audioFX.playPop();
    setIsOpen(false);
  };

  const drawerContent = isOpen ? (
    <div
      className="lg:hidden fixed inset-0 z-[100] bg-[#0D0D0D] flex flex-col h-screen-safe animate-in fade-in duration-150 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
    >
      {/* Drawer header — Left Back button, Centered Title and Right Done button */}
      <div className="shrink-0 pt-[max(env(safe-area-inset-top),0.75rem)] border-b border-zinc-800 bg-[#0D0D0D] px-3 py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={closeDrawer}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 active:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <SlidersHorizontal className="h-4 w-4 text-[#E50914] shrink-0" />
            <span className="text-sm font-black text-white truncate">
              Filter Catalog
            </span>
            {activeCount > 0 && (
              <span className="rounded-full bg-[#E50914] px-2 py-0.5 text-[10px] font-mono font-black text-white shrink-0">
                {activeCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#E50914] active:bg-[#ff1f3d] text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-md"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>

      {/* Drawer body (scrollable) */}
      <div className="flex-1 scroll-lock-y px-4 py-4 space-y-4 overflow-y-auto">
        <div className="[&>div:first-child>div:first-child]:!grid [&>div:first-child>div:first-child]:!grid-cols-2 [&>div:first-child>div:first-child]:!gap-2.5 [&>div:first-child>div:first-child>*]:!w-full [&>div:first-child>div:first-child>*>button]:!w-full [&>div:first-child>div:first-child>*>button]:!justify-between [&>div:first-child>div:first-child>*>button]:!py-3 [&>div:first-child>div:first-child>*>button]:!text-[13px]">
          {children}
        </div>
      </div>

      {/* Drawer footer (Reset + Apply) */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-zinc-800 bg-[#0D0D0D]">
        <button
          type="button"
          onClick={() => {
            audioFX.playPop();
            onReset();
          }}
          disabled={activeCount === 0}
          className={`flex-1 h-12 rounded-xl border border-zinc-700 flex items-center justify-center gap-1.5 text-sm font-bold transition-colors ${
            activeCount === 0
              ? "bg-transparent text-zinc-600 cursor-not-allowed"
              : "bg-transparent text-zinc-200 active:bg-zinc-800 cursor-pointer"
          }`}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button
          type="button"
          onClick={closeDrawer}
          className="flex-[2] h-12 rounded-xl bg-[#E50914] active:bg-[#ff1f3d] text-white text-sm font-black transition-colors shadow-lg shadow-[#E50914]/25 cursor-pointer"
        >
          {resultCount != null ? `Show ${resultCount} Results` : "Apply & View Results"}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* ─── Desktop (lg+): sticky inline filter bar ─── */}
      <div className="hidden lg:block sticky top-[68px] z-30 -mx-4 sm:-mx-6 lg:-mx-10 px-4 sm:px-6 lg:px-10 py-3 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-zinc-800">
        {children}
      </div>

      {/* ─── Mobile / tablet (<lg): single trigger button ─── */}
      <button
        type="button"
        onClick={() => {
          audioFX.playClick();
          setIsOpen(true);
        }}
        className="lg:hidden w-full h-12 rounded-2xl bg-[#141517] active:bg-[#242526] border border-white/10 flex items-center justify-between px-4 text-sm font-bold text-white transition-colors cursor-pointer shadow-md"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#E50914]" />
          <span>Filters &amp; Sorting</span>
        </span>
        {activeCount > 0 ? (
          <span className="rounded-full bg-[#E50914] text-white text-[11px] font-mono font-black px-2.5 py-0.5">
            {activeCount} active
          </span>
        ) : (
          <span className="text-xs text-zinc-400 font-medium">
            Tap to customize
          </span>
        )}
      </button>

      {/* Render mobile drawer via React Portal to escape stacking context */}
      {mounted && typeof document !== "undefined" && createPortal(drawerContent, document.body)}
    </>
  );
}
