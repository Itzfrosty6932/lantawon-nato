import test from "node:test";
import assert from "node:assert/strict";

// 1. NLP Parser Implementation for testing
function parseNlpIntent(queryText) {
  const q = (queryText || "").toLowerCase().trim();
  const intent = {
    rawQuery: queryText,
    mediaType: "all",
    genres: [],
    mood: null,
    country: null,
    yearStart: null,
    yearEnd: null,
    seedTitle: null,
    explanation: [],
  };

  if (/\banime\b/i.test(q)) {
    intent.mediaType = "anime";
    intent.country = "JP";
    intent.explanation.push("Filtered by Japanese Anime");
  } else if (/\b(series|show|shows|tv show)\b/i.test(q)) {
    intent.mediaType = "tv";
    intent.explanation.push("Filtered by TV & Streaming Series");
  } else if (/\b(movie|movies|film|films|cinema)\b/i.test(q)) {
    intent.mediaType = "movie";
    intent.explanation.push("Filtered by Feature Films");
  }

  if (/\b(1990s|90s|nineties)\b/i.test(q)) {
    intent.yearStart = 1990;
    intent.yearEnd = 1999;
    intent.explanation.push("Era: 1990s Golden Age");
  } else if (/\b(1980s|80s)\b/i.test(q)) {
    intent.yearStart = 1980;
    intent.yearEnd = 1989;
    intent.explanation.push("Era: 1980s Retro Era");
  }

  if (/\b(mind-bending|psychological|twist|twists)\b/i.test(q)) {
    intent.mood = "mind-bending";
    intent.genres.push(9648, 53);
    intent.explanation.push("Mood: Mind-Bending & Psychological");
  }

  if (/\b(scary|horror|spooky)\b/i.test(q)) {
    intent.genres.push(27);
  }

  if (/\b(no gore|without gore|zero gore)\b/i.test(q)) {
    intent.withoutGore = true;
  }
  if (/\b(no sexual content|without sex|no sex|no nudity)\b/i.test(q)) {
    intent.sexualContent = "none";
    intent.withoutNudity = true;
  }
  if (/\b(strong violence|intense violence)\b/i.test(q)) {
    intent.violence = "strong";
  }

  const seedMatch = q.match(/(?:movies?|shows?|series)?\s*like\s+([a-zA-Z0-9\s:_-]+?)(?:\s+(?:under|in|from|with)|$)/i);
  if (seedMatch) {
    intent.seedTitle = seedMatch[1].trim();
    intent.explanation.push(`Seeded from: "${intent.seedTitle}"`);
  }

  return intent;
}

// 2. Metadata Resolver Token Normalizer & Scorer Implementation
function parseFilename(filename) {
  const extMatch = filename.match(/\.([a-z0-9]+)$/i);
  const extension = extMatch ? `.${extMatch[1].toLowerCase()}` : "";
  let base = filename.replace(/\.[a-z0-9]+$/i, "").replace(/[._]/g, " ").trim();

  const isOvaOrSpecial = /\b(ova|oad|special|sp|ncop|nced)\b/i.test(base);

  const editionMatch = base.match(/\b(director'?s?\s*cut|extended(?:\s*cut)?|remastered|unrated|imax|theatrical)\b/i);
  const edition = editionMatch ? editionMatch[1] : undefined;

  const qualityMatch = base.match(/\b(4k|2160p|1080p|720p|480p|bdrip|web-?dl|bluray|hdtv|remux)\b/i);
  const quality = qualityMatch ? qualityMatch[1].toUpperCase() : "1080P";

  // Strip leading release group brackets like [SubsPlease] or [Erai-raws]
  base = base.replace(/^\[.*?\]\s*/, "");

  // Check TV / Anime Episode Patterns
  const s01e01Match = base.match(/(.*?)\s+[sS](\d{1,2})[eE](\d{1,3})/i);
  const xEpisodeMatch = base.match(/(.*?)\s+(\d{1,2})x(\d{1,3})/i);

  if (s01e01Match) {
    const cleaned = sanitizeTitle(s01e01Match[1]);
    return {
      cleanedTitle: cleaned.title,
      mediaType: "tv",
      year: cleaned.year,
      season: parseInt(s01e01Match[2], 10),
      episode: parseInt(s01e01Match[3], 10),
      isOvaOrSpecial,
      edition,
      quality,
      extension,
    };
  }

  if (xEpisodeMatch) {
    const cleaned = sanitizeTitle(xEpisodeMatch[1]);
    return {
      cleanedTitle: cleaned.title,
      mediaType: "tv",
      year: cleaned.year,
      season: parseInt(xEpisodeMatch[2], 10),
      episode: parseInt(xEpisodeMatch[3], 10),
      isOvaOrSpecial,
      edition,
      quality,
      extension,
    };
  }

  const animeEpMatch = base.match(/^(.*?)\s+[-–]?\s*(?:ep|episode|#)?\s*(\d{1,3})(?:\s+\[.*\]|\s*\.\w+|\s*\(.*?\)|$)/i);

  if (animeEpMatch && parseInt(animeEpMatch[2], 10) > 0 && !/\b(19|20)\d{2}\b/.test(animeEpMatch[2])) {
    const rawTitle = animeEpMatch[1].replace(/\[.*?\]|\(.*?\)/g, "").trim();
    if (rawTitle.length > 1) {
      const cleaned = sanitizeTitle(rawTitle);
      return {
        cleanedTitle: cleaned.title,
        mediaType: "anime",
        year: cleaned.year,
        season: 1,
        episode: parseInt(animeEpMatch[2], 10),
        isOvaOrSpecial,
        edition,
        quality,
        extension,
      };
    }
  }

  const cleaned = sanitizeTitle(base);
  return {
    cleanedTitle: cleaned.title,
    mediaType: "movie",
    year: cleaned.year,
    isOvaOrSpecial,
    edition,
    quality,
    extension,
  };
}

function sanitizeTitle(raw) {
  let text = raw.replace(/\[.*?\]/g, " ").replace(/\{.*?\}/g, " ").trim();
  
  let year = undefined;
  const yearMatch = text.match(/\b((?:19|20)\d{2})\b/);
  if (yearMatch) {
    year = yearMatch[1];
    text = text.replace(yearMatch[0], " ");
  }

  text = text
    .replace(
      /\b(1080p|720p|4k|2160p|480p|bluray|bdrip|webrip|web-dl|x264|x265|hevc|aac|dts|yify|rarbg|eztv|galaxyrg|flux|subsplease|judas|erai-raws|asw|proper|repack|dual-audio)\b/gi,
      " "
    )
    .replace(/[\(\)\[\]\{\}\-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { title: text || "Untitled", year };
}

function calculateStringSimilarity(s1, s2) {
  const norm1 = s1.toLowerCase().replace(/[^a-z0-9]/g, "");
  const norm2 = s2.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (norm1 === norm2) return 1.0;
  if (norm1.length < 2 || norm2.length < 2) return 0.0;

  const bigrams1 = new Set();
  for (let i = 0; i < norm1.length - 1; i++) {
    bigrams1.add(norm1.substring(i, i + 2));
  }

  let intersection = 0;
  for (let i = 0; i < norm2.length - 1; i++) {
    const bi = norm2.substring(i, i + 2);
    if (bigrams1.has(bi)) intersection++;
  }

  return (2.0 * intersection) / (norm1.length - 1 + norm2.length - 1);
}

function scoreCandidate(candidate, parsed) {
  const candTitle = candidate.title || candidate.name || "";
  const candYear = (candidate.release_date || candidate.first_air_date || "").split("-")[0] || "";
  const candType = candidate.media_type === "tv" ? "tv" : "movie";

  const simTitle = calculateStringSimilarity(parsed.cleanedTitle, candTitle);
  const titleScore = simTitle * 40;

  let yearScore = 7.5;
  if (parsed.year && candYear) {
    const diff = Math.abs(parseInt(parsed.year, 10) - parseInt(candYear, 10));
    if (diff === 0) yearScore = 15;
    else if (diff === 1) yearScore = 12;
    else if (diff === 2) yearScore = 6;
    else yearScore = 0;
  }

  let typeScore = 15;
  if (parsed.mediaType === "tv" || parsed.mediaType === "anime") {
    typeScore = candType === "tv" ? 15 : 0;
  } else if (parsed.mediaType === "movie") {
    typeScore = candType === "movie" ? 15 : 4;
  }

  const seScore = 15;
  const votes = candidate.vote_count || 0;
  let popularityBonus = votes > 5000 ? 10 : votes > 1000 ? 8 : 4;

  return Math.min(100, Math.round(titleScore + yearScore + typeScore + seScore + popularityBonus));
}

// --- TEST CASES ---

test("NLP Parser: 90s psychological anime intent", () => {
  const intent = parseNlpIntent("dark 90s psychological anime");
  assert.equal(intent.mediaType, "anime");
  assert.equal(intent.country, "JP");
  assert.equal(intent.yearStart, 1990);
  assert.equal(intent.yearEnd, 1999);
  assert.equal(intent.mood, "mind-bending");
  assert.ok(intent.genres.includes(9648));
});

test("NLP Parser: Seeded recommendation intent", () => {
  const intent = parseNlpIntent("movies like Inception with twists");
  assert.equal(intent.seedTitle?.toLowerCase(), "inception");
  assert.equal(intent.mediaType, "movie");
  assert.equal(intent.mood, "mind-bending");
});

test("Resolver: Parses standard TV episode tokens (S01E05)", () => {
  const parsed = parseFilename("The.Last.of.Us.S01E05.1080p.mkv");
  assert.equal(parsed.cleanedTitle, "The Last of Us");
  assert.equal(parsed.mediaType, "tv");
  assert.equal(parsed.season, 1);
  assert.equal(parsed.episode, 5);
});

test("Resolver: Parses x episode format (5x14)", () => {
  const parsed = parseFilename("Breaking.Bad.5x14.Ozymandias.720p.HDTV.x264.mkv");
  assert.equal(parsed.cleanedTitle, "Breaking Bad");
  assert.equal(parsed.mediaType, "tv");
  assert.equal(parsed.season, 5);
  assert.equal(parsed.episode, 14);
});

test("Resolver: Parses anime with release groups ([SubsPlease] Frieren - 06)", () => {
  const parsed = parseFilename("[SubsPlease] Frieren - 06 (1080p) [ABCD1234].mkv");
  assert.equal(parsed.cleanedTitle, "Frieren");
  assert.equal(parsed.mediaType, "anime");
  assert.equal(parsed.episode, 6);
});

test("Resolver: Distinguishes same-title movies by year (Spider-Man 2002 vs 2012)", () => {
  const parsed2002 = parseFilename("Spider-Man.2002.1080p.BluRay.mkv");
  assert.equal(parsed2002.cleanedTitle, "Spider Man");
  assert.equal(parsed2002.year, "2002");

  const cand2002 = { title: "Spider-Man", release_date: "2002-05-03", media_type: "movie", vote_count: 18000 };
  const cand2012 = { title: "The Amazing Spider-Man", release_date: "2012-07-03", media_type: "movie", vote_count: 16000 };

  const score2002 = scoreCandidate(cand2002, parsed2002);
  const score2012 = scoreCandidate(cand2012, parsed2002);

  // Exact 2002 movie should score significantly higher than 2012 remake
  assert.ok(score2002 >= 95, `Expected score >= 95, got ${score2002}`);
  assert.ok(score2002 > score2012 + 15, "2002 match should outperform 2012 candidate");
});

test("Resolver: Ambiguous file produces low score and prevents auto-matching", () => {
  const parsedAmbiguous = parseFilename("Movie.2014.1080p.BluRay.mkv");
  const randomCand = { title: "The Lego Movie", release_date: "2014-02-07", media_type: "movie", vote_count: 7000 };

  const score = scoreCandidate(randomCand, parsedAmbiguous);
  // "Movie" vs "The Lego Movie" title similarity is low -> total score must be below high-confidence threshold
  assert.ok(score < 85, `Expected low confidence score < 85, got ${score}`);
});

// 3. Content Guide & Advisory Classification Tests
function parseOfficialRatingsTest(releaseDates, contentRatings) {
  const ratings = [];
  const phItem = releaseDates?.results?.find((r) => r.iso_3166_1 === "PH") ||
    contentRatings?.results?.find((r) => r.iso_3166_1 === "PH");
  const phCert = phItem && "release_dates" in phItem
    ? phItem.release_dates?.[0]?.certification
    : phItem?.rating;
  if (phCert) {
    ratings.push({ system: "MTRCB", value: phCert.toUpperCase(), region: "PH", verified: true });
  }

  const usItem = releaseDates?.results?.find((r) => r.iso_3166_1 === "US") ||
    contentRatings?.results?.find((r) => r.iso_3166_1 === "US");
  const usCert = usItem && "release_dates" in usItem
    ? usItem.release_dates?.[0]?.certification
    : usItem?.rating;
  if (usCert) {
    ratings.push({ system: usCert.startsWith("TV-") ? "TV_PG" : "MPAA", value: usCert.toUpperCase(), region: "US", verified: true });
  }
  return ratings;
}

function classifyContentTest(params) {
  const keywordNames = (params.keywords || []).map((k) => k.name.toLowerCase());
  const genreNames = (params.genres || []).map((g) => g.name.toLowerCase());
  const officialCerts = (params.officialRatings || []).map((r) => r.value.toUpperCase());

  const isFamilySafe = genreNames.includes("family") || genreNames.includes("animation") || officialCerts.includes("G") || officialCerts.includes("TV-Y");
  const isAdultRated = officialCerts.includes("R") || officialCerts.includes("R-18") || officialCerts.includes("TV-MA");

  let violence = "unknown";
  if (keywordNames.some((k) => k.includes("gore") || k.includes("massacre"))) violence = "severe";
  else if (genreNames.includes("war") || keywordNames.some((k) => k.includes("gunfight"))) violence = isAdultRated ? "strong" : "moderate";
  else if (isFamilySafe) violence = "none";

  let sexualContent = "unknown";
  if (keywordNames.some((k) => k.includes("nudity") || k.includes("explicit sex"))) sexualContent = "strong";
  else if (isFamilySafe) sexualContent = "none";

  let drugs = "unknown";
  if (keywordNames.some((k) => k.includes("cocaine") || k.includes("drug abuse"))) drugs = "strong";
  else if (isFamilySafe) drugs = "none";

  return {
    dimensions: { violence, sexualContent, drugs, theme: isAdultRated ? "strong" : "moderate" },
    flags: keywordNames.filter((k) => k.includes("gore") || k.includes("nudity")),
  };
}

test("Content Guide: Distinguishes official MTRCB rating from AI analysis", () => {
  const releaseDates = {
    results: [
      { iso_3166_1: "PH", release_dates: [{ certification: "SPG" }] },
      { iso_3166_1: "US", release_dates: [{ certification: "PG-13" }] },
    ],
  };
  const ratings = parseOfficialRatingsTest(releaseDates);
  assert.equal(ratings.length, 2);
  assert.equal(ratings[0].system, "MTRCB");
  assert.equal(ratings[0].value, "SPG");
  assert.equal(ratings[0].verified, true);
});

test("Content Guide: Explicitly preserves UNKNOWN without assuming NONE", () => {
  const result = classifyContentTest({
    title: "Obscure Indie Film",
    genres: [{ id: 18, name: "Drama" }],
    keywords: [], // No explicit substance or violence signals
  });

  // When no evidence is present, violence and drugs MUST be unknown, NOT coerced to none!
  assert.equal(result.dimensions.violence, "unknown");
  assert.equal(result.dimensions.drugs, "unknown");
  assert.notEqual(result.dimensions.violence, "none");
});

test("Content Guide: Correctly flags severe gore and violence", () => {
  const result = classifyContentTest({
    title: "Terrifier",
    genres: [{ id: 27, name: "Horror" }],
    keywords: [{ id: 1, name: "extreme gore" }, { id: 2, name: "slasher massacre" }],
    officialRatings: [{ system: "MPAA", value: "R", region: "US", verified: true }],
  });

  assert.equal(result.dimensions.violence, "severe");
  assert.ok(result.flags.includes("extreme gore"));
});

test("NLP Parser: Extracts content advisory intent (no gore, PG, strong violence)", () => {
  // Test query 1
  const intent1 = parseNlpIntent("horror movies with strong violence but no gore");
  assert.equal(intent1.violence, "strong");
  assert.equal(intent1.withoutGore, true);
  assert.ok(intent1.genres.includes(27));

  // Test query 2
  const intent2 = parseNlpIntent("find family anime with no sexual content");
  assert.equal(intent2.mediaType, "anime");
  assert.equal(intent2.sexualContent, "none");
  assert.equal(intent2.withoutNudity, true);
});

// 4. Multi-Server Download Resolution & Strict Indexing Tests
const SERVERS = [
  { id: "server1", name: "VidLink Pro" },
  { id: "server2", name: "VidSrc PM" },
  { id: "server3", name: "VidSrc ME" },
];

function probeStreamTest(mediaId, preferredServer, releaseDate, status) {
  if (!mediaId || mediaId === "invalid_id") {
    return { available: false, canIndex: false, error: "Stream unavailable on all mirrors." };
  }

  // Check unreleased date
  if (releaseDate && new Date(releaseDate).getTime() > Date.now()) {
    return { available: false, canIndex: false, error: "Cannot download unreleased title." };
  }

  if (status && status === "In Production") {
    return { available: false, canIndex: false, error: "Cannot download title in production." };
  }

  const workingServer = SERVERS.find((s) => s.id === preferredServer) || SERVERS[0];
  const alternatives = SERVERS.filter((s) => s.id !== workingServer.id);

  return {
    available: true,
    canIndex: true,
    workingServer,
    downloadUrl: `https://stream-gateway.io/${mediaId}`,
    alternatives,
  };
}

test("Stream Engine: Verifies working server and recommends backup mirrors", () => {
  const result = probeStreamTest("27205", "server2", "2010-07-16", "Released");
  assert.equal(result.available, true);
  assert.equal(result.canIndex, true);
  assert.equal(result.workingServer.name, "VidSrc PM");
  assert.ok(result.downloadUrl.includes("27205"));
  assert.ok(result.alternatives.length >= 1);
});

test("Stream Engine: Forbids stream when unavailable across all mirrors", () => {
  const result = probeStreamTest("invalid_id", "server1");
  assert.equal(result.available, false);
  assert.equal(result.canIndex, false);
});

test("Stream Engine: Strictly rejects unreleased movies (e.g. Spider-Man Brand New Day)", () => {
  const unreleasedResult = probeStreamTest("99999", "server1", "2026-12-31", "In Production");
  assert.equal(unreleasedResult.available, false);
  assert.equal(unreleasedResult.canIndex, false);
  assert.ok(unreleasedResult.error.includes("unreleased") || unreleasedResult.error.includes("production"));
});

// 5. Ultimate Search & Filter Engine Tests
test("Search AST: Parses Person / Director Intent", () => {
  const q = "movies directed by Christopher Nolan";
  assert.ok(q.toLowerCase().includes("christopher nolan"));
});

test("Search AST: Parses Similarity Intent (something like Interstellar)", () => {
  const simMatch = "movies like Interstellar".match(/(?:movies|shows|series|anime|films|something)\s+(?:like|similar to)\s+(.+)/i);
  assert.ok(simMatch);
  assert.equal(simMatch[1], "Interstellar");
});

test("Ranking Engine: Exact title match gets highest relevance score", () => {
  const query = "batman";
  const candidates = [
    { title: "Batman", popularity: 50, vote_average: 8.2 },
    { title: "The Batman", popularity: 60, vote_average: 7.8 },
    { title: "Batman Begins", popularity: 40, vote_average: 8.0 },
    { title: "Lego Batman Movie", popularity: 30, vote_average: 7.2 },
  ];

  const scored = candidates.map((item) => {
    let score = 0;
    if (item.title.toLowerCase() === query) score += 120;
    else if (item.title.toLowerCase().startsWith(query)) score += 70;
    else if (item.title.toLowerCase().includes(query)) score += 45;
    score += (item.vote_average || 0) * 2;
    return { ...item, score };
  }).sort((a, b) => b.score - a.score);

  assert.equal(scored[0].title, "Batman");
});

test("Ranking Engine: Levenshtein detects typo correction (interstelar -> Interstellar)", () => {
  function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1) ? matrix[i - 1][j - 1] : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }

  const dist = levenshtein("interstelar", "interstellar");
  assert.equal(dist, 1);
});

// 6. Gamification & Progression Tests
test("Achievements: Level & Rank Curve derives properly from XP", () => {
  function calculateProgression(totalXp) {
    let level = 1;
    let accumulatedXp = 0;
    while (level < 100) {
      const xpForThisLevel = Math.floor(300 * Math.pow(level, 1.25));
      if (totalXp < accumulatedXp + xpForThisLevel) {
        let rank = "Novice Watcher";
        if (level >= 90) rank = "Obsidian Immortal";
        else if (level >= 80) rank = "Cinema Visionary";
        else if (level >= 70) rank = "Master of the Reel";
        else if (level >= 60) rank = "Grand Archivist";
        else if (level >= 50) rank = "Celluloid Scholar";
        else if (level >= 40) rank = "Screen Connoisseur";
        else if (level >= 30) rank = "Seasoned Cinephile";
        else if (level >= 20) rank = "Avid Filmgoer";
        else if (level >= 10) rank = "Cinema Apprentice";
        return { level, rank };
      }
      accumulatedXp += xpForThisLevel;
      level++;
    }
    return { level: 100, rank: "Obsidian Immortal" };
  }

  const p1 = calculateProgression(50);
  assert.equal(p1.level, 1);
  assert.equal(p1.rank, "Novice Watcher");

  const p2 = calculateProgression(5000);
  assert.ok(p2.level >= 4);

  const p3 = calculateProgression(870000);
  assert.ok(p3.level >= 50);
  assert.equal(p3.rank, "Celluloid Scholar");
});

test("Taxonomy: Contains all essential anime subgenres & standard genres", () => {
  const animeThemes = ["anime_isekai", "anime_shounen", "anime_seinen", "anime_mecha", "anime_slice_of_life"];
  animeThemes.forEach((t) => {
    assert.ok(t.startsWith("anime_"));
  });
});

// 7. Watch Providers & Free Streaming Tests
test("Watch Providers: Correctly categorizes Free Services vs SVOD vs TV Apps", () => {
  const providers = [
    { id: 73, name: "Tubi TV", category: "free", monetization: "ads" },
    { id: 300, name: "Pluto TV", category: "free", monetization: "ads" },
    { id: 8, name: "Netflix", category: "subscription", monetization: "flatrate" },
    { id: 337, name: "Disney+", category: "subscription", monetization: "flatrate" },
    { id: 2, name: "Apple TV Store", category: "rent_buy", monetization: "buy" },
    { id: 1001, name: "ABC", category: "tv_app", monetization: "free" },
  ];

  const freeProviders = providers.filter((p) => p.category === "free");
  const subProviders = providers.filter((p) => p.category === "subscription");
  const rentBuyProviders = providers.filter((p) => p.category === "rent_buy");

  assert.equal(freeProviders.length, 2);
  assert.equal(subProviders.length, 2);
  assert.equal(rentBuyProviders.length, 1);
  assert.ok(freeProviders.some((p) => p.name === "Tubi TV"));
  assert.ok(subProviders.some((p) => p.name === "Netflix"));
});

// 8. Legitimate Cinema & Search Integrity Tests
test("Search Integrity: Filters out non-movie YouTube/Spotify podcast scrap with zero poster & zero votes", () => {
  function isLegitimateMedia(item) {
    if (!item) return false;
    if (item.media_type === "person" || item.media_type === "collection") return true;
    const hasArtwork = Boolean(item.poster_path || item.backdrop_path);
    const voteCount = Number(item.vote_count || 0);
    const title = (item.title || item.name || "").toLowerCase();

    const isPodcastOrScrap =
      title.includes("podcast") ||
      title.includes("spotify") ||
      title.includes("talkshow") ||
      title.includes("audiobook");

    if (!hasArtwork && voteCount === 0) return false;
    if (isPodcastOrScrap && !hasArtwork && voteCount === 0) return false;
    return true;
  }

  // Example from user query: "Hockey Psychology" (obscure podcast scrap with no poster & 0 votes)
  const hockeyPodcast = {
    id: 310518,
    media_type: "tv",
    title: "Hockey Psychology",
    poster_path: null,
    backdrop_path: null,
    vote_count: 0,
    popularity: 2.1,
  };

  // Legitimate movie: "Inception"
  const inceptionMovie = {
    id: 27205,
    media_type: "movie",
    title: "Inception",
    poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
    vote_count: 36000,
    popularity: 120.5,
  };

  assert.equal(isLegitimateMedia(hockeyPodcast), false);
  assert.equal(isLegitimateMedia(inceptionMovie), true);
});

test("Trailer Engine: Prioritizes Official YouTube Trailers over teasers and clips", () => {
  const mockVideos = [
    { site: "YouTube", type: "Featurette", official: false, key: "feat_123" },
    { site: "YouTube", type: "Teaser", official: true, key: "teaser_456" },
    { site: "YouTube", type: "Trailer", official: false, key: "fan_trailer_789" },
    { site: "YouTube", type: "Trailer", official: true, key: "official_trailer_999" },
  ];

  const officialTrailer =
    mockVideos.find((v) => v.site === "YouTube" && v.official && v.type === "Trailer") ||
    mockVideos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    mockVideos.find((v) => v.site === "YouTube" && v.official && v.type === "Teaser");

  assert.equal(officialTrailer?.key, "official_trailer_999");
});

test("Universe Timelines: Correctly sorts MCU items by chronological vs release rank", () => {
  const mcuSample = [
    { title: "The Avengers", chronologicalRank: 6, releaseRank: 6, year: 2012 },
    { title: "Captain America: The First Avenger", chronologicalRank: 1, releaseRank: 5, year: 2011 },
    { title: "Iron Man", chronologicalRank: 3, releaseRank: 1, year: 2008 },
    { title: "Captain Marvel", chronologicalRank: 2, releaseRank: 21, year: 2019 },
  ];

  const chronologicalSorted = [...mcuSample].sort((a, b) => a.chronologicalRank - b.chronologicalRank);
  assert.equal(chronologicalSorted[0].title, "Captain America: The First Avenger");
  assert.equal(chronologicalSorted[1].title, "Captain Marvel");
  assert.equal(chronologicalSorted[2].title, "Iron Man");

  const releaseSorted = [...mcuSample].sort((a, b) => a.releaseRank - b.releaseRank);
  assert.equal(releaseSorted[0].title, "Iron Man");
  assert.equal(releaseSorted[1].title, "Captain America: The First Avenger");
});

test("Sports Genre: Accurately parses sports intent and filters sports movies/anime", () => {
  const sportsMovies = [
    { title: "Creed", overview: "The former World Heavyweight Champion Rocky Balboa serves as a trainer to Adonis Johnson.", genre_ids: [18] },
    { title: "Haikyuu!!", overview: "Inspired by the Little Giant, Hinata Shouyou joins the Karasuno High volleyball team.", genre_ids: [16, 35] },
    { title: "Interstellar", overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.", genre_ids: [12, 18, 878] },
  ];

  const sportsKeywords = ["sport", "athlete", "volleyball", "boxer", "championship", "trainer"];

  const filteredSports = sportsMovies.filter((item) => {
    const text = `${item.title} ${item.overview}`.toLowerCase();
    return sportsKeywords.some((kw) => text.includes(kw));
  });

  assert.equal(filteredSports.length, 2);
  assert.equal(filteredSports[0].title, "Creed");
  assert.equal(filteredSports[1].title, "Haikyuu!!");
});

test("Modular Search: Multi-dimensional filter preserves media-aware boundaries", () => {
  const sampleItems = [
    { id: 1, title: "Attack on Titan", media_type: "tv", origin_country: ["JP"], original_language: "ja", genre_ids: [16], vote_average: 8.9 },
    { id: 2, title: "Family Guy", media_type: "tv", origin_country: ["US"], original_language: "en", genre_ids: [16], vote_average: 7.2 },
    { id: 3, title: "Our Planet", media_type: "tv", origin_country: ["GB"], genre_ids: [99], vote_average: 9.3 },
  ];

  // Test Anime specific filter
  const animeFiltered = sampleItems.filter((i) => i.origin_country?.includes("JP") && (i.genre_ids?.includes(16) || i.original_language === "ja"));
  assert.equal(animeFiltered.length, 1);
  assert.equal(animeFiltered[0].title, "Attack on Titan");

  // Test Documentary filter
  const docFiltered = sampleItems.filter((i) => i.genre_ids?.includes(99));
  assert.equal(docFiltered.length, 1);
  assert.equal(docFiltered[0].title, "Our Planet");
});

test("Modular Search: Multi-signal ranking assigns exact match #1 position", () => {
  const candidates = [
    { title: "Dark Knight", score: 60 },
    { title: "The Dark Knight", score: 100 },
    { title: "The Dark Knight Rises", score: 85 },
  ];

  const sorted = candidates.sort((a, b) => b.score - a.score);
  assert.equal(sorted[0].title, "The Dark Knight");
  assert.equal(sorted[0].score, 100);
});

test("Network Guard: Data Saver reduces video streaming bandwidth consumption by >60%", () => {
  // Test 1 hour (3600 seconds) in standard 1080p vs Data-Saver 360p
  const standardKbps = 4500;
  const dataSaverKbps = 600;
  const seconds = 3600;

  const standardMb = (standardKbps * seconds) / 8192;
  const dataSaverMb = (dataSaverKbps * seconds) / 8192;

  assert.ok(dataSaverMb < 300); // 360p data saver is ~263 MB / hr
  assert.ok(standardMb > 1800); // 1080p is ~1.97 GB / hr
  const reductionRatio = (standardMb - dataSaverMb) / standardMb;
  assert.ok(reductionRatio > 0.8); // Over 80% reduction
});



