"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Sliders,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  Subtitles as SubtitlesIcon,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

export interface SubtitleAppearance {
  fontSize: number; // in px, e.g. 30
  backgroundBlur: number; // in %, e.g. 0 to 100
  color: { r: number; g: number; b: number };
  latency: number; // in seconds, e.g. 0
}

export const DEFAULT_SUBTITLE_APPEARANCE: SubtitleAppearance = {
  fontSize: 30,
  backgroundBlur: 0,
  color: { r: 255, g: 255, b: 255 },
  latency: 0,
};

export interface AudioTrack {
  id: string;
  label: string;
  language?: string;
  isDefault?: boolean;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  flag?: string;
  url?: string;
}

const POPULAR_LANGUAGES: Array<{ code: string; name: string; flag: string }> = [
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt-br", name: "Portuguese (BR)", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "pl", name: "Polish", flag: "🇵🇱" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "zh-cn", name: "Chinese (simplified)", flag: "🇨🇳" },
  { code: "zh-tw", name: "Chinese (traditional)", flag: "🇹🇼" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "tl", name: "Filipino (Tagalog)", flag: "🇵🇭" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "th", name: "Thai", flag: "🇹🇭" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
];

interface AudioSubtitlesModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioTracks?: AudioTrack[];
  selectedAudioId?: string;
  onSelectAudio?: (id: string) => void;
  subtitles?: SubtitleTrack[];
  selectedSubtitleId: string | null; // null or "off" for off
  onSelectSubtitle: (sub: SubtitleTrack | null) => void;
  onUploadSubtitleFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  appearance: SubtitleAppearance;
  onChangeAppearance: (app: SubtitleAppearance) => void;
  onSearchOpenSubtitles?: (languageCode: string, languageName: string) => void;
  onShowToast: (msg: string, type?: "info" | "success" | "error") => void;
}

type ModalView = "main" | "search" | "appearance";

export function AudioSubtitlesModal({
  isOpen,
  onClose,
  audioTracks = [],
  selectedAudioId = "default",
  onSelectAudio,
  subtitles = [],
  selectedSubtitleId,
  onSelectSubtitle,
  onUploadSubtitleFile,
  appearance,
  onChangeAppearance,
  onSearchOpenSubtitles,
  onShowToast,
}: AudioSubtitlesModalProps) {
  const [view, setView] = useState<ModalView>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [tempAppearance, setTempAppearance] = useState<SubtitleAppearance>(appearance);

  useEffect(() => {
    setTempAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    if (!isOpen) {
      setView("main");
      setSearchQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLanguages = POPULAR_LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveProfile = () => {
    audioFX.playPop();
    onChangeAppearance(tempAppearance);
    try {
      localStorage.setItem("lantawon_subtitle_appearance", JSON.stringify(tempAppearance));
    } catch {}
    onShowToast("Subtitle appearance saved to profile!", "success");
    setView("main");
  };

  const handleResetAppearance = () => {
    audioFX.playClick();
    setTempAppearance(DEFAULT_SUBTITLE_APPEARANCE);
    onChangeAppearance(DEFAULT_SUBTITLE_APPEARANCE);
    try {
      localStorage.removeItem("lantawon_subtitle_appearance");
    } catch {}
    onShowToast("Subtitle appearance reset to default", "info");
  };

  const colorHex = `rgb(${tempAppearance.color.r}, ${tempAppearance.color.g}, ${tempAppearance.color.b})`;

  return (
    <div
      className="absolute top-14 right-4 sm:right-6 z-50 animate-in fade-in zoom-in-95 duration-200"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-[340px] sm:w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#141517]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/80 text-white overflow-hidden select-none transition-all">
        {/* ─── VIEW 1: MAIN 2-COLUMN VIEW ─── */}
        {view === "main" && (
          <div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 min-h-[140px]">
                {/* Left Column: AUDIO */}
                <div className="space-y-3">
                  <div className="text-[11px] font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Audio</span>
                  </div>

                  {audioTracks.length > 0 ? (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-none pr-1">
                      {audioTracks.map((track) => {
                        const isSelected = selectedAudioId === track.id;
                        return (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => {
                              audioFX.playClick();
                              onSelectAudio?.(track.id);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                                : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <span className="truncate">{track.label}</span>
                            {isSelected && <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[120px] flex flex-col items-center justify-center text-center p-2 text-zinc-400 text-xs leading-relaxed">
                      <p>No audio tracks available</p>
                    </div>
                  )}
                </div>

                {/* Right Column: SUBTITLES */}
                <div className="space-y-3">
                  <div className="text-[11px] font-mono font-bold tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                    <SubtitlesIcon className="h-3.5 w-3.5 text-zinc-400" />
                    <span>Subtitles</span>
                  </div>

                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-none pr-1">
                    {/* "Off" option */}
                    <button
                      type="button"
                      onClick={() => {
                        audioFX.playClick();
                        onSelectSubtitle(null);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        !selectedSubtitleId || selectedSubtitleId === "off"
                          ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                          : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span>Off</span>
                      {(!selectedSubtitleId || selectedSubtitleId === "off") && (
                        <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1" />
                      )}
                    </button>

                    {/* Loaded Subtitles */}
                    {subtitles.map((sub) => {
                      const isSelected = selectedSubtitleId === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            audioFX.playClick();
                            onSelectSubtitle(sub);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-white/20 text-white font-bold border border-white/20 shadow-sm"
                              : "bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            {sub.flag && <span>{sub.flag}</span>}
                            <span>{sub.label}</span>
                          </span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-white shrink-0 ml-1" />}
                        </button>
                      );
                    })}

                    {subtitles.length === 0 && (
                      <div className="py-2 text-center text-zinc-400 text-xs">
                        No subtitles available
                      </div>
                    )}

                    {/* Upload Subtitles Button */}
                    <label
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-zinc-600 hover:border-zinc-400 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer transition-all mt-2"
                      title="Upload custom .vtt or .srt subtitle file"
                    >
                      <Upload className="h-3.5 w-3.5 shrink-0" />
                      <span>Upload subtitles</span>
                      <input
                        type="file"
                        accept=".vtt,.srt"
                        onChange={onUploadSubtitleFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-white/10 w-full" />

            {/* Bottom Actions */}
            <div className="p-2 space-y-0.5">
              {/* Search on OpenSubtitles */}
              <button
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setView("search");
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Search className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span>Search on OpenSubtitles</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>

              {/* Customize appearance */}
              <button
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setView("appearance");
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span>Customize appearance</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* ─── VIEW 2: SEARCH ON OPENSUBTITLES / LANGUAGE SELECTION ─── */}
        {view === "search" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Top Navigation */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setView("main");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back to subtitles</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-black/40 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 transition-colors"
                autoFocus
              />
            </div>

            {/* Language List */}
            <div className="space-y-1 max-h-[260px] overflow-y-auto scrollbar-none pr-1">
              {filteredLanguages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    audioFX.playPop();
                    const newSub: SubtitleTrack = {
                      id: `sub_${lang.code}`,
                      label: `${lang.name}`,
                      language: lang.code,
                      flag: lang.flag,
                    };
                    onSelectSubtitle(newSub);
                    onSearchOpenSubtitles?.(lang.code, lang.name);
                    onShowToast(`Selected ${lang.flag} ${lang.name} subtitles`, "success");
                    setView("main");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {selectedSubtitleId === `sub_${lang.code}` && (
                    <Check className="h-3.5 w-3.5 text-white" />
                  )}
                </button>
              ))}

              {filteredLanguages.length === 0 && (
                <div className="py-6 text-center text-xs text-zinc-500">
                  No matching languages found
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── VIEW 3: CUSTOMIZE APPEARANCE ─── */}
        {view === "appearance" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Top Navigation */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  audioFX.playClick();
                  setView("main");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Back to subtitles</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Subtitle Live Preview Box */}
            <div
              className="rounded-xl p-3 text-center transition-all flex items-center justify-center min-h-[56px] border border-white/5"
              style={{
                backgroundColor: `rgba(0, 0, 0, ${tempAppearance.backgroundBlur / 100})`,
                backdropFilter: `blur(${Math.round(tempAppearance.backgroundBlur / 10)}px)`,
              }}
            >
              <span
                style={{
                  fontSize: `${Math.max(14, Math.min(tempAppearance.fontSize, 28))}px`,
                  color: colorHex,
                  textShadow: "0 2px 4px rgba(0,0,0,0.9)",
                  fontWeight: 600,
                }}
              >
                Sample Subtitle Preview
              </span>
            </div>

            {/* 1. Font Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="uppercase font-bold tracking-wider">Font Size</span>
                <span className="text-white font-bold">{tempAppearance.fontSize}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="54"
                step="2"
                value={tempAppearance.fontSize}
                onChange={(e) =>
                  setTempAppearance({ ...tempAppearance, fontSize: Number(e.target.value) })
                }
                className="w-full accent-white h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            {/* 2. Background Blur / Opacity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                <span className="uppercase font-bold tracking-wider">Background Blur</span>
                <span className="text-white font-bold">{tempAppearance.backgroundBlur}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={tempAppearance.backgroundBlur}
                onChange={(e) =>
                  setTempAppearance({ ...tempAppearance, backgroundBlur: Number(e.target.value) })
                }
                className="w-full accent-white h-1.5 bg-white/20 rounded-lg cursor-pointer"
              />
            </div>

            {/* 3. Color Selection */}
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-zinc-400 uppercase font-bold tracking-wider">
                Color
              </div>
              <div className="flex items-center gap-2">
                {/* Preview swatch */}
                <div
                  className="h-8 w-8 rounded-full border border-white/20 shrink-0 shadow-inner"
                  style={{ backgroundColor: colorHex }}
                />

                {/* RGB numeric inputs */}
                <div className="flex items-center gap-1.5 flex-1">
                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 flex-1">
                    <span className="text-[10px] text-zinc-500 font-mono mr-1">R</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={tempAppearance.color.r}
                      onChange={(e) =>
                        setTempAppearance({
                          ...tempAppearance,
                          color: {
                            ...tempAppearance.color,
                            r: Math.max(0, Math.min(255, Number(e.target.value) || 0)),
                          },
                        })
                      }
                      className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 flex-1">
                    <span className="text-[10px] text-zinc-500 font-mono mr-1">G</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={tempAppearance.color.g}
                      onChange={(e) =>
                        setTempAppearance({
                          ...tempAppearance,
                          color: {
                            ...tempAppearance.color,
                            g: Math.max(0, Math.min(255, Number(e.target.value) || 0)),
                          },
                        })
                      }
                      className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-2 py-1 flex-1">
                    <span className="text-[10px] text-zinc-500 font-mono mr-1">B</span>
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={tempAppearance.color.b}
                      onChange={(e) =>
                        setTempAppearance({
                          ...tempAppearance,
                          color: {
                            ...tempAppearance.color,
                            b: Math.max(0, Math.min(255, Number(e.target.value) || 0)),
                          },
                        })
                      }
                      className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1">
                {[
                  { name: "White", rgb: { r: 255, g: 255, b: 255 } },
                  { name: "Yellow", rgb: { r: 255, g: 235, b: 59 } },
                  { name: "Cyan", rgb: { r: 0, g: 229, b: 255 } },
                  { name: "Green", rgb: { r: 105, g: 240, b: 174 } },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      audioFX.playClick();
                      setTempAppearance({ ...tempAppearance, color: preset.rgb });
                    }}
                    className="flex-1 py-1 rounded-lg text-[10px] font-medium border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Latency */}
            <div className="space-y-1 pt-1">
              <div className="text-[11px] font-mono text-zinc-400 uppercase font-bold tracking-wider">
                Latency / Delay
              </div>
              <div className="text-xs text-zinc-400">
                {selectedSubtitleId && selectedSubtitleId !== "off"
                  ? `${tempAppearance.latency > 0 ? `+${tempAppearance.latency}` : tempAppearance.latency}s sync offset`
                  : "You haven't selected caption"}
              </div>
              {selectedSubtitleId && selectedSubtitleId !== "off" && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setTempAppearance({
                        ...tempAppearance,
                        latency: Math.round((tempAppearance.latency - 0.5) * 10) / 10,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono"
                  >
                    -0.5s
                  </button>
                  <span className="flex-1 text-center font-mono text-xs font-bold text-white">
                    {tempAppearance.latency}s
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setTempAppearance({
                        ...tempAppearance,
                        latency: Math.round((tempAppearance.latency + 0.5) * 10) / 10,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono"
                  >
                    +0.5s
                  </button>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleResetAppearance}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                className="w-full py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-white/10"
              >
                Save to profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
