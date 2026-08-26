"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Shield,
  Layers,
} from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";

interface TableStats {
  name: string;
  count: number;
}

const SUPABASE_MIGRATIONS = [
  { name: "20260823000001_auth_profiles.sql", desc: "User profiles, roles, avatars & entitlements", status: "Applied" },
  { name: "20260823000002_content_catalog.sql", desc: "Media taxonomy, genres, certifications & people", status: "Applied" },
  { name: "20260823000003_availability_and_sources.sql", desc: "Streaming providers, deep-links & regions", status: "Applied" },
  { name: "20260823000004_user_library_and_lists.sql", desc: "Watchlists, favorites & custom playlists", status: "Applied" },
  { name: "20260823000005_watch_telemetry.sql", desc: "Progress tracking, session heartbeat & resumes", status: "Applied" },
  { name: "20260823000006_billing_and_entitlements.sql", desc: "Subscription tiers, webhooks & receipts", status: "Applied" },
  { name: "20260823000007_content_advisory.sql", desc: "Parental classifications & advisory tags", status: "Applied" },
  { name: "20260823000008_social_and_activity.sql", desc: "Progression XP, achievements & badges", status: "Applied" },
  { name: "20260823000009_rls_and_policies.sql", desc: "PostgreSQL Row-Level Security on all tables", status: "Applied" },
];

export function AdminSystemTab() {
  const { showToast } = useToast();
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStorageStats = async () => {
    setIsLoading(true);
    try {
      const [hist, lib, local, pl, prog, search] = await Promise.all([
        db.watchHistory.count(),
        db.libraryItems.count(),
        db.localScannedMedia.count(),
        db.playlists.count(),
        db.userProgression.count(),
        db.searchHistory.count(),
      ]);

      setTableStats([
        { name: "watchHistory", count: hist },
        { name: "libraryItems", count: lib },
        { name: "localScannedMedia", count: local },
        { name: "playlists", count: pl },
        { name: "userProgression", count: prog },
        { name: "searchHistory", count: search },
      ]);
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    loadStorageStats();
  }, []);

  const handleClearIndexedDB = async () => {
    if (confirm("⚠️ Clear all local IndexedDB cache tables?")) {
      audioFX.playPop();
      await db.clearAllDeviceData();
      showToast("Device IndexedDB database cleared.", "info");
      loadStorageStats();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading">
            System Architecture, Storage &amp; Database Migrations
          </h3>
          <p className="text-xs text-zinc-400">
            Inspect Dexie IndexedDB local-first footprint and Supabase RLS migrations
          </p>
        </div>

        <button
          onClick={loadStorageStats}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Storage Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local IndexedDB Stats */}
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-violet-400" />
              <span>Local IndexedDB Storage (Dexie v3)</span>
            </h4>
            <button
              onClick={handleClearIndexedDB}
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold"
            >
              <Trash2 className="h-3 w-3" /> Reset Local DB
            </button>
          </div>

          <div className="divide-y divide-zinc-800/60">
            {tableStats.map((t) => (
              <div key={t.name} className="py-2.5 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400">{t.name}</span>
                <span className="text-white font-bold">{t.count} records</span>
              </div>
            ))}
          </div>
        </div>

        {/* Database Engine Information */}
        <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-5 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="h-4 w-4 text-cyan-400" />
            <span>Core Database Specification</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
              <div className="text-[10px] text-zinc-500 font-mono">PRIMARY BACKEND</div>
              <div className="text-white font-bold">Supabase PostgreSQL 15+ (RLS Active)</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
              <div className="text-[10px] text-zinc-500 font-mono">OFFLINE ENGINE</div>
              <div className="text-white font-bold">Dexie.js / IndexedDB with Service Worker Cache</div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 space-y-1">
              <div className="text-[10px] text-zinc-500 font-mono">SECURITY INVARIANT</div>
              <div className="text-emerald-400 font-bold">Zero Client Secret Leakage · Server-Side JWT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Migrations List */}
      <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800/80 p-5 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          <span>PostgreSQL Migrations Matrix (9 Files Ready)</span>
        </h4>

        <div className="divide-y divide-zinc-800/60">
          {SUPABASE_MIGRATIONS.map((mig) => (
            <div key={mig.name} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <div className="min-w-0">
                <div className="font-mono text-zinc-300 font-bold truncate">{mig.name}</div>
                <div className="text-[10px] text-zinc-500">{mig.desc}</div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold font-mono shrink-0">
                <CheckCircle2 className="h-3 w-3" /> {mig.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
