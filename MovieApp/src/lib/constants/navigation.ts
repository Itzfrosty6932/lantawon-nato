export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface NavSection {
  id: string;
  title: string;
  description?: string;
  items: NavItem[];
}

export const CANONICAL_NAVIGATION: {
  discover: NavItem[];
  content: NavItem[];
  library: NavItem[];
  insights: NavItem[];
} = {
  discover: [
    { id: "home", label: "Home", href: "/", iconName: "Compass", description: "Curated spotlight & featured carousels" },
    { id: "discover", label: "Discover", href: "/discover", iconName: "Sparkles", description: "Multi-dimensional filter matrix" },
    { id: "trending", label: "Trending", href: "/trending", iconName: "Flame", description: "Worldwide popular cinema today" },
    { id: "top-rated", label: "Top Rated", href: "/top-rated", iconName: "Star", description: "Critically acclaimed masterpieces (★ 8.0+)" },
  ],

  content: [
    { id: "movies", label: "Movies", href: "/movies", iconName: "Film", description: "Feature-length cinema" },
    { id: "series", label: "TV Series", href: "/series", iconName: "Tv", description: "Episodic television & series" },
    { id: "anime", label: "Anime", href: "/anime", iconName: "Clapperboard", description: "Japanese animation & OVAs" },
    { id: "documentaries", label: "Documentaries", href: "/documentaries", iconName: "BookOpen", description: "Real-world & scientific non-fiction" },
  ],

  library: [
    { id: "library", label: "My Library", href: "/library", iconName: "Bookmark", description: "Watchlist, favorites & playlists" },
  ],

  insights: [
    { id: "achievements", label: "Achievements & XP", href: "/achievements", iconName: "Trophy", description: "Milestones, badges & level progression" },
    { id: "statistics", label: "Analytics & Taste", href: "/statistics", iconName: "BarChart2", description: "Taste profile, watch history & statistics" },
  ],
};
