"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Check,
  X,
  RotateCcw,
} from "lucide-react";
import { TAXONOMY, ALL_GENRES_ORDERED, getGenreName } from "@/lib/constants/taxonomy";
import { audioFX } from "@/lib/audio/audio-fx";

interface FilterDropdownProps {
  label: string;
  active: boolean;
  children: React.ReactNode;
  onClear?: () => void;
  width?: string;
}

export function FilterDropdown({
  label,
  active,
  children,
  onClear,
  width = "w-52",
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      if (rect.left + 240 > window.innerWidth - 16) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => {
          audioFX.playClick();
          setOpen((p) => !p);
        }}
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all select-none border ${
          active
            ? "bg-white text-zinc-950 border-white shadow-sm"
            : open
            ? "bg-[#3a3b3c] text-white border-zinc-500"
            : "bg-[#242526] text-zinc-200 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
        }`}
      >
        <span>{label}</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        {active && onClear && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              audioFX.playPop();
              onClear();
            }}
            className="ml-0.5 flex items-center justify-center h-3.5 w-3.5 rounded-full bg-black/20 hover:bg-black/40 text-zinc-900"
          >
            <X className="h-2 w-2" />
          </span>
        )}
      </button>

      {open && (
        <div
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{ overscrollBehavior: "contain" }}
          className={`absolute top-full ${
            alignRight ? "right-0" : "left-0"
          } mt-1.5 ${width} max-w-[calc(100vw-2rem)] z-50 rounded-2xl border border-zinc-700/80 bg-[#18191a] shadow-2xl shadow-black/90 max-h-72 overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-1 duration-150`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function OptionItem({
  label,
  active,
  onClick,
  sub,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  sub?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
        active
          ? "bg-white text-zinc-950 font-bold"
          : "text-zinc-300 hover:bg-[#242526] hover:text-white"
      }`}
    >
      <div className="flex flex-col min-w-0">
        <span className="truncate">{label}</span>
        {sub && (
          <span className={`text-[10px] ${active ? "text-zinc-700" : "text-zinc-400"}`}>
            {sub}
          </span>
        )}
      </div>
      {active && <Check className="h-3.5 w-3.5 shrink-0 ml-2" />}
    </button>
  );
}

export function MultiChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
        active
          ? "bg-white text-zinc-950 border-white shadow-sm font-black"
          : "bg-[#242526] text-zinc-300 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
      }`}
    >
      <span>{label}</span>
      {active && <Check className="h-3 w-3 stroke-[3]" />}
    </button>
  );
}

export function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1 rounded-lg bg-[#242526] border border-zinc-700/80 px-2 py-1 text-[11px] font-medium text-zinc-200 shadow-sm">
      <span>{label}</span>
      <button onClick={onRemove} className="text-zinc-400 hover:text-white ml-0.5">
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}
