# Current UI Audit & Redesign Brief

**Date**: 2026-08-22  
**Purpose**: Systematically identify AI UI slop defects across the current application and define concrete normalization fixes.

---

## 1. Audit of Current UI Slop Defects

| Defect Area | Identified Symptom | Impact | Prescribed Anti-Slop Fix |
| :--- | :--- | :--- | :--- |
| **Excessive Radii** | `rounded-3xl` and `rounded-2xl` used on cards and small pills. | Makes the app look like a toy or mobile template; wastes screen space. | Lock radius scale: Buttons `rounded-lg` (8px), Cards `rounded-xl` (12px), Modals `rounded-2xl` (16px). |
| **Gratuitous Blur** | `backdrop-blur-xl bg-white/[0.04]` applied repeatedly on nested card elements. | Creates visual haze, rendering performance penalty, and low text readability. | Replace nested blurry cards with solid charcoal surfaces (`bg-zinc-900/90`, `bg-zinc-925`) with clean `border-white/[0.08]`. |
| **Low Contrast Text** | `text-zinc-400` and `text-zinc-500` used for essential metadata on dark backgrounds. | Poor readability; fails WCAG AA standards. | Upgrade primary text to `#ffffff`, secondary descriptions to `text-zinc-200` (`#e2e8f0`), and metadata to `text-zinc-400`. |
| **Weak CTA Visibility** | Primary play/watch buttons using low-contrast semi-transparent pills. | Users cannot instantly spot the main action on the page. | Mandate solid, high-visibility cyan `#00f2fe` buttons with dark black text and crisp contrast. |
| **Spacing Inconsistency** | Inconsistent margins (some pages `p-4`, others `p-10`, nested cards with `p-6`). | Visual dissonance and reduced information density. | Normalize to strict 8-point spatial system (`gap-4` for grids, `p-4` to `p-6` for page containers). |
| **Information Density** | Media cards too large on desktop, showing only 3–4 items per row. | Poor desktop ergonomics; requires excessive vertical scrolling. | Increase grid density to 5–6 columns on large screens (`grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`). |

---

## 2. Redesign Implementation Roadmap

1. **Step 1: Global CSS & Design Tokens**: Update `src/app/globals.css` and `tailwind.config.ts` with strict surface colors, normalized radii, and WCAG-compliant text contrast.
2. **Step 2: Media Card Normalization**: Refactor `MediaCard.tsx` with clean `rounded-xl`, high-density poster proportions, crisp rating badges, and solid primary hover actions.
3. **Step 3: App Shell & Header Normalization**: Refactor `Header.tsx` and `Sidebar.tsx` for clean contrast, tight navigation padding, and solid active indicators.
4. **Step 4: Player & Theater Normalization**: Refactor `watch/[id]/page.tsx` to streamline telemetry HUD, remove duplicate nested containers, and emphasize the video screen.
5. **Step 5: Visual Verification**: Inspect rendered output to verify zero layout shifts, high contrast, and crisp visual density.
