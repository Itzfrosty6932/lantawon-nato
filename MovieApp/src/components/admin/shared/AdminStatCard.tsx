"use client";

import React from "react";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  accent?: "red" | "emerald" | "amber" | "cyan" | "violet" | "default";
}

export function AdminStatCard({
  label,
  value,
  subValue,
  trend,
  icon,
  accent = "default",
}: AdminStatCardProps) {
  const accentClasses: Record<string, { bg: string; border: string; text: string }> = {
    red: {
      bg: "bg-[#E50914]/10",
      border: "border-[#E50914]/20",
      text: "text-[#E50914]",
    },
    emerald: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
    },
    amber: {
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      text: "text-amber-400",
    },
    cyan: {
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      text: "text-cyan-400",
    },
    violet: {
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      text: "text-violet-400",
    },
    default: {
      bg: "bg-zinc-800/60",
      border: "border-zinc-700/50",
      text: "text-zinc-300",
    },
  };

  const style = accentClasses[accent] || accentClasses.default;

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-sm hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase font-mono">
          {label}
        </span>
        <div className={`p-2 rounded-xl border ${style.bg} ${style.border} ${style.text}`}>
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
          {value}
        </div>
        {subValue && (
          <div className="text-xs text-zinc-500 font-medium">{subValue}</div>
        )}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/60 text-xs">
          <span
            className={`font-mono font-bold ${
              trend.isPositive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}
          </span>
          <span className="text-zinc-500">vs last 24h</span>
        </div>
      )}
    </div>
  );
}
