"use client";

import React from "react";
import { Keyboard, X } from "lucide-react";

interface HeaderShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { label: "Search Anywhere", key: "/" },
  { label: "Keyboard Help", key: "?" },
  { label: "Close Modal / Dropdown", key: "Esc" },
  { label: "Play / Pause Stream", key: "Space / K" },
  { label: "Seek ±10 Seconds", key: "← / →" },
  { label: "Fullscreen Player", key: "F" },
  { label: "Mute / Unmute Audio", key: "M" },
  { label: "Switch Next Mirror", key: "S" },
];

export function HeaderShortcutsModal({ isOpen, onClose }: HeaderShortcutsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 space-y-4 bg-[#18191a]"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-zinc-400" /> Keyboard Shortcuts
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {SHORTCUTS.map((sc) => (
            <div key={sc.label} className="flex items-center justify-between py-1">
              <span className="text-zinc-300">{sc.label}</span>
              <kbd className="px-2 py-0.5 rounded bg-white/10 font-mono text-[10px] text-white border border-white/15">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
