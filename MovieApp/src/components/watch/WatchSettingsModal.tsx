"use client";

import React from "react";
import { Settings, X } from "lucide-react";
import { PlaybackDiagnostics } from "@/components/watch/PlaybackDiagnostics";
import type { PlayerMetrics } from "@/types/stream";

interface WatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: PlayerMetrics;
  activeServer: string;
  dataUsedMb: number;
  onSelectServer?: (serverId: string) => void;
}

export function WatchSettingsModal({
  isOpen,
  onClose,
  metrics,
  activeServer,
  dataUsedMb,
  onSelectServer,
}: WatchSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-14 py-3 border-t border-zinc-800 bg-[#18191a] animate-in fade-in">
      <div className="rounded-2xl bg-[#242526] p-4 sm:p-5 border border-zinc-700/80 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-700/80 pb-2.5">
          <h4 className="font-heading text-xs sm:text-sm font-bold text-white flex items-center gap-2">
            <Settings className="h-4 w-4 text-[#E50914]" />
            <span>Mobile Data Guard &amp; Stream Diagnostics</span>
          </h4>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Delegated to PlaybackDiagnostics */}
        <PlaybackDiagnostics
          metrics={metrics}
          activeServer={activeServer}
          dataUsedMb={dataUsedMb}
          onSelectServer={onSelectServer}
        />
      </div>
    </div>
  );
}
