# Local Media Matching & Resolution Pipeline

**Date**: 2026-08-22  
**Philosophy**: Deterministic Multi-Signal Scoring over Naive First-Result Guessing

---

## 1. Resolution Pipeline Overview

```
LOCAL VIDEO FILE
       │
       ▼
[1. FINGERPRINT GENERATOR]
       │ (fp_{size}_{name})
       ├─── Check Confirmed Cache ───► [INSTANT ATTACH (0ms)]
       ▼ (If New / Unconfirmed)
[2. TOKEN NORMALIZER & SANITIZER]
       │ • Strip Codecs (x264, x265, HEVC, AAC, DTS, FLUX)
       │ • Strip Release Groups (SubsPlease, Judas, YIFY, RARBG)
       │ • Extract Release Year (1890–2026)
       │ • Extract Season / Episode (S01E05, 1x05, Episode 05, - 06)
       │ • Detect Special / OVA / Edition (Director's Cut, Remux)
       ▼
[3. CANDIDATE SEARCH (TMDB API)]
       │ • Target Endpoint: search/movie OR search/tv based on tokens
       │ • Fetch Top 5 Ranked Candidates
       ▼
[4. MULTI-SIGNAL SCORING ENGINE]
       │ • Title Similarity (Dice Bigram + Token Overlap): 40%
       │ • Year Match / Distance: 15%
       │ • Media Type Alignment: 15%
       │ • Season/Episode Verification: 15%
       │ • Popularity & Vote Weighting: 10%
       ▼
[5. CONFIDENCE CLASSIFICATION]
       ├─── >= 95%: High Confidence (Auto Match)
       ├─── 85% - 94%: Review Needed (Auto Match with Review Flag)
       ├─── 60% - 84%: Ambiguous (Prompt User Candidate Selection)
       └─── < 60%: Unknown (Fallback to Manual TMDB Search)
       ▼
[6. LOCAL IDENTITY PERSISTENCE]
       │ (IndexedDB: localScannedMedia + FileHandle Cache)
       ▼
[7. ZERO-REMATCH ON SUBSEQUENT SCANS]
```

---

## 2. Weighted Scoring Formula

$$\text{MatchScore} = S_{\text{title}} (40\%) + S_{\text{year}} (15\%) + S_{\text{type}} (15\%) + S_{\text{se}} (15\%) + S_{\text{pop}} (10\%)$$

| Signal | Maximum Points | Calculation Method |
| :--- | :---: | :--- |
| **Title Similarity** | 40 pts | Dice's coefficient on bigrams evaluated against both English and original titles. |
| **Year Match** | 15 pts | Exact year = 15 pts; $\pm 1$ year = 12 pts; neutral/no year = 7.5 pts; $> 3$ yrs = 0 pts. |
| **Media Type Match** | 15 pts | Strict alignment between TV episode tokens and candidate format. |
| **Season / Episode** | 15 pts | Validates episode existence within series metadata. |
| **Popularity Bonus** | 10 pts | Prevents obscure micro-shorts from outranking canonical blockbusters with identical names. |
