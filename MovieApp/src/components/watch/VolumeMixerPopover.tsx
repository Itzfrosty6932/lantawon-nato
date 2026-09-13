"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sliders, X, RotateCcw, Zap } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface VolumeMixerPopoverProps {
  volumeBoost: number;
  onVolumeBoostChange: (boost: number) => void;
  isOpen: boolean;
  onClose: () => void;
  isPlaying?: boolean;
  isTabAudioHooked?: boolean;
  onToggleTabAudioHook?: () => void;
  isTabAudioSupported?: boolean;
}

export function VolumeMixerPopover({
  volumeBoost,
  onVolumeBoostChange,
  isOpen,
  onClose,
  isPlaying = true,
  isTabAudioHooked = false,
  onToggleTabAudioHook,
  isTabAudioSupported = true,
}: VolumeMixerPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [isPointerActive, setIsPointerActive] = useState(false);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate dB gain equivalent
  // Gain factor = boost / 100
  // dB = 20 * log10(gain)
  const gainFactor = volumeBoost / 100;
  const gainDb = (20 * Math.log10(gainFactor)).toFixed(1);
  const isBoosted = volumeBoost > 100;

  // VU meter active segment counts (10 segments total)
  // At 100%: 4 segments lit. At 300%: 10 segments lit.
  const normalizedLevel = (volumeBoost - 100) / 200; // 0 to 1
  const activeSegments = Math.round(4 + normalizedLevel * 6);

  const presets = [
    { label: "100%", sub: "0 dB", value: 100 },
    { label: "150%", sub: "+3.5 dB", value: 150 },
    { label: "200%", sub: "+6.0 dB", value: 200 },
    { label: "300%", sub: "MAX", value: 300 },
  ];

  const updateFromPointer = (clientY: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    // 0 at bottom, 1 at top
    const ratio = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
    const rawVal = 100 + ratio * 200;
    const stepped = Math.round(rawVal / 5) * 5;
    onVolumeBoostChange(Math.max(100, Math.min(300, stepped)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    setIsPointerActive(true);
    updateFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    updateFromPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPointerActive(false);
    audioFX.playPop();
  };

  const handlePresetClick = (val: number) => {
    audioFX.playClick();
    onVolumeBoostChange(val);
  };

  const handleReset = () => {
    audioFX.playClick();
    onVolumeBoostChange(100);
  };

  // Percentage for fader knob positioning
  const faderPercentage = ((volumeBoost - 100) / 200) * 100;

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-12 sm:top-14 right-0 z-50 w-72 sm:w-84 rounded-2xl bg-zinc-950/95 border border-zinc-700/80 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 text-white animate-in zoom-in-95 duration-150 select-none shadow-black/90"
    >
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isBoosted ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/40" : "bg-zinc-800 text-zinc-400"}`}>
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-200">
              Studio Pre-Amp Mixer
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
              <span>Gain:</span>
              <span className={`font-bold ${isBoosted ? "text-amber-400" : "text-zinc-300"}`}>
                +{gainDb} dB ({volumeBoost}%)
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            audioFX.playClick();
            onClose();
          }}
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          aria-label="Close mixer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ─── MAIN CONSOLE: VU METER + VERTICAL FADER ─── */}
      <div className="flex items-center justify-between gap-4 py-2.5 px-3 bg-black/50 rounded-xl border border-zinc-800/90 mb-3.5">
        {/* Stereo VU Meter Simulation */}
        <div className="flex flex-col items-center gap-1.5 px-2">
          <span className="text-[9px] font-mono font-bold text-zinc-400 tracking-wider">VU METERS</span>
          <div className="flex gap-2 h-40 items-end py-1">
            {/* Left Channel */}
            <div className="w-3.5 h-full flex flex-col-reverse justify-start gap-1 p-0.5 rounded bg-zinc-950 border border-zinc-800">
              {Array.from({ length: 10 }).map((_, i) => {
                const isLit = i < activeSegments;
                let color = "bg-emerald-500";
                if (i >= 6 && i < 8) color = "bg-amber-400";
                if (i >= 8) color = "bg-rose-500";
                return (
                  <div
                    key={i}
                    className={`w-full h-2.5 rounded-xs transition-opacity duration-75 ${
                      isLit
                        ? `${color} opacity-100 shadow-[0_0_4px_currentColor]`
                        : "bg-zinc-800/40 opacity-20"
                    }`}
                  />
                );
              })}
            </div>

            {/* Right Channel */}
            <div className="w-3.5 h-full flex flex-col-reverse justify-start gap-1 p-0.5 rounded bg-zinc-950 border border-zinc-800">
              {Array.from({ length: 10 }).map((_, i) => {
                const isLit = i < activeSegments;
                let color = "bg-emerald-500";
                if (i >= 6 && i < 8) color = "bg-amber-400";
                if (i >= 8) color = "bg-rose-500";
                return (
                  <div
                    key={i}
                    className={`w-full h-2.5 rounded-xs transition-opacity duration-75 ${
                      isLit
                        ? `${color} opacity-100 shadow-[0_0_4px_currentColor]`
                        : "bg-zinc-800/40 opacity-20"
                    }`}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 text-[8px] font-mono text-zinc-400 font-bold">
            <span>L</span>
            <span>R</span>
          </div>
        </div>

        {/* ─── TACTILE VERTICAL FADER CHANNEL ─── */}
        <div className="flex-1 flex flex-col items-center justify-between h-44 relative px-2">
          {/* Top Scale Notch */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="text-rose-400 font-bold">300% (MAX)</span>
            <span className="text-[9px] text-zinc-400">+9.5 dB</span>
          </div>

          {/* Interactive Fader Rail */}
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full h-28 my-1 flex items-center justify-center cursor-ns-resize touch-none"
          >
            {/* Recessed Center Track Slot */}
            <div className="w-2 h-full bg-zinc-900 rounded-full border border-zinc-800 relative overflow-hidden shadow-inner">
              {/* Active fill from bottom */}
              <div
                className={`absolute bottom-0 left-0 right-0 rounded-full transition-all ${
                  isBoosted ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ height: `${faderPercentage}%` }}
              />
            </div>

            {/* Tick Mark Lines */}
            <div className="absolute left-6 inset-y-0 flex flex-col justify-between py-1 pointer-events-none opacity-40">
              <span className="text-[8px] font-mono text-zinc-400">- +6dB</span>
              <span className="text-[8px] font-mono text-zinc-400">- +3dB</span>
              <span className="text-[8px] font-mono text-zinc-400">- 0dB</span>
            </div>

            {/* Studio Fader Knob Handle */}
            <div
              className={`absolute left-1/2 -translate-x-1/2 w-14 sm:w-16 h-7 rounded-lg border flex flex-col items-center justify-center transition-transform ${
                isPointerActive ? "scale-105 shadow-amber-500/30" : "hover:scale-102"
              } bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 border-zinc-500/60 shadow-xl shadow-black/80 pointer-events-none`}
              style={{
                bottom: `calc(${faderPercentage}% - 14px)`,
              }}
            >
              {/* Grip Ridges */}
              <div className="w-8 h-0.5 bg-zinc-800 mb-0.5 rounded-full" />
              {/* Glowing Center Position Line */}
              <div
                className={`w-10 h-0.5 rounded-full transition-colors ${
                  isBoosted ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]" : "bg-white"
                }`}
              />
              <div className="w-8 h-0.5 bg-zinc-800 mt-0.5 rounded-full" />
            </div>
          </div>

          {/* Bottom Scale Notch */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="text-zinc-300 font-medium">100% (Unity)</span>
            <span className="text-[9px] text-zinc-400">0.0 dB</span>
          </div>
        </div>
      </div>

      {/* ─── QUICK GAIN PRESETS ─── */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {presets.map((p) => {
          const isSelected = volumeBoost === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePresetClick(p.value)}
              className={`py-1.5 px-1 rounded-xl text-center font-mono transition-all border cursor-pointer ${
                isSelected
                  ? "bg-amber-500/25 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-500/15"
                  : "bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              <div className="text-[11px] font-bold">{p.label}</div>
              <div className="text-[8px] text-zinc-400">{p.sub}</div>
            </button>
          );
        })}
      </div>

      {/* ─── TAB AUDIO BYPASS HOOK (FOR 300% MIRRORS) ─── */}
      {isTabAudioSupported && onToggleTabAudioHook && (
        <div className="mb-3 p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px]">
          {isTabAudioHooked ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-bold text-emerald-300 truncate">
                  Tab Audio Hook Active (300% Boosted)
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleTabAudioHook}
                className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono shrink-0 cursor-pointer transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleTabAudioHook}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-[11px] transition-all cursor-pointer shadow-sm active:scale-98"
            >
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
              <span>Connect Tab Audio (300% Boost for Mirrors)</span>
            </button>
          )}
          <p className="text-[9px] text-zinc-400 mt-1 leading-tight">
            {isTabAudioHooked
              ? "All mirror audio routed through Web Audio Gain & Limiter."
              : "Bypasses browser cross-origin limits to amplify stream up to 3x louder."}
          </p>
        </div>
      )}

      {/* ─── FOOTER & RESET ─── */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] text-zinc-400 font-mono">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-zinc-400"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset to 100%</span>
        </button>

        <div className="flex items-center gap-1 text-emerald-400">
          <Zap className="h-3 w-3" />
          <span className="font-bold">Studio Pre-Amp</span>
        </div>
      </div>
    </div>
  );
}
