---
name: ui-design-core
description: Anti-AI-slop design system for cinematic, high-density, production-grade Next.js web applications.
license: MIT
---

# UI Design Core (Anti-AI-Slop Standards)

## 1. Anti-AI-Slop Rules
- **NO Gratuitous Glassmorphism**: Do not put `backdrop-blur-xl bg-white/[0.05] border border-white/10` on every single nested card. Use solid, clean background tones (`#090c15`, `#111622`) with crisp, low-opacity borders (`border-white/[0.06]`).
- **NO Balloon Radii**: Never use `rounded-3xl` or `rounded-full` on standard rectangular media cards or containers. 
  - Standard Buttons / Inputs: `rounded-lg` (8px).
  - Media Cards / Panels: `rounded-xl` (12px).
  - Modals / Drawers: `rounded-2xl` (16px).
- **NO Low-Contrast Washed-Out Buttons**: Primary action buttons must be solid, high-visibility (`bg-cyan-400 text-zinc-950 hover:bg-cyan-300 font-bold`). Never make the primary play button a translucent blurry gray rectangle.
- **NO Empty Space Waste**: Keep information density high. Eliminate giant 80px paddings between related card rows. Enforce 16px–24px gaps for grids.

## 2. Visual Hierarchy & Weight
1. **Primary Focus**: The movie/series content itself (Backdrops, Post-art, Episode Stills).
2. **Secondary Support**: Clear, readable metadata (Year, Runtime, Rating ★, Season/Episode) in high-contrast slate text (`text-zinc-300` and `text-amber-400`).
3. **Tertiary Actions**: Bookmark, Favorite, Trailer, Subtitles with clean subtle hover states.
