import { Crown, Medal, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * PUBLIC LEADERBOARD — visible to everyone including logged-out guests.
 * Guests can VIEW the rankings but are never ranked themselves: only
 * profiles with role='user' appear (staff and guest roles are excluded),
 * ordered by trigger-maintained xp_total.
 */
export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_emoji, current_level, xp_total")
    .eq("role", "user")
    .order("xp_total", { ascending: false })
    .limit(50);

  const leaders = rows ?? [];

  // Podium ordering: 2nd, 1st, 3rd
  const podium = [leaders[1], leaders[0], leaders[2]].filter(Boolean);
  const rest = leaders.slice(3);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Hero */}
      <div className="text-center space-y-2 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFD106]/10 border border-[#FFD106]/30 text-[#FFD106] text-[11px] font-mono font-bold">
          <Trophy className="h-3.5 w-3.5" />
          HALL OF LEGENDS
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#FFF8E7] font-heading tracking-tight">
          Leaderboard
        </h1>
        <p className="text-xs sm:text-sm text-[#A7A7A7] max-w-md mx-auto">
          The most dedicated cinephiles on Lantawon Nato, ranked by XP earned
          from watching. Sign up to claim your spot!
        </p>
      </div>

      {leaders.length === 0 ? (
        <div className="text-center py-16 text-zinc-500">
          <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No legends yet — be the first!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end max-w-xl mx-auto">
            {podium.map((p) => {
              const rank = leaders.indexOf(p) + 1;
              const isFirst = rank === 1;
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4 text-center space-y-2 ${
                    isFirst
                      ? "bg-gradient-to-b from-[#FFD106]/15 to-transparent border-[#FFD106]/40 -mt-6 pb-8"
                      : "bg-zinc-950 border-zinc-800 pb-5"
                  }`}
                >
                  <div
                    className={`text-2xl font-black font-mono ${
                      isFirst ? "text-[#FFD106]" : "text-zinc-500"
                    }`}
                  >
                    #{rank}
                  </div>
                  <div className="text-4xl">{p.avatar_emoji || "🎬"}</div>
                  <div className="text-sm font-bold text-white truncate">
                    {p.display_name || p.username}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono">
                    LV {p.current_level} · {p.xp_total.toLocaleString()} XP
                  </div>
                  {isFirst && (
                    <Crown className="h-4 w-4 mx-auto text-[#FFD106]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Rest of table */}
          {rest.length > 0 && (
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden">
              {rest.map((p, i) => {
                const rank = i + 4;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 last:border-b-0 hover:bg-zinc-900/50 transition-colors"
                  >
                    <span className="w-10 shrink-0 text-xs font-black font-mono text-zinc-500">
                      #{rank}
                    </span>
                    <span className="text-2xl shrink-0">{p.avatar_emoji || "🎬"}</span>
                    <span className="flex-1 min-w-0 truncate text-sm font-bold text-white">
                      {p.display_name || p.username}
                    </span>
                    <Medal className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    <span className="shrink-0 text-xs font-mono text-zinc-400">
                      LV {p.current_level} · {p.xp_total.toLocaleString()} XP
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <p className="text-center text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
        Rankings update as members watch · Staff accounts excluded
      </p>
    </div>
  );
}
