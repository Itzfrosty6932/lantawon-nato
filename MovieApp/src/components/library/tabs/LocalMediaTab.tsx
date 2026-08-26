"use client";

import React from "react";
import Link from "next/link";
import { HardDrive, Play, Trash2 } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import type { LocalScannedMediaRecord } from "@/types/storage";

interface LocalMediaTabProps {
  localFiles: LocalScannedMediaRecord[];
  onScanLocalFolder: () => void;
  onOpenMatchCorrection: (file: LocalScannedMediaRecord) => void;
  onRemoveItem: (id: string, type: "watchlist" | "favorite" | "local") => void;
}

export function LocalMediaTab({
  localFiles,
  onScanLocalFolder,
  onOpenMatchCorrection,
  onRemoveItem,
}: LocalMediaTabProps) {
  if (localFiles.length === 0) {
    return (
      <div className="rounded-2xl bg-[#18191a]/40 p-8 text-center border border-zinc-800/80">
        <HardDrive className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-white">No Local Media Files Indexed</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-4">
          Click &ldquo;Scan Local Folder&rdquo; to pick your local Movies or Series directory for
          zero-network offline playback.
        </p>
        <button
          onClick={onScanLocalFolder}
          className="rounded-xl bg-white hover:bg-zinc-200 px-4 py-2 text-xs font-bold text-zinc-950 shadow-md transition-colors"
        >
          Choose Local Folder to Scan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {localFiles.map((file: LocalScannedMediaRecord, idx: number) => (
        <div
          key={`local_${file.downloadId}_${idx}`}
          className="flex items-center justify-between p-3.5 rounded-xl bg-[#18191a] gap-3 flex-wrap border border-zinc-800/80 hover:border-zinc-600 transition-all shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-[#242526] border border-zinc-700/80 flex items-center justify-center text-zinc-300 shrink-0">
              <HardDrive className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate">{file.title}</span>
                {file.matchConfidence !== undefined && (
                  <span
                    className={`rounded px-1.5 py-0.2 text-[9px] font-mono font-bold ${
                      (file.matchConfidence || 0) >= 95
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : (file.matchConfidence || 0) >= 85
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {file.matchConfidence}% Match
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
                <span className="font-mono text-zinc-300">{file.quality}</span>
                <span>• {file.sizeFormatted}</span>
                <span className="truncate max-w-xs text-zinc-500 font-mono">
                  {file.fullRelativePath}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                audioFX.playClick();
                onOpenMatchCorrection(file);
              }}
              className="flex items-center gap-1 rounded-xl border border-zinc-700/80 bg-[#242526] hover:bg-[#3a3b3c] px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
            >
              <span>✎ Fix Match</span>
            </button>
            <Link
              href={`/watch/${file.id}?localId=${file.downloadId}&type=${file.mediaType}`}
              onClick={() => audioFX.playClick()}
              className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-zinc-200 px-3.5 py-1.5 text-xs font-bold text-zinc-950 shadow-md transition-colors"
            >
              <Play className="h-3.5 w-3.5 fill-current" /> Play Offline
            </Link>
            <button
              onClick={() => onRemoveItem(file.downloadId, "local")}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 transition-colors"
              title="Remove Local Index"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
