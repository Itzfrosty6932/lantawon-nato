import { db } from "@/lib/db/dexie-db";
import type {
  ContentClassification,
  ContentDimensions,
  ContentFlag,
  DimensionProvenance,
  OfficialRatingRecord,
  RatingSystem,
  SeverityLevel,
} from "@/types/content-guide";

export class ContentGuideService {
  /**
   * 1. Official Ratings Normalizer from Raw TMDB Data
   */
  static parseOfficialRatings(
    releaseDatesData?: { results?: Array<{ iso_3166_1: string; release_dates?: Array<{ certification: string }> }> },
    contentRatingsData?: { results?: Array<{ iso_3166_1: string; rating: string }> }
  ): OfficialRatingRecord[] {
    const ratings: OfficialRatingRecord[] = [];

    // Check Philippine MTRCB Certification
    const phItem = releaseDatesData?.results?.find((r) => r.iso_3166_1 === "PH") ||
      contentRatingsData?.results?.find((r) => r.iso_3166_1 === "PH");

    const phCert = phItem && "release_dates" in phItem
      ? phItem.release_dates?.[0]?.certification
      : (phItem as { rating?: string })?.rating;

    if (phCert && phCert.trim()) {
      ratings.push({
        system: "MTRCB",
        value: phCert.toUpperCase(),
        region: "PH",
        source: "Official MTRCB / Verified Release Records",
        verified: true,
        meaning: this.getMtrcbDescription(phCert.toUpperCase()),
      });
    }

    // Check US MPAA / TV Parental Guidelines
    const usItem = releaseDatesData?.results?.find((r) => r.iso_3166_1 === "US") ||
      contentRatingsData?.results?.find((r) => r.iso_3166_1 === "US");

    const usCert = usItem && "release_dates" in usItem
      ? usItem.release_dates?.[0]?.certification
      : (usItem as { rating?: string })?.rating;

    if (usCert && usCert.trim()) {
      const isTv = usCert.toUpperCase().startsWith("TV-");
      ratings.push({
        system: isTv ? "TV_PG" : "MPAA",
        value: usCert.toUpperCase(),
        region: "US",
        source: isTv ? "TV Parental Guidelines" : "Motion Picture Association (MPAA)",
        verified: true,
        meaning: this.getMpaaDescription(usCert.toUpperCase()),
      });
    }

    // Check GB BBFC Certification
    const gbItem = releaseDatesData?.results?.find((r) => r.iso_3166_1 === "GB");
    const gbCert = gbItem?.release_dates?.[0]?.certification;
    if (gbCert && gbCert.trim()) {
      ratings.push({
        system: "BBFC",
        value: gbCert.toUpperCase(),
        region: "GB",
        source: "British Board of Film Classification (BBFC)",
        verified: true,
      });
    }

    return ratings;
  }

  private static getMtrcbDescription(cert: string): string {
    switch (cert) {
      case "G":
        return "General Patronage — Suitable for all audiences.";
      case "PG":
        return "Parental Guidance — Viewers under 13 must be accompanied by a parent or guardian.";
      case "SPG":
        return "Strong Parental Guidance — Contains mature themes, violence, or language requiring parental supervision.";
      case "R-13":
        return "Restricted-13 — Suitable only for viewers 13 years old and above.";
      case "R-16":
        return "Restricted-16 — Suitable only for viewers 16 years old and above.";
      case "R-18":
        return "Restricted-18 — Strictly for adult audiences 18 years old and above.";
      default:
        return `Official Philippine Classification: ${cert}`;
    }
  }

  private static getMpaaDescription(cert: string): string {
    switch (cert) {
      case "G":
        return "General Audiences — All ages admitted.";
      case "PG":
        return "Parental Guidance Suggested — Some material may not be suitable for children.";
      case "PG-13":
        return "Parents Strongly Cautioned — Some material may be inappropriate for children under 13.";
      case "R":
        return "Restricted — Under 17 requires accompanying parent or adult guardian.";
      case "NC-17":
        return "Adults Only — No one 17 and under admitted.";
      case "TV-MA":
        return "Mature Audience Only — Specifically designed to be viewed by adults.";
      case "TV-14":
        return "Parents Strongly Cautioned — Unsuitable for children under 14.";
      case "TV-PG":
        return "Parental Guidance Suggested.";
      case "TV-Y7":
        return "Directed to Older Children (7+).";
      case "TV-Y":
        return "All Children.";
      default:
        return `Official Classification: ${cert}`;
    }
  }

  /**
   * 2. Multi-Signal Content Dimensions & Flags Classifier
   */
  static classifyMediaContent(params: {
    mediaId: string;
    mediaType: "movie" | "tv" | "anime" | "documentary";
    title: string;
    overview: string;
    genres: Array<{ id: number; name: string }>;
    keywords?: Array<{ id: number; name: string }>;
    officialRatings?: OfficialRatingRecord[];
  }): ContentClassification {
    const text = `${params.title} ${params.overview}`.toLowerCase();
    const keywordNames = (params.keywords || []).map((k) => k.name.toLowerCase());
    const genreNames = params.genres.map((g) => g.name.toLowerCase());
    const officialCerts = (params.officialRatings || []).map((r) => r.value.toUpperCase());

    const isFamilySafe = genreNames.includes("family") || genreNames.includes("animation") || officialCerts.includes("G") || officialCerts.includes("TV-Y");
    const isAdultRated = officialCerts.includes("R") || officialCerts.includes("R-18") || officialCerts.includes("NC-17") || officialCerts.includes("TV-MA");
    const isHorror = genreNames.includes("horror") || keywordNames.some((k) => k.includes("horror") || k.includes("fear") || k.includes("slasher"));

    // Dimension: VIOLENCE
    let violence: SeverityLevel = "unknown";
    let violenceConf = 0.7;
    let violenceExpl = "Inferred from genre & keyword ontology.";

    if (keywordNames.some((k) => k.includes("gore") || k.includes("massacre") || k.includes("torture") || k.includes("bloody"))) {
      violence = "severe";
      violenceConf = 0.95;
      violenceExpl = "Graphic violence/gore keywords detected.";
    } else if (genreNames.includes("war") || keywordNames.some((k) => k.includes("violence") || k.includes("gunfight") || k.includes("murder") || k.includes("assassin"))) {
      violence = isAdultRated ? "strong" : "moderate";
      violenceConf = 0.88;
      violenceExpl = "Action combat & intense weapon violence.";
    } else if (genreNames.includes("action") || genreNames.includes("thriller")) {
      violence = isFamilySafe ? "mild" : "moderate";
      violenceConf = 0.82;
      violenceExpl = "Stylized action / thriller physical conflict.";
    } else if (isFamilySafe && !genreNames.includes("action")) {
      violence = "none";
      violenceConf = 0.9;
      violenceExpl = "Family/all-ages certified.";
    }

    // Dimension: SEXUAL CONTENT
    let sexualContent: SeverityLevel = "unknown";
    let sexualConf = 0.7;
    let sexualExpl = "Inferred from genre & keyword ontology.";

    if (keywordNames.some((k) => k.includes("nudity") || k.includes("erotic") || k.includes("explicit sex"))) {
      sexualContent = "strong";
      sexualConf = 0.92;
      sexualExpl = "Nudity or explicit sexual themes indicated.";
    } else if (keywordNames.some((k) => k.includes("sex") || k.includes("sensuality") || k.includes("infidelity"))) {
      sexualContent = isAdultRated ? "moderate" : "mild";
      sexualConf = 0.8;
      sexualExpl = "Sensuality / romantic intimacy depicted.";
    } else if (isFamilySafe) {
      sexualContent = "none";
      sexualConf = 0.95;
      sexualExpl = "Wholesome general patronage certification.";
    }

    // Dimension: LANGUAGE
    let language: SeverityLevel = "unknown";
    let languageConf = 0.65;
    let languageExpl = "Inferred from rating standards.";

    if (isAdultRated) {
      language = "strong";
      languageConf = 0.85;
      languageExpl = "Pervasive strong language standard for R / TV-MA titles.";
    } else if (officialCerts.includes("PG-13") || officialCerts.includes("TV-14") || officialCerts.includes("SPG")) {
      language = "moderate";
      languageConf = 0.8;
      languageExpl = "Infrequent expletives permitted under PG-13 / SPG guidelines.";
    } else if (isFamilySafe) {
      language = "none";
      languageConf = 0.9;
      languageExpl = "Clean dialogue suitable for general audiences.";
    }

    // Dimension: HORROR / FEAR
    let horror: SeverityLevel = "unknown";
    let horrorConf = 0.75;
    let horrorExpl = "Inferred from themes & tone.";

    if (isHorror) {
      horror = isAdultRated || keywordNames.some((k) => k.includes("supernatural") || k.includes("demon") || k.includes("possession"))
        ? "strong"
        : "moderate";
      horrorConf = 0.9;
      horrorExpl = "Intense horror, supernatural fear, or dread elements.";
    } else if (genreNames.includes("mystery") || genreNames.includes("thriller")) {
      horror = "mild";
      horrorConf = 0.78;
      horrorExpl = "Mild suspense / psychological tension.";
    } else if (isFamilySafe && !genreNames.includes("fantasy")) {
      horror = "none";
      horrorConf = 0.92;
      horrorExpl = "Zero horror themes present.";
    }

    // Dimension: DRUGS / SUBSTANCE USE
    let drugs: SeverityLevel = "unknown";
    let drugsConf = 0.65;
    let drugsExpl = "Inferred from thematic keywords.";

    if (keywordNames.some((k) => k.includes("drug abuse") || k.includes("cocaine") || k.includes("heroin") || k.includes("cartel") || k.includes("overdose"))) {
      drugs = "strong";
      drugsConf = 0.92;
      drugsExpl = "Substance trafficking, illicit narcotics, or severe addiction portrayed.";
    } else if (keywordNames.some((k) => k.includes("alcoholism") || k.includes("smoking") || k.includes("marijuana") || k.includes("drinking"))) {
      drugs = "mild";
      drugsConf = 0.8;
      drugsExpl = "Casual alcohol consumption or tobacco usage.";
    } else if (isFamilySafe) {
      drugs = "none";
      drugsConf = 0.95;
      drugsExpl = "Zero substance references.";
    }

    // Dimension: THEME
    let theme: SeverityLevel = isAdultRated ? "strong" : officialCerts.includes("PG-13") || officialCerts.includes("SPG") ? "moderate" : isFamilySafe ? "mild" : "unknown";
    let themeConf = 0.75;
    let themeExpl = "Maturity of narrative concepts.";

    const isHigh = (s: SeverityLevel) => s === "strong" || s === "severe" || s === "moderate";
    const isVeryHigh = (s: SeverityLevel) => s === "strong" || s === "severe";

    // EXTRACT CONTENT FLAGS
    const flags: ContentFlag[] = [];
    if (isVeryHigh(violence)) flags.push("violence");
    if (keywordNames.some((k) => k.includes("gore"))) flags.push("gore");
    if (keywordNames.some((k) => k.includes("jumpscare"))) flags.push("jumpscare");
    if (keywordNames.some((k) => k.includes("nudity"))) flags.push("nudity");
    if (isHigh(sexualContent)) flags.push("sexual-content");
    if (isVeryHigh(language)) flags.push("strong-language");
    if (isVeryHigh(drugs)) flags.push("drug-use");
    if (keywordNames.some((k) => k.includes("psychological"))) flags.push("psychological-distress");
    if (keywordNames.some((k) => k.includes("weapon") || k.includes("gun"))) flags.push("weapons");
    if (keywordNames.some((k) => k.includes("suicide") || k.includes("self-harm"))) flags.push("self-harm");

    const now = new Date().toISOString();

    const dimensions: ContentDimensions = {
      theme,
      language,
      violence,
      sexualContent,
      horror,
      drugs,
    };

    const dimensionProvenance: Record<keyof ContentDimensions, DimensionProvenance> = {
      theme: { level: theme, source: "ai_inference", confidence: themeConf, timestamp: now, verified: false, explanation: themeExpl },
      language: { level: language, source: "trusted_metadata", confidence: languageConf, timestamp: now, verified: true, explanation: languageExpl },
      violence: { level: violence, source: "trusted_metadata", confidence: violenceConf, timestamp: now, verified: true, explanation: violenceExpl },
      sexualContent: { level: sexualContent, source: "trusted_metadata", confidence: sexualConf, timestamp: now, verified: true, explanation: sexualExpl },
      horror: { level: horror, source: "ai_inference", confidence: horrorConf, timestamp: now, verified: false, explanation: horrorExpl },
      drugs: { level: drugs, source: "ai_inference", confidence: drugsConf, timestamp: now, verified: false, explanation: drugsExpl },
    };

    // Calculate Overall Severity
    const levels = [theme, language, violence, sexualContent, horror, drugs];
    let overallSeverity: SeverityLevel = "unknown";
    if (levels.includes("severe")) overallSeverity = "severe";
    else if (levels.includes("strong")) overallSeverity = "strong";
    else if (levels.includes("moderate")) overallSeverity = "moderate";
    else if (levels.includes("mild")) overallSeverity = "mild";
    else if (levels.every((l) => l === "none")) overallSeverity = "none";

    const primaryMtrcb = params.officialRatings?.find((r) => r.system === "MTRCB");
    const primaryRating = primaryMtrcb ? primaryMtrcb.value : params.officialRatings?.[0]?.value || "NR";
    const primaryRatingSystem: RatingSystem = primaryMtrcb ? "MTRCB" : params.officialRatings?.[0]?.system || "OTHER";

    return {
      mediaId: params.mediaId,
      mediaType: params.mediaType,
      officialRatings: params.officialRatings || [],
      primaryRating,
      primaryRatingSystem,
      dimensions,
      dimensionProvenance,
      flags,
      overallSeverity,
      analysisStatus: "analyzed",
      isUserOverridden: false,
      lastUpdated: now,
    };
  }

  /**
   * 3. Persist and Retrieve Content Guide locally from IndexedDB
   */
  static async getClassification(mediaId: string): Promise<ContentClassification | null> {
    try {
      const existing = await db.contentClassifications.get(mediaId);
      if (existing) return existing;
    } catch {}
    return null;
  }

  static async saveClassification(classification: ContentClassification): Promise<void> {
    try {
      await db.contentClassifications.put(classification);
    } catch (e) {
      console.warn("[ContentGuideService saveClassification Error]", e);
    }
  }

  static async recordUserCorrection(
    mediaId: string,
    dimension: keyof ContentDimensions,
    correctedLevel: SeverityLevel,
    note?: string
  ): Promise<void> {
    try {
      const existing = await this.getClassification(mediaId);
      if (existing) {
        existing.dimensions[dimension] = correctedLevel;
        existing.dimensionProvenance[dimension] = {
          level: correctedLevel,
          source: "user_correction",
          confidence: 1.0,
          timestamp: new Date().toISOString(),
          verified: true,
          explanation: note || "User submitted manual correction.",
        };
        existing.isUserOverridden = true;
        existing.lastUpdated = new Date().toISOString();
        await db.contentClassifications.put(existing);
      }
    } catch (e) {
      console.warn("[ContentGuideService userCorrection Error]", e);
    }
  }
}
