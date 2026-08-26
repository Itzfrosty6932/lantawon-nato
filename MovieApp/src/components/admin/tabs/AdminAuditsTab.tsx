"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  ScrollText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  actor_name?: string;
}

const PAGE_SIZE = 50;

/**
 * AUDITS — read-only viewer over audit_logs. Rows are written exclusively
 * inside SECURITY DEFINER functions / server routes (migration 14 removed
 * public INSERT), so everything here is system-generated history.
 */
export function AdminAuditsTab() {
  const supabase = createClient();

  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      // Search across action/entity fields via case-insensitive match
      query = query.or(`action.ilike.%${q}%,entity_type.ilike.%${q}%`);
    }

    const { data, error: err, count } = await query;

    if (err) {
      console.error("Error loading audit logs:", JSON.stringify(err));
      setError(err.message);
      setLogs([]);
    } else {
      setLogs((data || []) as unknown as AuditLogRow[]);

      // Second pass: resolve actor display names
      const rows = (data || []) as unknown as AuditLogRow[];
      const userIds = [
        ...new Set(rows.map((r) => r.actor_user_id).filter(Boolean) as string[]),
      ];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", userIds);
        const nameById = new Map(
          (profiles || []).map((p) => [
            p.id,
            p.username || p.display_name || p.id.slice(0, 8),
          ])
        );
        setLogs(
          rows.map((r) => ({ ...r, actor_name: nameById.get(r.actor_user_id!) }))
        );
      }

      setTotal(count ?? 0);
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white">Audits</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Immutable system history — payment decisions, admin actions, security events.
          Written server-side only; nobody can forge entries from the browser.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setPage(0);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search by action or entity type..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:border-[#E50914] focus:outline-none"
          />
        </div>
        <div className="text-xs font-mono text-zinc-500">
          {total} event{total === 1 ? "" : "s"} • page {page + 1}/{totalPages}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-xl bg-red-500/5 border border-red-500/30">
          <Database className="h-12 w-12 mx-auto mb-3 text-red-400 opacity-50" />
          <p className="text-sm text-red-300 font-bold">Failed to load audit logs</p>
          <p className="text-xs text-red-400/70 mt-1 font-mono">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No audit events found</p>
          <p className="text-xs text-zinc-500 mt-1">
            Events appear here as admins approve payments and perform actions.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <details
              key={log.id}
              className="rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors group"
            >
              <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
                <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-[11px] font-mono font-bold shrink-0">
                  {log.action}
                </span>
                {log.entity_type && (
                  <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">
                    {log.entity_type}
                  </span>
                )}
                <span className="text-xs text-white font-semibold truncate flex-1 min-w-0">
                  {log.actor_name ||
                    (log.actor_user_id ? log.actor_user_id.slice(0, 8) : "system")}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </summary>

              <div className="px-4 pb-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    Before
                  </div>
                  <pre className="p-2.5 rounded-lg bg-black border border-zinc-800 overflow-x-auto text-[11px] text-rose-300 whitespace-pre-wrap break-all">
                    {log.old_data ? JSON.stringify(log.old_data, null, 2) : "—"}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
                    After
                  </div>
                  <pre className="p-2.5 rounded-lg bg-black border border-zinc-800 overflow-x-auto text-[11px] text-emerald-300 whitespace-pre-wrap break-all">
                    {log.new_data ? JSON.stringify(log.new_data, null, 2) : "—"}
                  </pre>
                </div>
                {log.entity_id && (
                  <div className="md:col-span-2 text-[11px] font-mono text-zinc-500">
                    entity_id: {log.entity_id}
                  </div>
                )}
              </div>
            </details>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 text-white text-sm font-bold transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-xs font-mono text-zinc-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 disabled:opacity-40 text-white text-sm font-bold transition-colors flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
