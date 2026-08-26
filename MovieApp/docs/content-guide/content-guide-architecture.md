# CineMind Content Classification & Content Guide Architecture

**Date**: 2026-08-22  
**Status**: ACTIVE ARCHITECTURAL STANDARD  
**Core Principle**: Information, Discovery & Transparency — Never Restrict, Block, or Censor

---

## 1. System Tenets

1. **Every Media Item Remains 100% Watchable**: Classification and advisory data exist solely to inform viewers and enable precise catalog discovery. The platform never disables the Watch button, blocks titles, or modifies video streams.
2. **Official Ratings $\ne$ Content Analysis**: Government ratings (MTRCB, MPAA, BBFC) are stored as distinct verified entities with provenance separate from AI semantic enrichment or subtitle analysis.
3. **Explicit Unknown State**: `UNKNOWN \ne NONE`. If reliable evidence is absent for a dimension (e.g. Drugs = UNKNOWN), it is explicitly labeled as `Unknown` rather than fabricating a clean record.

---

## 2. Dimensional Data Model

### 6 Principal MTRCB-Oriented Dimensions
1. **Theme**: Societal, mature, or complex narrative themes.
2. **Language**: Profanity, strong language, expletives.
3. **Violence**: Physical conflict, weapons, blood, gore.
4. **Sexual Content**: Intimacy, nudity, sexual dialogue/innuendo.
5. **Horror**: Fear, jump scares, intense dread, psychological distress.
6. **Drugs**: Substance abuse, illicit narcotics, alcohol, smoking.

### Severity Scale (Normalized)
- `none` (Level 0): Zero presence or strictly wholesome context.
- `mild` (Level 1): Infrequent, minor, or comedic presence.
- `moderate` (Level 2): Noticeable presence; requires viewer awareness.
- `strong` (Level 3): Pervasive, intense, or graphic depiction.
- `severe` (Level 4): Extreme intensity, visceral gore, or explicit content.
- `unknown` (Level -1): No verified or inferred data available.

---

## 3. Provenance & Conflict Resolution Hierarchy

Each rating, dimension, and flag records its provenance:

```
[OFFICIAL_SOURCE]      (MTRCB, MPAA, BBFC official filings)
       │
       ▼ (Higher priority)
[TRUSTED_METADATA]     (TMDB certifications, IMDb parent guide verified entries)
       │
       ▼
[CURATED_METADATA]     (Manual review by film taxonomists)
       │
       ▼
[LOCAL_VIDEO_ANALYSIS] (Deterministic local subtitle/transcript lexicon tokenization)
       │
       ▼
[AI_INFERENCE]         (NLP semantic classification from overview & keywords)
       │
       ▼
[USER_CORRECTION]      (Local user-confirmed override stored in Dexie)
```

**Conflict Resolution Rule**: When multiple sources disagree on a dimension's severity, the highest priority tier wins. If sources in the same tier conflict, the higher severity is reported with a `hasConflict: true` flag and dual provenance citations in the detailed inspector modal.
