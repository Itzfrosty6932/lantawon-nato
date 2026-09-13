"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Sparkles, X, Sliders, Zap, RotateCcw } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface VolumeMixerPopoverProps {
  volumeBoost: number;
  onVolumeBoostChange: (boost: number) => void;
  isOpen: boolean;
  onClose: () => void;
  isPlaying?: boolean;
}

export function VolumeMixerPopover({
  volumeBoost,
  onVolumeBoostChange,
  isOpen,
  onClose,
  isPlaying = true,
}: VolumeMixerPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    onVolumeBoostChange(val);
  };

  const handlePresetClick = (val: number) => {
    audioFX.playClick();
    onVolumeBoostChange(val);
  };

  const handleReset = () => {
    audioFX.playClick();
    onVolumeBoostChange(100);
  };

  return (
    <div
      ref={containerRef}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-12 sm:top-14 right-0 z-50 w-72 sm:w-80 rounded-2xl bg-zinc-950/95 border border-zinc-700/80 backdrop-blur-2xl shadow-2xl p-4 sm:p-5 text-white animate-in zoom-in-95 duration-150 select-none shadow-black/90"
    >
      {/* ─── HEADER ─── */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isBoosted ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-zinc-200">
              Audio Pre-Amp Mixer
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
          className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          aria-label="Close mixer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ─── MAIN CONSOLE: VU METER + VERTICAL FADER ─── */}
      <div className="flex items-center justify-between gap-4 py-2 px-2 bg-black/40 rounded-xl border border-zinc-800/80 mb-3.5">
        {/* Stereo VU Meter Simulation */}
        <div className="flex flex-col items-center gap-1.5 px-2">
          <span className="text-[9px] font-mono font-bold text-zinc-400 tracking-wider">VU METERS</span>
          <div className="flex gap-2 h-36 sm:h-40 items-end py-1">
            {/* Left Channel */}
            <div className="w-3 h-full flex flex-col-reverse justify-start gap-0.5 p-0.5 rounded bg-zinc-900 border border-zinc-800">
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
                        : "bg-zinc-800/40 opacity-30"
                    }`}
                  />
                );
              })}
            </div>

            {/* Right Channel */}
            <div className="w-3 h-full flex flex-col-reverse justify-start gap-0.5 p-0.5 rounded bg-zinc-900 border border-zinc-800">
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
                        : "bg-zinc-800/40 opacity-30"
                    }`}
                  />
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 text-[8px] font-mono text-zinc-400 font-bold">
            <span>L</span>
            <span>R</span>
          </div>
        </div>

        {/* ─── VERTICAL FADER CHANNEL ─── */}
        <div className="flex-1 flex flex-col items-center justify-between h-36 sm:h-40 relative px-3">
          {/* Scale Notches */}
          <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span className="text-rose-400 font-bold">300% (MAX)</span>
            <span className="text-[9px] text-zinc-400">+9.5 dB</span>
          </div>

          <div className="relative w-full flex-1 flex items-center justify-center my-2">
            {/* Custom Vertical Slider */}
            <input
              type="range"
              min="100"
              max="300"
              step="5"
              value={volumeBoost}
              onChange={handleSliderChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => {
                setIsDragging(false);
                audioFX.playPop();
              }}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => {
                setIsDragging(false);
                audioFX.playPop();
              }}
              className="w-28 sm:w-32 h-3 appearance-none bg-zinc-800 rounded-full outline-none cursor-pointer -rotate-90 origin-center accent-amber-500 hover:accent-amber-400"
              aria-label="Volume Boost Slider"
            />
          </div>

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
              className={`py-1.5 px-1 rounded-xl text-center font-mono transition-all border ${
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
