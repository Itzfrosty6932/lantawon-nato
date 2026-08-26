---
name: ui-token-normalizer
description: Design token definitions and spacing/color scales for Next.js & Tailwind CSS.
license: MIT
---

# UI Token Normalizer

## 1. Spatial Scale (8-Point Grid)
- `gap-2` (8px): Micro elements (badge icons, chip tags).
- `gap-3` (12px): List rows and compact controls.
- `gap-4` (16px): Media grid card spacing.
- `gap-6` (24px): Major layout sections and two-column layouts.
- `p-3` (12px): Card internal padding.
- `p-5` (20px): Section container padding.
- `p-6` / `p-8` (24px/32px): Main page padding.

## 2. Color Tokens (Obsidian Dark)
- `--bg-canvas`: `#06080d` (Deepest Void)
- `--bg-surface`: `#0d111a` (Sidebar, Header, Main Panels)
- `--bg-card`: `#131824` (Media cards, list items)
- `--bg-card-hover`: `#1c2333`
- `--border-subtle`: `rgba(255, 255, 255, 0.07)`
- `--border-focus`: `#00f2fe`
- `--text-primary`: `#ffffff` (Headings, titles)
- `--text-secondary`: `#cbd5e1` (Subtitles, body descriptions)
- `--text-muted`: `#94a3b8` (Timestamps, metadata, labels)
- `--accent-cyan`: `#00f2fe` (Primary CTA, Watch, Play)
- `--accent-amber`: `#fbbf24` (Star ratings)
- `--accent-emerald`: `#34d399` (High confidence, downloads ready)
- `--accent-rose`: `#f43f5e` (Favorites, warnings)

## 3. Typography Scale
- Page Title: `font-heading text-2xl md:text-3xl font-extrabold tracking-tight`
- Section Heading: `font-heading text-lg font-bold tracking-tight text-white`
- Card Title: `text-sm font-bold text-white line-clamp-1`
- Card Metadata: `text-xs text-zinc-400`
- Badge / Token: `text-[10px] font-bold uppercase tracking-wider`
