"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  HardDrive,
  FolderOpen,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileVideo,
  Trash2,
  Search,
  ChevronRight,
  Film,
  Tv,
  Loader2,
  Info,
} from "lucide-react";
import { LocalScannerService } from "@/features/library/local-scanner";
import { db } from "@/lib/db/dexie-db";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { MatchCorrectionModal } from "@/components/library/MatchCorrectionModal";
import type { LocalScannedMediaRecord } from "@/types/storage";

type MatchStatus = "confirmed" | "high_confidence" | "review_needed" | "ambiguous" | "unknown";

const MATCH_CONFIG: Record<MatchStatus, { label: string; color: string; icon: React.ReactNode }> = {
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  high_confidence: {
    label: "High Match",
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  review_needed: {
    label: "Review Needed",
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
  ambiguous: {
    label: "Ambiguous",
    color: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    icon: <HelpCircle className="h-3 w-3" />,
  },
  unknown: {
    label: "Unmatched",
    color: "text-zinc-400 border-zinc-700 bg-zinc-800",
    icon: <HelpCircle className="h-3 w-3" />,
  },
};

function formatSize(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function MediaTypeBadge({ type }: { type: string }) {
  const isMovie = type === "movie";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold font-mono border ${
        isMovie
          ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
          : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
      }`}
    >
      {isMovie ? <Film className="h-2.5 w-2.5" /> : <Tv className="h-2.5 w-2.5" />}
      {isMovie ? "MOVIE" : type === "anime" ? "ANIME" : "TV"}
    </span>
  );
}

function LocalMediaCard({
  item,
  onPlay,
  onCorrect,
  onDelete,
}: {
  item: LocalScannedMediaRecord;
  onPlay: (item: LocalScannedMediaRecord) => void;
  onCorrect: (item: LocalScannedMediaRecord) => void;
  onDelete: (item: LocalScannedMediaRecord) => void;
}) {
  const status = (item.matchStatus ?? "unknown") as MatchStatus;
  const cfg = MATCH_CONFIG[status] ?? MATCH_CONFIG.unknown;
  const confidence = item.matchConfidence ?? 0;
  const posterUrl = item.poster_path
    ? item.poster_path.startsWith("http")
      ? item.poster_path
      : `https://image.tmdb.org/t/p/w185${item.poster_path}`
    : null;

  return (
    <div className="group relative rounded-2xl bg-[#1e1f20] border border-zinc-800 hover:border-zinc-600 transition-all overflow-hidden flex flex-col">
      {/* Poster or file icon */}
      <div className="relative aspect-[2/3] bg-zinc-900 flex items-center justify-center overflow-hidden shrink-0">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <FileVideo className="h-12 w-12 text-zinc-700" />
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => { audioFX.playClick(); onPlay(item); }}
            className="h-11 w-11 rounded-full bg-[#E50914] flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
            title="Play locally"
          >
            <Play className="h-5 w-5 fill-white text-white ml-0.5" />
          </button>
        </div>
        {/* Quality badge */}
        {item.quality && (
          <div className="absolute top-2 right-2 bg-black/80 rounded-md px-1.5 py-0.5 text-[9px] font-mono font-bold text-zinc-300">
            {item.quality}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 flex-1">{item.title}</h3>
          <MediaTypeBadge type={item.mediaType} />
        </div>

        {item.year && (
          <div className="text-[10px] text-zinc-500">{item.year}</div>
        )}

        {item.season != null && item.episode != null && (
          <div className="text-[10px] text-zinc-400 font-mono">
            S{String(item.season).padStart(2, "0")}E{String(item.episode).padStart(2, "0")}
          </div>
        )}

        {/* Match status badge */}
        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border w-fit mt-0.5 ${cfg.color}`}>
          {cfg.icon} {cfg.label}
          {confidence > 0 && status !== "confirmed" && (
            <span className="opacity-60 ml-0.5">· {confidence}%</span>
          )}
        </span>

        <div className="text-[10px] text-zinc-600 truncate">{item.fileName}</div>
        <div className="text-[10px] text-zinc-600">{formatSize(item.sizeBytes)}</div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1.5 px-3 pb-3">
        <button
          onClick={() => { audioFX.playClick(); onPlay(item); }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white text-[11px] font-bold transition-colors"
        >
          <Play className="h-3.5 w-3.5 fill-white" /> Play
        </button>
        <button
          onClick={() => { audioFX.playClick(); onCorrect(item); }}
          className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] transition-colors border border-zinc-700"
          title="Fix metadata match"
        >
          <Search className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => { audioFX.playClick(); onDelete(item); }}
          className="py-1.5 px-2 rounded-lg bg-zinc-800 hover:bg-red-900/40 text-zinc-500 hover:text-red-400 text-[11px] transition-colors border border-zinc-700"
          title="Remove from vault"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function LocalVaultPage() {
  const { showToast } = useToast();
  const [files, setFiles] = useState<LocalScannedMediaRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv" | "anime">("all");
  const [filterMatch, setFilterMatch] = useState<"all" | "confirmed" | "low_confidence" | "unknown">("all");
  const [correctionItem, setCorrectionItem] = useState<LocalScannedMediaRecord | null>(null);

  const loadVault = useCallback(async () => {
    const stored = await db.localScannedMedia.orderBy("createdAt").reverse().toArray();
    setFiles(stored);
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const handleScan = async () => {
    setIsScanning(true);
    audioFX.playClick();
    try {
      const results = await LocalScannerService.scanDirectory();
      if (results.length === 0) {
        showToast("No supported video files found in selected folder.", "info");
      } else {
        showToast(`✅ Scanned ${results.length} file${results.length > 1 ? "s" : ""} — metadata resolved!`, "success");
        await loadVault();
      }
    } catch {
      showToast("Scan cancelled or failed. Please try again.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  const handlePlay = (item: LocalScannedMediaRecord) => {
    const url = `/watch/${item.id}?type=${item.mediaType === "anime" ? "tv" : item.mediaType}&localId=${item.downloadId}`;
    window.location.href = url;
  };

  const handleDelete = async (item: LocalScannedMediaRecord) => {
    await db.localScannedMedia.delete(item.downloadId);
    showToast(`"${item.title}" removed from Local Vault.`, "info");
    await loadVault();
  };

  const handleCorrectionSave = async () => {
    setCorrectionItem(null);
    await loadVault();
    showToast("Metadata match updated!", "success");
  };

  // Filtered list
  const filtered = files.filter((f) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      f.title.toLowerCase().includes(q) ||
      f.fileName.toLowerCase().includes(q) ||
      (f.year ?? "").includes(q);
    const matchesType = filterType === "all" || f.mediaType === filterType;
    const matchesStatus =
      filterMatch === "all" ||
      (filterMatch === "confirmed" &&
        (f.matchStatus === "confirmed" || f.matchStatus === "high_confidence")) ||
      (filterMatch === "low_confidence" && (f.matchStatus === "review_needed" || f.matchStatus === "ambiguous")) ||
      (filterMatch === "unknown" &&
        (f.matchStatus === "unknown" || !f.matchStatus));
    return matchesQuery && matchesType && matchesStatus;
  });

  const totalSize = files.reduce((acc, f) => acc + (f.sizeBytes ?? 0), 0);
  const confirmedCount = files.filter(
    (f) => f.matchStatus === "confirmed" || f.matchStatus === "high_confidence"
  ).length;
  const lowCount = files.filter((f) => f.matchStatus === "review_needed" || f.matchStatus === "ambiguous").length;
  const unmatchedCount = files.filter(
    (f) => !f.matchStatus || f.matchStatus === "unknown"
  ).length;

  return (
    <div className="min-h-screen space-y-6">
      {/* ── Page Header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/library" className="hover:text-white transition-colors">My Library</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-300">Local Media Vault</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-heading tracking-tight">
                Local Media Vault
              </h1>
              <p className="text-xs text-zinc-500">
                Offline playback of your personal media files
              </p>
            </div>
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors shadow-lg self-start sm:self-auto"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FolderOpen className="h-4 w-4" />
            )}
            {isScanning ? "Scanning…" : "Open Folder"}
          </button>
        </div>
      </div>

      {/* ── Stats Row ── */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Files", value: String(files.length), color: "text-white" },
            { label: "Vault Size", value: formatSize(totalSize), color: "text-violet-400" },
            { label: "Confirmed Match", value: String(confirmedCount), color: "text-emerald-400" },
            {
              label: "Needs Review",
              value: String(lowCount + unmatchedCount),
              color: lowCount + unmatchedCount > 0 ? "text-amber-400" : "text-emerald-400",
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 space-y-0.5">
              <div className="text-[10px] text-zinc-500">{s.label}</div>
              <div className={`font-mono font-black text-lg ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── How it works info banner ── */}
      <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-4 flex gap-3 text-xs text-zinc-400 leading-relaxed">
        <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="text-white font-semibold">How the Local Vault works: </span>
          Click <strong>Open Folder</strong> to select a folder on your device. Supported formats: MP4, MKV, WebM, MOV, AVI, M4V, TS.
          Files are parsed, titles are matched against TMDB, and you can play them offline without any internet. 
          Files never leave your device.
        </div>
      </div>

      {/* ── Filters & Search ── */}
      {files.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your vault…"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(["all", "movie", "tv", "anime"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all capitalize ${
                  filterType === t
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Match filter */}
          <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
            {(["all", "confirmed", "low_confidence", "unknown"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setFilterMatch(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filterMatch === m
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m === "all" ? "All" : m === "confirmed" ? "✅ Matched" : m === "low_confidence" ? "⚠️ Low" : "❓ Unknown"}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={() => { audioFX.playClick(); loadVault(); }}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Refresh vault"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Grid or Empty State ── */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map((item) => (
            <LocalMediaCard
              key={item.downloadId}
              item={item}
              onPlay={handlePlay}
              onCorrect={setCorrectionItem}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : files.length === 0 ? (
        // ── Empty vault state ──
        <div className="flex flex-col items-center justify-center py-24 gap-6">
          <div className="h-20 w-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <HardDrive className="h-10 w-10 text-violet-400" />
          </div>
          <div className="text-center max-w-sm space-y-2">
            <h2 className="text-xl font-black text-white">Your Local Vault is Empty</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Click <strong className="text-white">Open Folder</strong> to scan a folder on your device.
              Lantawon will automatically identify your files and match them to the catalog.
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold transition-colors shadow-lg"
          >
            {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderOpen className="h-4 w-4" />}
            {isScanning ? "Scanning…" : "Open Folder to Start"}
          </button>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-zinc-600">
            {[".mp4", ".mkv", ".webm", ".mov", ".avi", ".m4v", ".ts"].map((ext) => (
              <span key={ext} className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 font-mono">{ext}</span>
            ))}
          </div>
        </div>
      ) : (
        // No results after filter
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <FileVideo className="h-10 w-10 text-zinc-700" />
          <div className="text-sm font-bold text-zinc-400">No files match your filters</div>
          <button
            onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterMatch("all"); }}
            className="text-xs text-[#E50914] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Match Correction Modal ── */}
      {correctionItem && (
        <MatchCorrectionModal
          item={correctionItem}
          onClose={() => setCorrectionItem(null)}
          onMatchUpdated={handleCorrectionSave}
        />
      )}
    </div>
  );
}
