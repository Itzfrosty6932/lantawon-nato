---
name: ui-a11y-audit
description: Accessibility, focus state, tap target, and contrast auditing for dark-mode web applications.
license: MIT
---

# UI Accessibility & Audit Standards

## 1. Contrast Compliance (WCAG AA/AAA)
- Normal body text against dark canvas (`#cbd5e1` on `#06080d`) must exceed **7.0:1** contrast ratio.
- Primary CTA buttons (`#00f2fe` background with `#09090b` dark text) must achieve $\ge 12:1$ contrast ratio.
- Never use dark gray text on a dark gray card (e.g. `text-zinc-600` on `#111622` is prohibited).

## 2. Interactive Focus States
- All focusable elements (links, buttons, inputs, selects) must implement visible focus rings:
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950`

## 3. Accessible Tap Targets & ARIA
- Minimum touch target size: $40\times 40\text{px}$ for interactive icons.
- All icon-only buttons must provide explicit `title` and `aria-label` attributes.
