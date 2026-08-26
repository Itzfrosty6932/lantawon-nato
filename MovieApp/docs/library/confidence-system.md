# Confidence Thresholds & Correction Architecture

**Date**: 2026-08-22  
**Purpose**: Define strict confidence tiers and manual override mechanics.

---

## 1. Confidence Tiers & UI Behaviors

| Score Range | Classification | UI Treatment | Scanner Behavior |
| :---: | :---: | :--- | :--- |
| **95% – 100%** | `high_confidence` | Green match badge | Automatic attachment to TMDB canonical record. |
| **85% – 94%** | `review_needed` | Amber match badge | Automatic attachment, flagged with "Review Suggested". |
| **60% – 84%** | `ambiguous` | Orange match badge + "Fix Match" CTA | Displays top 3 candidates for 1-click user disambiguation. |
| **< 60%** | `unknown` | Red badge + Manual Search Modal | Retains raw filename title; prompts user to search TMDB. |

---

## 2. Rematch Prevention & Local Media Identity

Every scanned video file generates a deterministic fingerprint:
`fp_{sizeBytes}_{sanitizedFileName}`

When the user selects or edits a candidate match via the Match Correction Modal:
1. `matchStatus` transitions to `"confirmed"`.
2. `matchConfidence` is locked at `100%`.
3. `isUserOverridden` is flagged `true`.
4. On future scans, the fingerprint matches immediately, skipping network queries and preserving user preferences permanently.
