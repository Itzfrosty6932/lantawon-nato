"use client";

import React, { ChangeEvent } from "react";
import {
  Sparkles,
  Zap,
  Server,
  Subtitles,
  Settings,
  BarChart2,
  Maximize,
  Minimize,
  Tv,
} from "lucide-react";
import { STREAM_SERVERS } from "@/lib/constants/streaming-servers";
import { audioFX } from "@/lib/audio/audio-fx";

interface CinemaControlBarProps {
  activeServer: string;
  isOfflineMode: boolean;
  playableCount: number;
  isServerDrawerOpen: boolean;
  isSettingsOpen: boolean;
  isTheaterMode?: boolean;
  isFullScreen?: boolean;
  dataUsedMb?: number;
  isDataSaver?: boolean;
  onAutoSelectBest: () => void;
  onSwitchNextServer: () => void;
  onToggleServerDrawer: () => void;
  onToggleSettings: () => void;
  onToggleTheaterMode?: () => void;
  onToggleFullScreen?: () => void;
  onSubtitleFile: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CinemaControlBar({
  activeServer,
  isOfflineMode,
  playableCount,
  isServerDrawerOpen,
  isSettingsOpen,
  isTheaterMode = false,
  isFullScreen = false,
  dataUsedMb = 0,
  isDataSaver = false,
  onAutoSelectBest,
  onSwitchNextServer,
  onToggleServerDrawer,
  onToggleSettings,
  onToggleTheaterMode,
  onToggleFullScreen,
  onSubtitleFile,
}: CinemaControlBarProps) {
  const currentServerObj = STREAM_SERVERS.find((s) => s.id === activeServer);
  const currentServerIdx = STREAM_SERVERS.findIndex((s) => s.id === activeServer);
  const currentServerLabel = currentServerIdx >= 0 ? `Server ${currentServerIdx + 1}` : "Live Stream";

  return (
    <div className="w-full px-3 sm:px-6 lg:px-10 py-2 sm:py-2.5 bg-[#141414] border-t border-zinc-800 select-none">
      {/* ─── MOBILE VIEW (< 640px) ─── */}
      <div className="flex sm:hidden flex-col gap-2">
        {/* Row 1: Server Identity & Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Active Server Info */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="min-w-0">
              <div className="font-bold text-xs text-white truncate">
                {currentServerLabel}
              </div>
            </div>
          </div>

          {/* Mirrors & Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isOfflineMode && (
              <button
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  onToggleServerDrawer();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  isServerDrawerOpen
                    ? "bg-white text-zinc-950 border-white"
                    : "bg-[#242526] text-zinc-200 border-zinc-700 hover:bg-zinc-700"
                }`}
              >
                <Server className="h-3 w-3 text-zinc-400" />
                <span>Mirrors ({playableCount}/{STREAM_SERVERS.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                audioFX.playClick();
                onToggleSettings();
              }}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isSettingsOpen
                  ? "bg-white text-zinc-950 border-white font-bold"
                  : "bg-[#242526] text-zinc-300 border-zinc-700 hover:bg-zinc-700"
              }`}
              title="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Quick Toggles (Auto-Fix, Next, Fullscreen, Data Meter) */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onAutoSelectBest}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#242526] hover:bg-[#E50914] text-zinc-200 hover:text-white border border-zinc-700 text-[11px] font-bold transition-all cursor-pointer shadow-sm"
            >
              <Zap className="h-3 w-3 text-amber-400 fill-current" />
              <span>Auto-Fix</span>
            </button>

            <button
              type="button"
              onClick={onSwitchNextServer}
              className="px-2 py-1 rounded-lg bg-[#242526] hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              Next
            </button>

            <button
              type="button"
              onClick={() => {
                audioFX.playClick();
                onToggleFullScreen?.();
              }}
              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                isFullScreen
                  ? "bg-[#E50914] text-white border-[#E50914]"
                  : "bg-[#242526] text-zinc-300 border-zinc-700"
              }`}
              title="Fullscreen"
            >
              {isFullScreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Right side data / quality badge on mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isDataSaver && (
              <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono text-amber-400 font-bold inline-flex items-center gap-0.5">
                <Zap className="h-2.5 w-2.5 fill-amber-400" /> Saver
              </span>
            )}

            {!isOfflineMode && (
              <span className="rounded-md bg-[#242526] border border-zinc-700/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-300 font-semibold inline-flex items-center gap-1">
                <BarChart2 className="h-2.5 w-2.5 text-emerald-400" />
                <span>{dataUsedMb} MB</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── DESKTOP & TABLET VIEW (>= 640px) ─── */}
      <div className="hidden sm:flex items-center justify-between gap-3 text-xs">
        {/* Left: Active Server & Quality */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-2 font-bold text-white">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span>{currentServerLabel}</span>
          </span>

          {isDataSaver ? (
            <span className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono text-amber-400 font-bold inline-flex items-center gap-1">
              <Zap className="h-3 w-3 fill-amber-400" /> Data Saver Active
            </span>
          ) : currentServerObj?.isCleanHd ? (
            <span className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-bold inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Direct Cloud HD · Fast CDN
            </span>
          ) : (
            <span className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 font-bold">
              1080p Full HD
            </span>
          )}

          {/* Live Data Usage Meter */}
          {!isOfflineMode && (
            <span
              className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 font-semibold inline-flex items-center gap-1"
              title="Estimated Mobile Data Consumed"
            >
              <BarChart2 className="h-3 w-3 text-emerald-400" />
              <span>{dataUsedMb} MB</span>
            </span>
          )}

          <button
            type="button"
            onClick={onAutoSelectBest}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#242526] hover:bg-[#E50914] text-zinc-200 hover:text-white border border-zinc-700/80 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
            title="Auto-switch to best verified clean mirror"
          >
            <Zap className="h-3 w-3 text-amber-400 fill-current" />
            <span>Auto-Fix</span>
          </button>

          <button
            type="button"
            onClick={onSwitchNextServer}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#242526] hover:bg-[#3a3b3c] text-zinc-300 border border-zinc-700/80 text-[11px] font-semibold transition-colors cursor-pointer"
            title="Switch to next mirror (Shortcut: S)"
          >
            <span>Next (S)</span>
          </button>
        </div>

        {/* Right: Server Drawer, Subtitles, Theater, Fullscreen, Settings */}
        <div className="flex items-center gap-2">
          {/* Theater Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onToggleTheaterMode?.();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
              isTheaterMode
                ? "bg-[#E50914] text-white border-[#E50914] font-bold shadow-lg shadow-[#E50914]/20"
                : "bg-[#242526] text-zinc-200 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
            }`}
            title="Toggle Theater Mode (T)"
          >
            <Tv className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Theater (T)</span>
          </button>

          {/* Fullscreen Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onToggleFullScreen?.();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
              isFullScreen
                ? "bg-[#E50914] text-white border-[#E50914] font-bold shadow-lg shadow-[#E50914]/20"
                : "bg-[#242526] text-zinc-200 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
            }`}
            title="Toggle Fullscreen (F)"
          >
            {isFullScreen ? (
              <Minimize className="h-3.5 w-3.5 text-white" />
            ) : (
              <Maximize className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span>{isFullScreen ? "Exit Full" : "Full Mode"}</span>
          </button>

          {/* Server Picker Drawer Toggle */}
          {!isOfflineMode && (
            <button
              type="button"
              onClick={() => {
                audioFX.playClick();
                onToggleServerDrawer();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border cursor-pointer ${
                isServerDrawerOpen
                  ? "bg-white text-zinc-950 border-white font-bold"
                  : "bg-[#242526] text-zinc-200 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
              }`}
              title="Open Streaming Mirrors Panel"
            >
              <Server className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                Mirrors ({playableCount}/{STREAM_SERVERS.length})
              </span>
            </button>
          )}

          {/* Subtitles (For local media files) */}
          {activeServer === "local" && (
            <label
              className="flex items-center gap-1.5 rounded-lg bg-[#242526] hover:bg-[#3a3b3c] border border-zinc-700/80 px-2.5 py-1.5 text-xs text-zinc-300 cursor-pointer hover:text-white transition-colors"
              title="Upload Custom Subtitles (.vtt / .srt)"
            >
              <Subtitles className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Subtitles</span>
              <input
                type="file"
                accept=".vtt,.srt"
                onChange={onSubtitleFile}
                className="hidden"
              />
            </label>
          )}

          {/* Settings Gear Button */}
          <button
            type="button"
            onClick={() => {
              audioFX.playClick();
              onToggleSettings();
            }}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isSettingsOpen
                ? "bg-white text-zinc-950 border-white font-bold"
                : "bg-[#242526] text-zinc-200 border-zinc-700/80 hover:bg-[#3a3b3c] hover:text-white"
            }`}
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5 text-zinc-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
