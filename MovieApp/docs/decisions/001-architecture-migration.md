# Architectural Decision Record (ADR) 001: Next.js Clean Architecture Migration

**Status**: APPROVED  
**Date**: 2026-08-22  
**Deciders**: Principal Architect & Senior Engineering Team  

---

## 1. Context & Problem Statement
The existing application transitioned from a legacy static single-file website to a custom Node.js MVC architecture. While functional for basic prototypes, it lacks type safety, modern React component lifecycles, route-based code splitting, and structured local-first data abstractions.

---

## 2. Decision
Migrate the codebase to a modern **Next.js Full-Stack Modular Monolith** with:
1. **Frontend**: Next.js App Router, React 19, TypeScript, and Tailwind CSS.
2. **Local Data Layer**: Dexie.js (IndexedDB) + Native File System Access API.
3. **Application Layer**: Typed domain services under `src/features/` and Route Handlers under `src/app/api/`.
4. **Media Engine**: Clean provider abstraction supporting local files, official trailers, and authorized streams.

---

## 3. Migration Roadmap & Execution Strategy

```
STAGE 1: Setup Next.js + React + TypeScript + Tailwind configuration
STAGE 2: Port & Type-Check Domain Logic (Taxonomy, NLP, TMDB, Graphs, Downloads)
STAGE 3: Implement Global App Shell (Header, Sidebar, Main Panel, Responsive Layout)
STAGE 4: Migrate Features Sequentially (Catalog, Details, Library, Player, AI)
STAGE 5: Automated Test Verification & Browser Interactive Validation
```

---

## 4. Consequences & Benefits
- **Positive**: Complete type safety across all layers, instant page transitions without full browser reloads, robust local-first offline support, clean maintainable code.
- **Risks & Mitigations**:
  - *Risk*: Data loss during transition.
  - *Mitigation*: Existing localStorage keys (`cinemind_downloads`, `cinemind_watchlist`, `cinemind_history`) will have automated schema migration adapters in Dexie/IndexedDB.
