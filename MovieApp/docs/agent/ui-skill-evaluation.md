
# UI/UX Tooling & Agent Skills Evaluation

**Date**: 2026-08-22
**Purpose**: Rigorous evaluation of candidate GitHub agent-skill repositories for eliminating AI UI slop, establishing coherent design tokens, and ensuring accessible dark-mode contrast.

---

## 1. Repository Evaluation Matrix

| Repository                                       | Relevant Skill         | License    | Next.js / Tailwind Compatibility | Anti-AI-Slop & Design System                                         | Dark Mode Contrast & A11y                             | Resource Cost (RAM/CPU/Context)                | Overlap                        | Decision                                 |
| :----------------------------------------------- | :--------------------- | :--------- | :------------------------------- | :------------------------------------------------------------------- | :---------------------------------------------------- | :--------------------------------------------- | :----------------------------- | :--------------------------------------- |
| **1. `aladicf/better-web-ui`**           | High-Context UI Design | MIT        | Native (Tailwind v3/v4 + React)  | **High**: Eliminates generic templates, enforces visual weight | **High**: Emphasizes WCAG contrast & hierarchy  | Zero runtime, lightweight prompt tokens        | Minimal                        | **APPROVED (Core Design)**         |
| **2. `dawitlabs/ui-skills`**             | UI Tokens & Normalizer | MIT        | Native (React + Tailwind)        | **High**: Strict spacing scales, radius hierarchy              | **High**: Explicit contrast ratios, focus rings | Zero runtime, lightweight markdown             | Complements`aladicf`         | **APPROVED (Token Normalizer)**    |
| **3. `hicay/claude-code-skills`**        | General Claude Skills  | Apache 2.0 | Mixed (Polyglot)                 | Medium: Broad general workflows                                      | Medium: Generic linting                               | High context overhead (large monolithic suite) | High overlap with core IDE     | **REJECTED (Too bloated)**         |
| **4. `PracticalSwan/agent-skills`**      | Component Architecture | MIT        | React / TypeScript               | Medium: Component modularity                                         | Low: Functional focus rather than aesthetic           | Low                                            | Partial overlap                | **REJECTED (Superceded by 1 & 2)** |
| **5. `tech-leads-club/agent-skills`**    | Codebase Governance    | MIT        | Polyglot                         | Low: Engineering management focus                                    | Low: Non-UI specific                                  | Medium                                         | Irrelevant to UI aesthetics    | **REJECTED (Non-UI)**              |
| **6. `Junaid-PK/frontend-design-skill`** | Frontend Styling       | MIT        | React / Next.js                  | Medium: Component styling patterns                                   | Medium: Basic Tailwind classes                        | Low                                            | Overlaps with`better-web-ui` | **REJECTED (Redundant)**           |

---

## 2. Selected Composable Skill Set

Rather than installing overlapping monolithic suites, we adopt the smallest, highest-impact composable toolset:

1. **`ui-design-core`** (Adapted from `aladicf/better-web-ui`):
   - Enforces content-first hierarchy.
   - Eliminates AI slop (bans excessive nested cards, gratuitous blur filters, and inflated 32px radii).
   - Mandates solid, high-visibility interactive primary actions.
2. **`ui-token-normalizer`** (Adapted from `dawitlabs/ui-skills`):
   - Strict 8-point spatial system (`p-3`, `p-4`, `p-6`, `gap-3`, `gap-4`, `gap-6`).
   - Rigid radius tiers: Controls `rounded-lg` (8px), Cards `rounded-xl` (12px), Modals `rounded-2xl` (16px).
   - High-contrast obsidian dark palette (`#06080d`, `#0f131c`, `#181e2b`, text `#f8fafc`).
3. **`ui-a11y-audit`**:
   - Contrast validation ($\ge 4.5:1$ for body text, $\ge 3.0:1$ for UI widgets).
   - Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-cyan-400`).

---

## 3. Installation & Verification

- **Installation Location**: Project-local `.skills/` directory ([`.skills/ui-design-core/SKILL.md`](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/.skills/ui-design-core/SKILL.md), [`.skills/ui-token-normalizer/SKILL.md`](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/.skills/ui-token-normalizer/SKILL.md), [`.skills/ui-a11y-audit/SKILL.md`](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/.skills/ui-a11y-audit/SKILL.md)).
- **Verification**: Zero runtime dependencies, 100% compatible with Next.js App Router and Tailwind CSS.
