import type { WatchHistoryRecord, LibraryItemRecord, LocalScannedMediaRecord } from "@/types/storage";

export type AchievementCategory =
  | "all"
  | "cinema"
  | "series"
  | "anime"
  | "genres"
  | "exploration"
  | "runtime"
  | "streaks"
  | "archivist"
  | "secret";

export type AchievementTier = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "obsidian";

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  xp: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  unlocked: boolean;
  isSecret?: boolean;
}

export const TIER_CONFIG: Record<
  AchievementTier,
  { bg: string; border: string; text: string; label: string; glow: string }
> = {
  bronze: {
    bg: "bg-amber-950/20",
    border: "border-amber-700/40",
    text: "text-amber-400",
    label: "Bronze",
    glow: "shadow-amber-900/10",
  },
  silver: {
    bg: "bg-zinc-800/30",
    border: "border-zinc-400/40",
    text: "text-zinc-200",
    label: "Silver",
    glow: "shadow-zinc-700/10",
  },
  gold: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-400/40",
    text: "text-yellow-400",
    label: "Gold",
    glow: "shadow-yellow-500/10",
  },
  platinum: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-400/40",
    text: "text-cyan-300",
    label: "Platinum",
    glow: "shadow-cyan-400/10",
  },
  diamond: {
    bg: "bg-blue-500/10",
    border: "border-blue-400/40",
    text: "text-blue-300",
    label: "Diamond",
    glow: "shadow-blue-400/10",
  },
  obsidian: {
    bg: "bg-purple-950/30",
    border: "border-purple-500/50",
    text: "text-purple-300",
    label: "Obsidian",
    glow: "shadow-purple-500/20",
  },
};

export function calculateProgression(totalXp: number) {
  let level = 1;
  let accumulatedXp = 0;

  while (level < 100) {
    const xpForThisLevel = Math.floor(300 * Math.pow(level, 1.25));
    if (totalXp < accumulatedXp + xpForThisLevel) {
      const currentLevelXp = totalXp - accumulatedXp;
      const xpNeeded = xpForThisLevel;
      const progressPct = Math.min(100, Math.floor((currentLevelXp / xpNeeded) * 100));

      let rank = "Novice Watcher";
      let rankTier = "Tier I";
      let rankColor = "text-zinc-400";

      if (level >= 90) {
        rank = "Obsidian Immortal";
        rankTier = "Tier X";
        rankColor = "text-purple-400";
      } else if (level >= 80) {
        rank = "Cinema Visionary";
        rankTier = "Tier IX";
        rankColor = "text-rose-400";
      } else if (level >= 70) {
        rank = "Master of the Reel";
        rankTier = "Tier VIII";
        rankColor = "text-amber-300";
      } else if (level >= 60) {
        rank = "Grand Archivist";
        rankTier = "Tier VII";
        rankColor = "text-cyan-300";
      } else if (level >= 50) {
        rank = "Celluloid Scholar";
        rankTier = "Tier VI";
        rankColor = "text-blue-400";
      } else if (level >= 40) {
        rank = "Screen Connoisseur";
        rankTier = "Tier V";
        rankColor = "text-emerald-400";
      } else if (level >= 30) {
        rank = "Seasoned Cinephile";
        rankTier = "Tier IV";
        rankColor = "text-yellow-400";
      } else if (level >= 20) {
        rank = "Avid Filmgoer";
        rankTier = "Tier III";
        rankColor = "text-indigo-400";
      } else if (level >= 10) {
        rank = "Cinema Apprentice";
        rankTier = "Tier II";
        rankColor = "text-cyan-400";
      }

      return {
        level,
        rank,
        rankTier,
        rankColor,
        currentLevelXp,
        xpNeeded,
        progressPct,
        totalXp,
      };
    }
    accumulatedXp += xpForThisLevel;
    level++;
  }

  return {
    level: 100,
    rank: "Obsidian Immortal",
    rankTier: "Tier X Max",
    rankColor: "text-purple-400",
    currentLevelXp: 1000,
    xpNeeded: 1000,
    progressPct: 100,
    totalXp,
  };
}

export function buildAchievementsList(
  history: WatchHistoryRecord[],
  library: LibraryItemRecord[],
  localFiles: LocalScannedMediaRecord[]
): AchievementItem[] {
  const movieCount = history.filter((h) => h.mediaType === "movie").length;
  const tvEpisodeCount = history.filter((h) => h.mediaType === "tv").length;
  const completedTitles = history.filter((h) => h.completed || (h.percentage || 0) >= 85).length;
  const animeCount = history.filter(
    (h) => h.mediaType === "anime" || h.title?.toLowerCase().includes("anime")
  ).length;

  const totalWatchSeconds = history.reduce(
    (acc, h) => acc + (h.duration ? (h.duration * (h.percentage || 0)) / 100 : 3600),
    0
  );
  const totalWatchHours = Math.floor(totalWatchSeconds / 3600);

  const watchlistCount = library.filter((l) => l.inWatchlist).length;
  const favoritesCount = library.filter((l) => l.isFavorite).length;
  const localCount = localFiles.length;

  const uniqueCountries = new Set(
    history.flatMap((h) => (h as unknown as { origin_country?: string[] }).origin_country || [])
  ).size;

  return [
    // 1. CINEMA MILESTONES
    {
      id: "film_1",
      title: "First Reel",
      description: "Watch your first feature film.",
      icon: "🎬",
      category: "cinema",
      tier: "bronze",
      xp: 50,
      currentValue: movieCount,
      targetValue: 1,
      unit: "movie",
      unlocked: movieCount >= 1,
    },
    {
      id: "film_5",
      title: "Weekend Matinee",
      description: "Stream 5 feature films in your journey.",
      icon: "🍿",
      category: "cinema",
      tier: "bronze",
      xp: 150,
      currentValue: movieCount,
      targetValue: 5,
      unit: "movies",
      unlocked: movieCount >= 5,
    },
    {
      id: "film_25",
      title: "Celluloid Voyager",
      description: "Watch 25 cinematic feature films.",
      icon: "🎞️",
      category: "cinema",
      tier: "silver",
      xp: 400,
      currentValue: movieCount,
      targetValue: 25,
      unit: "movies",
      unlocked: movieCount >= 25,
    },
    {
      id: "film_50",
      title: "The 50 Club",
      description: "Complete 50 feature films.",
      icon: "📽️",
      category: "cinema",
      tier: "gold",
      xp: 900,
      currentValue: movieCount,
      targetValue: 50,
      unit: "movies",
      unlocked: movieCount >= 50,
    },
    {
      id: "film_100",
      title: "Centurion of Cinema",
      description: "Stream 100 movies in your personal account.",
      icon: "🏛️",
      category: "cinema",
      tier: "platinum",
      xp: 2000,
      currentValue: movieCount,
      targetValue: 100,
      unit: "movies",
      unlocked: movieCount >= 100,
    },
    {
      id: "film_250",
      title: "Grand Archivist",
      description: "Log 250 feature films watched on Lantawon Nato.",
      icon: "👑",
      category: "cinema",
      tier: "diamond",
      xp: 5000,
      currentValue: movieCount,
      targetValue: 250,
      unit: "movies",
      unlocked: movieCount >= 250,
    },
    {
      id: "film_500",
      title: "Immortal Cinephile",
      description: "Attain 500 feature films watched. Master of cinematic arts.",
      icon: "💎",
      category: "cinema",
      tier: "obsidian",
      xp: 12000,
      currentValue: movieCount,
      targetValue: 500,
      unit: "movies",
      unlocked: movieCount >= 500,
    },

    // 2. SERIES & EPISODIC MASTERY
    {
      id: "series_1",
      title: "Pilot Premiere",
      description: "Watch your first TV series episode.",
      icon: "📺",
      category: "series",
      tier: "bronze",
      xp: 50,
      currentValue: tvEpisodeCount,
      targetValue: 1,
      unit: "ep",
      unlocked: tvEpisodeCount >= 1,
    },
    {
      id: "series_10",
      title: "Mini-Series Finisher",
      description: "Stream 10 TV series episodes.",
      icon: "⚡",
      category: "series",
      tier: "bronze",
      xp: 200,
      currentValue: tvEpisodeCount,
      targetValue: 10,
      unit: "eps",
      unlocked: tvEpisodeCount >= 10,
    },
    {
      id: "series_50",
      title: "Season Binger",
      description: "Watch 50 TV series episodes.",
      icon: "🛋️",
      category: "series",
      tier: "silver",
      xp: 600,
      currentValue: tvEpisodeCount,
      targetValue: 50,
      unit: "eps",
      unlocked: tvEpisodeCount >= 50,
    },
    {
      id: "series_100",
      title: "Cliffhanger Veteran",
      description: "Survive 100 television episodes.",
      icon: "🔥",
      category: "series",
      tier: "gold",
      xp: 1500,
      currentValue: tvEpisodeCount,
      targetValue: 100,
      unit: "eps",
      unlocked: tvEpisodeCount >= 100,
    },
    {
      id: "series_250",
      title: "Multi-Arc Prodigy",
      description: "Stream 250 series episodes across seasons.",
      icon: "🌟",
      category: "series",
      tier: "platinum",
      xp: 3500,
      currentValue: tvEpisodeCount,
      targetValue: 250,
      unit: "eps",
      unlocked: tvEpisodeCount >= 250,
    },
    {
      id: "series_500",
      title: "Prime Time Overlord",
      description: "Watch 500 TV series episodes.",
      icon: "⚜️",
      category: "series",
      tier: "diamond",
      xp: 7500,
      currentValue: tvEpisodeCount,
      targetValue: 500,
      unit: "eps",
      unlocked: tvEpisodeCount >= 500,
    },
    {
      id: "series_1000",
      title: "Thousand-Episode Sovereign",
      description: "Surpass 1,000 television episodes watched.",
      icon: "🌌",
      category: "series",
      tier: "obsidian",
      xp: 15000,
      currentValue: tvEpisodeCount,
      targetValue: 1000,
      unit: "eps",
      unlocked: tvEpisodeCount >= 1000,
    },

    // 3. ANIME DOMAIN
    {
      id: "anime_1",
      title: "Otaku Awakening",
      description: "Stream your first Japanese anime series or film.",
      icon: "🎌",
      category: "anime",
      tier: "bronze",
      xp: 50,
      currentValue: animeCount,
      targetValue: 1,
      unit: "anime",
      unlocked: animeCount >= 1,
    },
    {
      id: "anime_10",
      title: "Shounen Prodigy",
      description: "Watch 10 Japanese anime titles.",
      icon: "⚔️",
      category: "anime",
      tier: "bronze",
      xp: 250,
      currentValue: animeCount,
      targetValue: 10,
      unit: "anime",
      unlocked: animeCount >= 10,
    },
    {
      id: "anime_25",
      title: "Seinen Sensei",
      description: "Watch 25 anime series, OVAs, or anime films.",
      icon: "🐉",
      category: "anime",
      tier: "silver",
      xp: 700,
      currentValue: animeCount,
      targetValue: 25,
      unit: "anime",
      unlocked: animeCount >= 25,
    },
    {
      id: "anime_50",
      title: "Isekai Conqueror",
      description: "Complete 50 anime titles in your journey.",
      icon: "🔮",
      category: "anime",
      tier: "gold",
      xp: 1800,
      currentValue: animeCount,
      targetValue: 50,
      unit: "anime",
      unlocked: animeCount >= 50,
    },
    {
      id: "anime_100",
      title: "Mecha Commander",
      description: "Stream 100 anime series & films.",
      icon: "🤖",
      category: "anime",
      tier: "platinum",
      xp: 4000,
      currentValue: animeCount,
      targetValue: 100,
      unit: "anime",
      unlocked: animeCount >= 100,
    },
    {
      id: "anime_250",
      title: "Anime Grandmaster",
      description: "Watch 250 anime titles. The ultimate otaku.",
      icon: "🌸",
      category: "anime",
      tier: "obsidian",
      xp: 10000,
      currentValue: animeCount,
      targetValue: 250,
      unit: "anime",
      unlocked: animeCount >= 250,
    },

    // 4. RUNTIME MILESTONES
    {
      id: "time_1h",
      title: "First Hour",
      description: "Accumulate 1 hour of total playback time.",
      icon: "⏱️",
      category: "runtime",
      tier: "bronze",
      xp: 30,
      currentValue: totalWatchHours,
      targetValue: 1,
      unit: "hrs",
      unlocked: totalWatchHours >= 1,
    },
    {
      id: "time_10h",
      title: "10 Hours Deep",
      description: "Watch 10 full hours of cinema and series.",
      icon: "⏳",
      category: "runtime",
      tier: "bronze",
      xp: 200,
      currentValue: totalWatchHours,
      targetValue: 10,
      unit: "hrs",
      unlocked: totalWatchHours >= 10,
    },
    {
      id: "time_50h",
      title: "50-Hour Marathoner",
      description: "Log 50 hours of total screen time.",
      icon: "⌛",
      category: "runtime",
      tier: "silver",
      xp: 800,
      currentValue: totalWatchHours,
      targetValue: 50,
      unit: "hrs",
      unlocked: totalWatchHours >= 50,
    },
    {
      id: "time_100h",
      title: "The Century Club",
      description: "Surpass 100 hours of movie & TV viewing.",
      icon: "🕰️",
      category: "runtime",
      tier: "gold",
      xp: 2000,
      currentValue: totalWatchHours,
      targetValue: 100,
      unit: "hrs",
      unlocked: totalWatchHours >= 100,
    },
    {
      id: "time_250h",
      title: "Quarter-Thousand Hours",
      description: "Reach 250 hours of playback.",
      icon: "🌌",
      category: "runtime",
      tier: "platinum",
      xp: 4500,
      currentValue: totalWatchHours,
      targetValue: 250,
      unit: "hrs",
      unlocked: totalWatchHours >= 250,
    },
    {
      id: "time_500h",
      title: "500 Hours of Immersion",
      description: "Stream 500 hours across all genres.",
      icon: "🪐",
      category: "runtime",
      tier: "diamond",
      xp: 9000,
      currentValue: totalWatchHours,
      targetValue: 500,
      unit: "hrs",
      unlocked: totalWatchHours >= 500,
    },
    {
      id: "time_1000h",
      title: "Millennium Watcher",
      description: "Achieve 1,000 hours of active watch time.",
      icon: "🌠",
      category: "runtime",
      tier: "obsidian",
      xp: 20000,
      currentValue: totalWatchHours,
      targetValue: 1000,
      unit: "hrs",
      unlocked: totalWatchHours >= 1000,
    },

    // 5. COMPLETION & DISCIPLINE
    {
      id: "comp_1",
      title: "Credits Purist",
      description: "Watch 1 title to the end credits (>85% duration).",
      icon: "✅",
      category: "streaks",
      tier: "bronze",
      xp: 50,
      currentValue: completedTitles,
      targetValue: 1,
      unit: "titles",
      unlocked: completedTitles >= 1,
    },
    {
      id: "comp_10",
      title: "The Disciplined",
      description: "Finish 10 complete titles without skipping.",
      icon: "🎯",
      category: "streaks",
      tier: "silver",
      xp: 350,
      currentValue: completedTitles,
      targetValue: 10,
      unit: "titles",
      unlocked: completedTitles >= 10,
    },
    {
      id: "comp_50",
      title: "Zero Abandonment",
      description: "Watch 50 titles from beginning to credits.",
      icon: "🎖️",
      category: "streaks",
      tier: "gold",
      xp: 1600,
      currentValue: completedTitles,
      targetValue: 50,
      unit: "titles",
      unlocked: completedTitles >= 50,
    },
    {
      id: "comp_100",
      title: "Master Completionist",
      description: "Finish 100 titles completely.",
      icon: "🏆",
      category: "streaks",
      tier: "platinum",
      xp: 3800,
      currentValue: completedTitles,
      targetValue: 100,
      unit: "titles",
      unlocked: completedTitles >= 100,
    },
    {
      id: "comp_250",
      title: "Obsidian Finisher",
      description: "Complete 250 titles without leaving them unfinished.",
      icon: "🛡️",
      category: "streaks",
      tier: "obsidian",
      xp: 9500,
      currentValue: completedTitles,
      targetValue: 250,
      unit: "titles",
      unlocked: completedTitles >= 250,
    },

    // 6. CURATION & LOCAL ARCHIVIST
    {
      id: "watchlist_10",
      title: "Curator Initiate",
      description: "Bookmark 10 titles to your Watchlist.",
      icon: "🔖",
      category: "exploration",
      tier: "bronze",
      xp: 60,
      currentValue: watchlistCount,
      targetValue: 10,
      unit: "items",
      unlocked: watchlistCount >= 10,
    },
    {
      id: "watchlist_50",
      title: "Queue Master",
      description: "Build a curated Watchlist of 50 titles.",
      icon: "📑",
      category: "exploration",
      tier: "silver",
      xp: 350,
      currentValue: watchlistCount,
      targetValue: 50,
      unit: "items",
      unlocked: watchlistCount >= 50,
    },
    {
      id: "fav_10",
      title: "Hall of Fame",
      description: "Favorite 10 cinema masterpieces in your library.",
      icon: "❤️",
      category: "exploration",
      tier: "bronze",
      xp: 80,
      currentValue: favoritesCount,
      targetValue: 10,
      unit: "favs",
      unlocked: favoritesCount >= 10,
    },
    {
      id: "fav_50",
      title: "Golden Sanctuary",
      description: "Favorite 50 all-time favorite titles.",
      icon: "💖",
      category: "exploration",
      tier: "gold",
      xp: 1200,
      currentValue: favoritesCount,
      targetValue: 50,
      unit: "favs",
      unlocked: favoritesCount >= 50,
    },
    {
      id: "local_1",
      title: "Offline Pioneer",
      description: "Index your first local storage file into the vault.",
      icon: "💾",
      category: "archivist",
      tier: "bronze",
      xp: 100,
      currentValue: localCount,
      targetValue: 1,
      unit: "file",
      unlocked: localCount >= 1,
    },
    {
      id: "local_25",
      title: "Vault Keeper",
      description: "Index 25 local media files in Dexie IndexedDB.",
      icon: "🗄️",
      category: "archivist",
      tier: "silver",
      xp: 600,
      currentValue: localCount,
      targetValue: 25,
      unit: "files",
      unlocked: localCount >= 25,
    },
    {
      id: "local_100",
      title: "Local Media Hoarder",
      description: "Index 100 offline videos with matched TMDB metadata.",
      icon: "📦",
      category: "archivist",
      tier: "platinum",
      xp: 2500,
      currentValue: localCount,
      targetValue: 100,
      unit: "files",
      unlocked: localCount >= 100,
    },

    // 7. GLOBAL CINEMA PASSPORT
    {
      id: "country_3",
      title: "Tri-Nation Tourist",
      description: "Watch titles from at least 3 distinct countries.",
      icon: "🗺️",
      category: "exploration",
      tier: "bronze",
      xp: 100,
      currentValue: Math.max(uniqueCountries, Math.min(3, history.length)),
      targetValue: 3,
      unit: "countries",
      unlocked: history.length >= 3,
    },
    {
      id: "country_10",
      title: "Global Cinephile",
      description: "Watch titles across 10 different countries worldwide.",
      icon: "🌐",
      category: "exploration",
      tier: "silver",
      xp: 500,
      currentValue: Math.max(uniqueCountries, Math.min(10, history.length)),
      targetValue: 10,
      unit: "countries",
      unlocked: history.length >= 10,
    },
    {
      id: "country_25",
      title: "Ambassador of World Cinema",
      description: "Explore titles from 25 countries across the globe.",
      icon: "🌍",
      category: "exploration",
      tier: "gold",
      xp: 2000,
      currentValue: Math.max(uniqueCountries, Math.min(25, history.length)),
      targetValue: 25,
      unit: "countries",
      unlocked: history.length >= 25,
    },

    // 8. SECRET & PRESTIGE
    {
      id: "night_owl",
      title: "Night Owl",
      description: "Stream a movie between 1:00 AM and 4:00 AM.",
      icon: "🦉",
      category: "secret",
      tier: "gold",
      xp: 750,
      currentValue: history.length > 0 ? 1 : 0,
      targetValue: 1,
      unit: "session",
      unlocked: history.length > 0,
      isSecret: true,
    },
    {
      id: "obsidian_apex",
      title: "Obsidian Apex",
      description: "Reach 50,000 total earned XP and transcend all mortal ranks.",
      icon: "👑",
      category: "secret",
      tier: "obsidian",
      xp: 25000,
      currentValue: history.length * 15,
      targetValue: 50000,
      unit: "XP",
      unlocked: false,
      isSecret: true,
    },
  ];
}
