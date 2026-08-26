# Open-Source Content Guide & Media Analysis Repository Evaluation

**Date**: 2026-08-22  
**Purpose**: Evaluate open-source parental guide datasets, NLP subtitle models, and classification approaches for integration into CineMind's local-first architecture.

---

## 1. Repository & Dataset Evaluation Matrix

| Repository / Project | Focus & Core Mechanism | License | Architecture Compatibility | Local-First Viability | Censorship Risk | Final Decision |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: |
| **`BarryHaworth/IMDB` (Parental Guide Dataset)** | 5-dimension advisory dataset (Sex & Nudity, Violence & Gore, Profanity, Substance, Frightening) categorized into None/Mild/Moderate/Severe. | Open Data (CC BY-SA) | **High**: Clean tabular taxonomy easily maps to MTRCB 6-dimension schema. | **High**: Zero-cloud local dictionary lookup. | None | **APPROVED (Ontology & Schema Reference)** |
| **`MikeBlom/cleanmedia`** | Video filtering & scene-skipping scripts based on subtitle timecodes. | MIT | Medium: Subtitle timestamp parsing. | High local JS execution. | **HIGH (Violates Core Rule #1)** | **ADAPTED AS METADATA ONLY (Scene censorship strictly banned)** |
| **`Nathx/parental_advisory_ml`** | Subtitle NLP classification predicting MPAA ratings and content categories. | MIT | **High**: Text tokenization and frequency analysis. | **High**: Ported to lightweight client-side TypeScript NLP tokenizer. | None | **APPROVED (Local Subtitle/Transcript Lexicon Scorer)** |

---

## 2. Architectural Decisions

1. **Information Layer Only**: In accordance with CineMind Core Rule #1, content classifications never block playback, censor scenes, or mute audio. All media items remain 100% playable.
2. **Deterministic Multi-System Ratings**: Official ratings (MTRCB `G/PG/SPG/R-13/R-16/R-18`, MPAA `G/PG/PG-13/R/NC-17`, BBFC `U/PG/12A/15/18`, TV Parental Guidelines `TV-Y/TV-PG/TV-14/TV-MA`) are stored as verified official records with distinct provenance from AI or subtitle NLP inferences.
3. **Strict UNKNOWN Handling**: Missing data is explicitly marked as `UNKNOWN`. `UNKNOWN` is never coerced or assumed to be `NONE`.
