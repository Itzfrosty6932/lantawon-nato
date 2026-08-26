# Lantawon Lang — System Architectural Rules

All agent operations, code generations, refactoring, and feature developments in this repository MUST strictly abide by the following architectural rules:

1. **High-Context Memory & Plan Adherence**:
   - Always reference [HIGH_CONTEXT_MEMORY.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/docs/architecture/HIGH_CONTEXT_MEMORY.md) and [ARCHITECTURE_GRAPH.md](file:///Users/joshuawaymanarabejo/Documents/Projects/Websites/MovieApp/docs/architecture/ARCHITECTURE_GRAPH.md) before designing or writing subsystem features.
   - For domain-specific questions, consult the corresponding section file in `docs/plans/`.

2. **Concept Separation Invariant**:
   - `CONTENT CATALOG != WATCH AVAILABILITY != PLAYBACK ENTITLEMENT != USER OWNERSHIP`.
   - Never assume catalog presence guarantees playability or rights.

3. **Canonical Identity & External Decoupling**:
   - Never use `tmdb_id` or external API IDs as internal entity primary keys.
   - Use UUID `content.id`, and store external IDs in `content_external_ids`.

4. **Source Resolver Architecture**:
   - No hardcoded scrapers or mirror-based dependencies.
   - All playback goes through: `Entitlement -> Region -> Source Ranking -> Health Check -> Playback Adapter`.

5. **Search Query Object Contract**:
   - All search, filter, and discovery requests must conform to the canonical `SearchQueryObject` contract defined in Section 83 & `HIGH_CONTEXT_MEMORY.md`.

6. **Supabase Security & RLS**:
   - Service-role credentials MUST NEVER be exposed in client code.
   - All user-specific tables must enforce `auth.uid() = user_id` Row-Level Security policies.
   - Subscriptions and Entitlements must be verified server-side.
