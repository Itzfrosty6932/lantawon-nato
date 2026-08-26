"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/db/dexie-db";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import {
  AchievementCategory,
  AchievementItem,
  calculateProgression,
  buildAchievementsList,
} from "@/features/achievements/achievements-data";
import { LevelProgressHero } from "@/components/achievements/LevelProgressHero";
import { AchievementFilters } from "@/components/achievements/AchievementFilters";
import { AchievementCard } from "@/components/achievements/AchievementCard";
import type { WatchHistoryRecord, LibraryItemRecord, LocalScannedMediaRecord } from "@/types/storage";

export default function AchievementsPage() {
  const { showToast } = useToast();
  const [history, setHistory] = useState<WatchHistoryRecord[]>([]);
  const [library, setLibrary] = useState<LibraryItemRecord[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalScannedMediaRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState<AchievementCategory>("all");
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [claimedAchievements, setClaimedAchievements] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem("lantawon_claimed_achievements");
      if (stored) setClaimedAchievements(JSON.parse(stored));
    } catch {}

    const loadData = async () => {
      try {
        await db.migrateFromLocalStorage();
        const [h, l, lf] = await Promise.all([
          db.watchHistory.toArray(),
          db.libraryItems.toArray(),
          db.localScannedMedia.toArray(),
        ]);
        setHistory(h);
        setLibrary(l);
        setLocalFiles(lf);
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  const handleClaim = (ach: AchievementItem) => {
    audioFX.playSuccess();
    const next = { ...claimedAchievements, [ach.id]: true };
    setClaimedAchievements(next);
    try {
      localStorage.setItem("lantawon_claimed_achievements", JSON.stringify(next));
    } catch {}
    showToast(`Claimed +${ach.xp} XP for ${ach.title}!`, "success");
  };

  const handleClaimAll = () => {
    const unclaimedUnlocked = achievements.filter((a) => a.unlocked && !claimedAchievements[a.id]);
    if (unclaimedUnlocked.length === 0) {
      showToast("No pending rewards to claim.", "info");
      return;
    }

    audioFX.playSuccess();
    const next = { ...claimedAchievements };
    let totalClaimedXp = 0;
    unclaimedUnlocked.forEach((a) => {
      next[a.id] = true;
      totalClaimedXp += a.xp;
    });

    setClaimedAchievements(next);
    try {
      localStorage.setItem("lantawon_claimed_achievements", JSON.stringify(next));
    } catch {}
    showToast(`Claimed all rewards! (+${totalClaimedXp} XP)`, "success");
  };

  // Build the 50+ achievement milestones list
  const achievements = useMemo<AchievementItem[]>(() => {
    return buildAchievementsList(history, library, localFiles);
  }, [history, library, localFiles]);

  // Compute Total XP and Level Progression
  const earnedXp = useMemo(() => {
    return achievements.reduce((acc, ach) => {
      if (ach.unlocked && claimedAchievements[ach.id]) {
        return acc + ach.xp;
      }
      return acc;
    }, 0);
  }, [achievements, claimedAchievements]);

  const progression = useMemo(() => {
    return calculateProgression(earnedXp);
  }, [earnedXp]);

  const unlockedCount = useMemo(() => achievements.filter((a) => a.unlocked).length, [achievements]);
  const pendingClaimCount = useMemo(
    () => achievements.filter((a) => a.unlocked && !claimedAchievements[a.id]).length,
    [achievements, claimedAchievements]
  );

  // Filtered achievements
  const filteredAchievements = useMemo(() => {
    return achievements.filter((ach) => {
      if (activeCategory !== "all" && ach.category !== activeCategory) return false;
      if (selectedTier !== "all" && ach.tier !== selectedTier) return false;
      if (statusFilter === "unlocked" && !ach.unlocked) return false;
      if (statusFilter === "locked" && ach.unlocked) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return ach.title.toLowerCase().includes(q) || ach.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [achievements, activeCategory, selectedTier, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 pt-2 pb-24 animate-in fade-in">
      {/* ─── Hero Level Banner ─── */}
      <LevelProgressHero
        progression={progression}
        unlockedCount={unlockedCount}
        totalCount={achievements.length}
        unclaimedCount={pendingClaimCount}
        onClaimAll={handleClaimAll}
      />

      {/* ─── Filter & Search Bar ─── */}
      <AchievementFilters
        totalCount={achievements.length}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        selectedTier={selectedTier}
        onTierChange={setSelectedTier}
      />

      {/* ─── Achievements Cards Grid ─── */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-20 bg-[#18191a]/40 border border-zinc-800/80 rounded-2xl p-6 text-zinc-500 text-xs">
          No achievements match the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAchievements.map((ach) => (
            <AchievementCard
              key={ach.id}
              achievement={ach}
              isClaimed={Boolean(claimedAchievements[ach.id])}
              onClaim={handleClaim}
            />
          ))}
        </div>
      )}
    </div>
  );
}
