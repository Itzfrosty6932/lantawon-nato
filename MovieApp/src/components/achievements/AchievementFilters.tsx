"use client";

import React from "react";
import {
  Trophy,
  Film,
  Tv,
  Clapperboard,
  Clock,
  CheckCircle2,
  Globe,
  HardDrive,
  Sparkles,
  Search,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { AchievementCategory } from "@/features/achievements/achievements-data";

interface AchievementFiltersProps {
  totalCount: number;
  activeCategory: AchievementCategory;
  onSelectCategory: (cat: AchievementCategory) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: "all" | "unlocked" | "locked";
  onStatusFilterChange: (s: "all" | "unlocked" | "locked") => void;
  selectedTier: string;
  onTierChange: (t: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Trophy },
  { id: "cinema", label: "Cinema (1–500)", icon: Film },
  { id: "series", label: "Series (1–1000 Ep)", icon: Tv },
  { id: "anime", label: "Anime (1–250)", icon: Clapperboard },
  { id: "runtime", label: "Runtime (1–1000 Hrs)", icon: Clock },
  { id: "streaks", label: "Completionist", icon: CheckCircle2 },
  { id: "exploration", label: "Global Passport", icon: Globe },
  { id: "archivist", label: "Vault Archivist", icon: HardDrive },
  { id: "secret", label: "Secret Prestige", icon: Sparkles },
];

export function AchievementFilters({
  totalCount,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  selectedTier,
  onTierChange,
}: AchievementFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                audioFX.playClick();
                onSelectCategory(cat.id as AchievementCategory);
              }}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-cyan-400 text-zinc-950 shadow-md font-black"
                  : "bg-[#242526] text-zinc-400 hover:text-white border border-zinc-700/80 hover:border-zinc-500"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.id === "all" ? `All (${totalCount})` : cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secondary Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search achievements..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#242526] border border-zinc-700/80 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400/50"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#242526] border border-zinc-700/80 rounded-xl p-0.5 text-xs font-semibold shrink-0">
            <button
              onClick={() => onStatusFilterChange("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "all"
                  ? "bg-cyan-400 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => onStatusFilterChange("unlocked")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "unlocked"
                  ? "bg-cyan-400 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Unlocked
            </button>
            <button
              onClick={() => onStatusFilterChange("locked")}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                statusFilter === "locked"
                  ? "bg-cyan-400 text-zinc-950 font-bold"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              In Progress
            </button>
          </div>

          {/* Tier Filter Dropdown */}
          <select
            value={selectedTier}
            onChange={(e) => onTierChange(e.target.value)}
            className="bg-[#242526] border border-zinc-700/80 text-xs text-zinc-300 rounded-xl px-3 py-1.5 focus:outline-none focus:border-cyan-400/50"
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze Tier</option>
            <option value="silver">Silver Tier</option>
            <option value="gold">Gold Tier</option>
            <option value="platinum">Platinum Tier</option>
            <option value="diamond">Diamond Tier</option>
            <option value="obsidian">Obsidian Tier</option>
          </select>
        </div>
      </div>
    </div>
  );
}
