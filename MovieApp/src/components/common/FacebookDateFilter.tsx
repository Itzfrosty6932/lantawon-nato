"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  Check,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

export const MONTHS = [
  { id: "", label: "All Months", short: "All" },
  { id: "01", label: "January", short: "Jan" },
  { id: "02", label: "February", short: "Feb" },
  { id: "03", label: "March", short: "Mar" },
  { id: "04", label: "April", short: "Apr" },
  { id: "05", label: "May", short: "May" },
  { id: "06", label: "June", short: "Jun" },
  { id: "07", label: "July", short: "Jul" },
  { id: "08", label: "August", short: "Aug" },
  { id: "09", label: "September", short: "Sep" },
  { id: "10", label: "October", short: "Oct" },
  { id: "11", label: "November", short: "Nov" },
  { id: "12", label: "December", short: "Dec" },
];

const currentYear = new Date().getFullYear();
export const YEARS = [
  { id: "", label: "All Years" },
  ...Array.from({ length: currentYear - 1950 + 1 }, (_, i) => {
    const y = String(currentYear - i);
    return { id: y, label: y };
  }),
];

interface FacebookDateFilterProps {
  selectedYear: string;
  selectedMonth: string;
  onSelectDate: (year: string, month: string) => void;
  onClear: () => void;
  className?: string;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
}

export function FacebookDateFilter({
  selectedYear,
  selectedMonth,
  onSelectDate,
  onClear,
  className = "",
  isOpen,
  onToggle,
}: FacebookDateFilterProps) {
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

  const ref = useRef<HTMLDivElement>(null);

  // Draft state inside popup
  const [draftYear, setDraftYear] = useState(selectedYear);
  const [draftMonth, setDraftMonth] = useState(selectedMonth);
  const [popLeftOffset, setPopLeftOffset] = useState(0);

  // Sync draft when opened or external state changes
  useEffect(() => {
    setDraftYear(selectedYear);
    setDraftMonth(selectedMonth);
  }, [selectedYear, selectedMonth, open]);

  // Click outside and boundary alignment listener
  useEffect(() => {
    if (!open) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const modalWidth = Math.min(320, window.innerWidth - 24);
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

  const isActive = Boolean(selectedYear || selectedMonth);

  // Compute trigger label
  const monthObj = MONTHS.find((m) => m.id === selectedMonth);
  let triggerLabel = "Date";
  if (selectedYear && selectedMonth && monthObj?.short) {
    triggerLabel = `Date: ${monthObj.short} ${selectedYear}`;
  } else if (selectedYear) {
    triggerLabel = `Date: ${selectedYear}`;
  } else if (selectedMonth && monthObj?.short) {
    triggerLabel = `Date: ${monthObj.label}`;
  }

  const handleApply = (newYear = draftYear, newMonth = draftMonth) => {
    audioFX.playClick();
    onSelectDate(newYear, newMonth);
    setOpen(false);
  };

  const handleReset = () => {
    audioFX.playPop();
    setDraftYear("");
    setDraftMonth("");
    onClear();
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      style={{ zIndex: open ? 999 : 1 }}
      className={`relative shrink-0 ${className}`}
    >
      {/* ─── Date Trigger Pill Button ─── */}
      <button
        type="button"
        onClick={() => {
          audioFX.playClick();
          setOpen((p) => !p);
        }}
        className={`flex items-center gap-1.5 rounded-full px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold transition-all select-none border cursor-pointer ${
          isActive
            ? "bg-white text-zinc-950 border-white shadow-sm font-black"
            : open
            ? "bg-[#3a3b3c] text-white border-zinc-500"
            : "bg-[#1c1d22] text-zinc-300 border-white/10 hover:bg-white/10 hover:text-white"
        }`}
      >
        <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-zinc-400" />
        <span className="truncate max-w-[130px] sm:max-w-none">{triggerLabel}</span>
        <ChevronDown
          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        />
        {isActive && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              audioFX.playPop();
              handleReset();
            }}
            className="ml-0.5 flex items-center justify-center h-3.5 w-3.5 rounded-full bg-black/20 hover:bg-black/40 text-zinc-900 cursor-pointer shrink-0"
          >
            <X className="h-2.5 w-2.5" />
          </span>
        )}
      </button>

      {/* ─── Facebook-style Popup (Popover) ─── */}
      {open && (
        <div
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            zIndex: 1000,
            overscrollBehavior: "contain",
            left: `${popLeftOffset}px`,
          }}
          className="absolute top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-zinc-700/80 bg-[#18191a]/95 p-3.5 sm:p-4 shadow-2xl shadow-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 space-y-3.5"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-3.5 w-3.5 text-[#E50914]" />
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-white">
                Select Date
              </span>
            </div>

            {(draftYear || draftMonth) && (
              <button
                onClick={handleReset}
                className="text-xs text-[#E50914] hover:underline font-bold transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Section 1: Year Picker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider block">
              Year
            </label>
            <div className="relative">
              <select
                value={draftYear}
                onChange={(e) => {
                  audioFX.playClick();
                  const val = e.target.value;
                  setDraftYear(val);
                }}
                className="w-full h-8.5 rounded-xl bg-[#242526] border border-zinc-700/80 px-2.5 text-xs font-bold text-white focus:outline-none focus:border-zinc-400 cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y.id} value={y.id} className="bg-[#18191a] text-white">
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Month Grid (Facebook style 12 Month Grid) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider">
                Month
              </label>
              {draftMonth && (
                <button
                  onClick={() => {
                    audioFX.playPop();
                    setDraftMonth("");
                  }}
                  className="text-[10px] text-zinc-400 hover:text-white font-mono cursor-pointer"
                >
                  All Months
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 sm:gap-1.5">
              {MONTHS.map((m) => {
                const isSelected = draftMonth === m.id;
                return (
                  <button
                    key={m.id || "all"}
                    onClick={() => {
                      audioFX.playClick();
                      setDraftMonth(m.id);
                    }}
                    className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-white text-zinc-950 border-white shadow-sm font-black"
                        : "bg-[#242526] text-zinc-300 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
                    }`}
                  >
                    <span>{m.short}</span>
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800 gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-3.5 py-1.5 rounded-xl bg-[#242526] hover:bg-[#3a3b3c] border border-zinc-700/80 text-xs font-semibold text-zinc-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              onClick={() => handleApply()}
              className="flex-1 px-3.5 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-black shadow-md transition-colors text-center cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
