"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  Check,
  X,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface FilterDropdownProps {
  label: string;
  active: boolean;
  children: React.ReactNode;
  onClear?: () => void;
  width?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function FilterDropdown({
  label,
  active,
  children,
  onClear,
  width = "w-52",
  isOpen,
  onToggle,
}: FilterDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = (val: boolean | ((p: boolean) => boolean)) => {
    const nextVal = typeof val === "function" ? val(open) : val;
    if (onToggle) {
      onToggle(nextVal);
    } else {
      setInternalOpen(nextVal);
    }
  };

  const [popLeftOffset, setPopLeftOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const modalWidth = Math.min(220, window.innerWidth - 24);
      const popX = Math.max(12, Math.min(rect.left, window.innerWidth - 12 - modalWidth));
      setPopLeftOffset(popX - rect.left);
    }

    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      style={{ zIndex: open ? 999 : 1 }}
      className="relative inline-block shrink-0"
    >
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => {
          audioFX.playClick();
          setOpen((p) => !p);
        }}
        className={`flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all select-none border cursor-pointer ${
          active
            ? "bg-white text-zinc-950 border-white shadow-sm font-black"
            : open
            ? "bg-[#3a3b3c] text-white border-zinc-500"
            : "bg-[#1c1d22] text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
        }`}
      >
        <span className="truncate max-w-[130px] sm:max-w-none">{label}</span>
        <ChevronDown
          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        />
        {active && onClear && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              audioFX.playPop();
              onClear();
            }}
            className="ml-0.5 flex items-center justify-center h-3.5 w-3.5 rounded-full bg-black/20 hover:bg-black/40 text-zinc-900 cursor-pointer shrink-0"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {/* Dropdown Floating Menu with Viewport Clamping */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ zIndex: 1000, left: `${popLeftOffset}px` }}
          className={`absolute top-full mt-2 ${width} min-w-[180px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-white/15 bg-[#18191c]/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/90 max-h-72 overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-zinc-700`}
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
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        audioFX.playClick();
        onClick();
      }}
      className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
        active
          ? "bg-[#E50914] text-white font-bold shadow-sm"
          : "text-zinc-300 hover:text-white hover:bg-white/10"
      }`}
    >
      <span className="truncate">{label}</span>
      {active && <Check className="h-3.5 w-3.5 shrink-0" />}
      {sub && !active && <span className="text-[10px] text-zinc-500">{sub}</span>}
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
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        audioFX.playClick();
        onClick();
      }}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer select-none ${
        active
          ? "bg-[#E50914] text-white border-[#E50914] shadow-sm font-bold"
          : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20"
      }`}
    >
      <span>{label}</span>
      {active && <Check className="h-3 w-3 shrink-0" />}
    </button>
  );
}

export function ActivePill({
  label,
  onClear,
  onRemove,
}: {
  label: string;
  onClear?: () => void;
  onRemove?: () => void;
}) {
  const handleAction = onRemove || onClear || (() => {});
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white border border-white/20">
      <span>{label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          audioFX.playPop();
          handleAction();
        }}
        className="rounded-full p-0.5 hover:bg-white/20 text-zinc-300 hover:text-white cursor-pointer"
        aria-label={`Clear ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
