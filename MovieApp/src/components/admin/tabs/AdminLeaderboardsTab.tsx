"use client";

import React, { useState, useEffect } from "react";
import { Trophy, Loader2, Crown, Medal, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";

interface LeaderboardRow {
  id: string;
  username: string | null;
  display_name: string;
  avatar_emoji: string | null;
  xp_total: number;
  current_level: number;
}

type BoardKey = "xp" | "level";

const LEVEL_TITLES: Array<{ minLevel: number; title: string; color: string }> = [
  { minLevel: 25, title: "Cine Legend", color: "text-fuchsia-400" },
  { minLevel: 15, title: "Silver Screen Veteran", color: "text-amber-400" },
  { minLevel: 8, title: "Marathoner", color: "text-emerald-400" },
  { minLevel: 3, title: "Binge Watcher", color: "text-blue-400" },
  { minLevel: 1, title: "The New Arrival", color: "text-zinc-400" },
];

const rankTitle = (level: number) =>
  LEVEL_TITLES.find((t) => level >= t.minLevel) ?? LEVEL_TITLES[LEVEL_TITLES.length - 1];

export function AdminLeaderboardsTab() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState<BoardKey>("xp");

  const loadBoard = async () => {
    setLoading(true);
    // Read-only over profiles — RLS allows authenticated reads of public
    // ranking data. No RPC needed.
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_emoji, xp_total, current_level")
      .order(board === "xp" ? "xp_total" : "current_level", { ascending: false })
      .order("xp_total", { ascending: false }) // tiebreak always by XP
      .limit(100);

    if (error) {
      console.error("Error loading leaderboard:", error);
      showToast("❌ Failed to load leaderboard", "error");
      setRows([]);
    } else {
      setRows((data || []) as unknown as LeaderboardRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const rankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-amber-400" />;
    if (index === 1) return <Medal className="h-4 w-4 text-zinc-300" />;
    if (index === 2) return <Medal className="h-4 w-4 text-amber-700" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Leaderboards</h2>
          <p className="text-sm text-zinc-400 mt-1">
            XP totals come from the auditable xp_events ledger — levels are derived
            server-side (Level = √(XP/100) + 1).
          </p>
        </div>
        <button
          onClick={() => {
            audioFX.playClick();
            loadBoard();
          }}
          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Board switcher */}
      <div className="flex gap-2">
        {(
          [
            { key: "xp", label: "Top XP" },
            { key: "level", label: "Top Level" },
          ] as Array<{ key: BoardKey; label: string }>
        ).map((b) => (
          <button
            key={b.key}
            onClick={() => {
              audioFX.playClick();
              setBoard(b.key);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              board === b.key
                ? "bg-[#E50914] text-white"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No ranked viewers yet</p>
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3 w-16">Rank</th>
                <th className="px-4 py-3">Viewer</th>
                <th className="px-4 py-3 hidden sm:table-cell">Title</th>
                <th className="px-4 py-3 text-right">Level</th>
                <th className="px-4 py-3 text-right">Total XP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const title = rankTitle(row.current_level);
                return (
                  <tr
                    key={row.id}
                    className="border-b border-zinc-900 last:border-0 hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-mono font-bold text-white">
                        {rankIcon(i)}
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span className="text-lg">{row.avatar_emoji || "🎬"}</span>
                        <span className="font-bold text-white">
                          {row.username || row.display_name}
                        </span>
                      </span>
                    </td>
                    <td className={`px-4 py-3 hidden sm:table-cell font-bold ${title.color}`}>
                      {title.title}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      Lv.{row.current_level}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      {row.xp_total.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
