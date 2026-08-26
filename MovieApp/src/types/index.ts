/**
 * LANTAWON LANG — MASTER TYPES ENTRY POINT
 * 
 * Consolidated re-exports for canonical domain models, search contracts,
 * storage records, resolver identities, and legacy compatibility types.
 */

// ─── Canonical Domain Models (Master Invariant) ──────────────────────────────
export * from "./canonical";

// ─── Unified Search & Filter Contracts ───────────────────────────────────────
export * from "./search-contract";

// ─── Entitlement & Source-Agnostic Playback ──────────────────────────────────
export * from "./entitlement";

// ─── Storage & Database Records (Dexie / Supabase Repositories) ──────────────
export * from "./storage";

// ─── Local Resolver & Media Identity ─────────────────────────────────────────
export * from "./resolver";

// ─── Content Advisory & Classification ───────────────────────────────────────
export * from "./content-guide";

// ─── Player Telemetry & Diagnostics ──────────────────────────────────────────
export * from "./stream";

// ─── Legacy Media Compatibility Types ────────────────────────────────────────
export * from "./media";
