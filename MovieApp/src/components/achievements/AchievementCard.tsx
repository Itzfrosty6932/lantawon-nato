"use client";

import React from "react";
import { Check, Lock, Sparkles, CheckCircle2 } from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import {
  AchievementItem,
  TIER_CONFIG,
} from "@/features/achievements/achievements-data";

interface AchievementCardProps {
  achievement: AchievementItem;
  isClaimed: boolean;
  onClaim: (ach: AchievementItem) => void;
}

export function AchievementCard({
  achievement: ach,
  isClaimed,
  onClaim,
}: AchievementCardProps) {
  const tier = TIER_CONFIG[ach.tier] || TIER_CONFIG.bronze;
  const pct = Math.min(100, Math.floor((ach.currentValue / ach.targetValue) * 100));

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all relative overflow-hidden ${
        ach.unlocked
          ? `bg-[#18191a] border-zinc-700/80 hover:border-cyan-400/40 shadow-lg ${tier.glow}`
          : "bg-[#18191a]/40 border-zinc-800/80 opacity-80"
      }`}
    >
      <div className="space-y-3">
        {/* Card Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl border shrink-0 ${tier.bg} ${tier.border}`}
            >
              {ach.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest rounded px-1.5 py-0.5 border ${tier.bg} ${tier.border} ${tier.text}`}
                >
                  {tier.label}
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  +{ach.xp} XP
                </span>
              </div>
              <h3 className="font-heading text-sm font-bold text-white mt-1">
                {ach.title}
              </h3>
            </div>
          </div>

          {ach.unlocked ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Check className="h-4 w-4" />
            </span>
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
              <Lock className="h-3.5 w-3.5" />
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed">{ach.description}</p>
      </div>

      {/* Card Bottom Progress / Claim Status */}
      <div className="pt-3 border-t border-zinc-800/80 mt-3 space-y-2">
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>Progress</span>
          <span className="font-bold text-white">
            {ach.currentValue.toLocaleString()} / {ach.targetValue.toLocaleString()}{" "}
            {ach.unit} ({pct}%)
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-zinc-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              ach.unlocked
                ? "bg-gradient-to-r from-emerald-400 to-teal-300 shadow-sm"
                : "bg-zinc-700"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {ach.unlocked && (
          <div className="pt-1">
            {isClaimed ? (
              <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-zinc-800/80 text-[11px] font-semibold text-zinc-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Claimed (+{ach.xp} XP)</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  audioFX.playClick();
                  onClaim(ach);
                }}
                className="w-full py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-300 text-zinc-950 text-xs font-black text-center shadow-md hover:scale-102 transition-transform flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Claim +{ach.xp} XP</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
