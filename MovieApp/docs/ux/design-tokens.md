# CineMind 2.0 Design Tokens & Style System

**Date**: 2026-08-22  
**Standard**: Precision Dark Cinema Theme (Obsidian & Cyan)

---

## 1. Color Palette

```
Canvas Background:  #06080d  (Base deep void)
Surface Container:  #0e121a  (Sidebar, header, cards)
Surface Hover:      #161b26  (Interactive card hover)
Surface Elevated:   #1a2130  (Modals, popups, dropdowns)
Border Subtle:      rgba(255, 255, 255, 0.08)
Border Focused:     #00f2fe

Text Primary:       #ffffff  (100% white, headers & titles)
Text Secondary:     #cbd5e1  (Slate 300, descriptions)
Text Muted:         #94a3b8  (Slate 400, timestamps, metadata)

Accent Primary:     #00f2fe  (Electric Cyan, Watch/Play CTAs)
Accent Rating:      #fbbf24  (Amber 400, Star ratings)
Accent Success:     #34d399  (Emerald 400, Match confirmation)
Accent Danger:      #f43f5e  (Rose 500, Favorite active, deletions)
```

---

## 2. Radii Hierarchy

- **Small / Controls**: `rounded-md` (6px) — Small badges, tags, chip indicators.
- **Medium / Buttons**: `rounded-lg` (8px) — Buttons, form inputs, select dropdowns.
- **Large / Cards**: `rounded-xl` (12px) — Media cards, list items, section panels.
- **Extra Large / Modals**: `rounded-2xl` (16px) — Modals, popups, hero banner containers.

*(Banned: `rounded-3xl` on regular cards/containers).*

---

## 3. Spacing Grid (8pt Scale)

- `2` (8px): Micro icon & text spacing.
- `3` (12px): Compact button padding, card details padding.
- `4` (16px): Media grid card spacing.
- `6` (24px): Layout column gaps and section bottom margins.
- `8` (32px): Main workspace padding on large screens.
