export interface ParsedNlpIntent {
  rawQuery: string;
  mediaType: "all" | "movie" | "tv" | "anime" | "animation" | "documentary";
  genres: number[];
  mood: string | null;
  country: string | null;
  yearStart: number | null;
  yearEnd: number | null;
  seedTitle: string | null;
  rating?: string | null;
  violence?: string | null;
  sexualContent?: string | null;
  withoutGore?: boolean;
  withoutNudity?: boolean;
  explanation: string[];
}

export function parseNlpIntent(queryText: string): ParsedNlpIntent {
  const q = (queryText || "").toLowerCase().trim();
  const intent: ParsedNlpIntent = {
    rawQuery: queryText,
    mediaType: "all",
    genres: [],
    mood: null,
    country: null,
    yearStart: null,
    yearEnd: null,
    seedTitle: null,
    rating: null,
    violence: null,
    sexualContent: null,
    withoutGore: false,
    withoutNudity: false,
    explanation: [],
  };

  // 1. Media Type
  if (/\banime\b/i.test(q)) {
    intent.mediaType = "anime";
    intent.country = "JP";
    intent.explanation.push("Filtered by Japanese Anime");
  } else if (/\b(cartoon|cartoons|animated series|animation)\b/i.test(q)) {
    intent.mediaType = "animation";
    intent.explanation.push("Filtered by Animated & Cartoon Works");
  } else if (/\b(series|show|shows|tv show|season|episodes)\b/i.test(q)) {
    intent.mediaType = "tv";
    intent.explanation.push("Filtered by TV & Streaming Series");
  } else if (/\b(documentary|docuseries|documentaries)\b/i.test(q)) {
    intent.mediaType = "documentary";
    intent.explanation.push("Filtered by Documentaries");
  } else if (/\b(movie|movies|film|films|cinema)\b/i.test(q)) {
    intent.mediaType = "movie";
    intent.explanation.push("Filtered by Feature Films");
  }

  // 2. Era & Decades
  if (/\b(1990s|90s|nineties)\b/i.test(q)) {
    intent.yearStart = 1990;
    intent.yearEnd = 1999;
    intent.explanation.push("Era: 1990s Golden Age");
  } else if (/\b(1980s|80s|eighties)\b/i.test(q)) {
    intent.yearStart = 1980;
    intent.yearEnd = 1989;
    intent.explanation.push("Era: 1980s Retro Era");
  } else if (/\b(2000s|00s|early 2000s)\b/i.test(q)) {
    intent.yearStart = 2000;
    intent.yearEnd = 2009;
    intent.explanation.push("Era: 2000s Modern Classic");
  } else if (/\b(2010s|tens)\b/i.test(q)) {
    intent.yearStart = 2010;
    intent.yearEnd = 2019;
    intent.explanation.push("Era: 2010s Decade");
  } else if (/\b(latest|new|2024|2025|2026|recent)\b/i.test(q)) {
    intent.yearStart = 2023;
    intent.yearEnd = 2026;
    intent.explanation.push("Era: Recent & New Releases");
  }

  // 3. Country & Origin
  if (/\b(korean|k-drama|korea)\b/i.test(q)) {
    intent.country = "KR";
    intent.explanation.push("Origin: South Korea (🇰🇷)");
  } else if (/\b(japanese|japan)\b/i.test(q) && intent.mediaType !== "anime") {
    intent.country = "JP";
    intent.explanation.push("Origin: Japan (🇯🇵)");
  } else if (/\b(chinese|china|donghua)\b/i.test(q)) {
    intent.country = "CN";
    intent.explanation.push("Origin: China (🇨🇳)");
  } else if (/\b(british|uk|england)\b/i.test(q)) {
    intent.country = "GB";
    intent.explanation.push("Origin: United Kingdom (🇬🇧)");
  } else if (/\b(french|france)\b/i.test(q)) {
    intent.country = "FR";
    intent.explanation.push("Origin: France (🇫🇷)");
  }

  // 4. Mood & Genre Tags
  if (/\b(mind-bending|psychological|cerebral|complex|twist|twists)\b/i.test(q)) {
    intent.mood = "mind-bending";
    intent.genres.push(9648, 53);
    intent.explanation.push("Mood: Mind-Bending & Psychological");
  }
  if (/\b(dark|gritty|intense|noir|violent)\b/i.test(q)) {
    intent.mood = "dark-gritty";
    intent.genres.push(80, 53);
    intent.explanation.push("Tone: Dark & Gritty");
  }
  if (/\b(funny|comedy|humor|hilarious|laugh)\b/i.test(q)) {
    intent.genres.push(35);
    intent.explanation.push("Genre: Comedy");
  }
  if (/\b(family|kids|wholesome|children)\b/i.test(q)) {
    intent.genres.push(10751);
    intent.explanation.push("Audience: Family-Friendly");
  }
  if (/\b(scary|horror|spooky|creepy|supernatural)\b/i.test(q)) {
    intent.genres.push(27);
    intent.explanation.push("Genre: Horror & Supernatural");
  }
  if (/\b(sci-fi|space|cyberpunk|futuristic|science fiction)\b/i.test(q)) {
    intent.genres.push(878);
    intent.explanation.push("Genre: Sci-Fi & Cyberpunk");
  }
  if (/\b(sports|sport|athlete|athletic|volleyball|basketball|football|soccer|boxing|baseball|racing|tournament|championship)\b/i.test(q)) {
    intent.mood = "sports";
    intent.explanation.push("Theme: Sports & Athletic Competitions");
  }

  // 5. Content Guide & Advisory Filters
  if (/\b(no gore|without gore|zero gore)\b/i.test(q)) {
    intent.withoutGore = true;
    intent.explanation.push("Advisory: No Gore");
  }
  if (/\b(no sexual content|without sex|no sex|no nudity|clean)\b/i.test(q)) {
    intent.sexualContent = "none";
    intent.withoutNudity = true;
    intent.explanation.push("Advisory: No Sexual Content / Nudity");
  } else if (/\b(mild sexual content|mild romance)\b/i.test(q)) {
    intent.sexualContent = "mild";
    intent.explanation.push("Advisory: Mild Sexual Content");
  }

  if (/\b(strong violence|intense violence|extreme violence|high violence)\b/i.test(q)) {
    intent.violence = "strong";
    intent.explanation.push("Advisory: Strong Violence");
  } else if (/\b(no violence|low violence|mild violence|non-violent)\b/i.test(q)) {
    intent.violence = "mild";
    intent.explanation.push("Advisory: Low/Mild Violence");
  }

  if (/\b(pg-13|pg 13)\b/i.test(q)) {
    intent.rating = "PG-13";
    intent.explanation.push("Certification: PG-13");
  } else if (/\b(spg|strong parental guidance)\b/i.test(q)) {
    intent.rating = "SPG";
    intent.explanation.push("MTRCB: SPG (Strong Parental Guidance)");
  } else if (/\b(pg rated|pg movie|pg movies|parental guidance)\b/i.test(q)) {
    intent.rating = "PG";
    intent.explanation.push("Certification: PG (Parental Guidance)");
  } else if (/\b(g rated|g-rated|general patronage)\b/i.test(q)) {
    intent.rating = "G";
    intent.explanation.push("Certification: G (General Audiences)");
  } else if (/\b(r rated|r-rated|restricted)\b/i.test(q)) {
    intent.rating = "R";
    intent.explanation.push("Certification: R (Restricted)");
  }

  // 6. Seed Title ("movies like Inception")
  const seedMatch = q.match(/(?:movies?|shows?|series)?\s*like\s+([a-zA-Z0-9\s:_-]+?)(?:\s+(?:under|in|from|with|without)|$)/i);
  if (seedMatch) {
    intent.seedTitle = seedMatch[1].trim();
    intent.explanation.push(`Seeded from: "${intent.seedTitle}"`);
  }

  return intent;
}
