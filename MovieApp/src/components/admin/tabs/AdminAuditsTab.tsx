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
      query = query.or(`action.ilike.%${q}%,entity_type.ilike.%${q}%`);
    }

    const { data, error: err, count } = await query;

    if (err) {
      console.error("Error loading audit logs:", JSON.stringify(err));
      setError(err.message);
      setLogs([]);
    } else {
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
            p.display_name || p.username || p.id.slice(0, 8),
          ])
        );
        setLogs(
          rows.map((r) => ({ ...r, actor_name: nameById.get(r.actor_user_id!) }))
        );
      } else {
        setLogs(rows);
      }

      setTotal(count ?? 0);
    }

    setLoading(false);
  }, [page, searchQuery, supabase]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-[#E50914]" />
          <span>System Audit Logs</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Immutable system trail — payment approvals, password resets, account enable/disables, and security events.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setPage(0);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search action or entity..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 text-base sm:text-xs outline-none focus:border-[#E50914] transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-zinc-400">
          {total} events • page {page + 1}/{totalPages}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 rounded-2xl bg-[#141518]/90 border border-white/10">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : error ? (
        <div className="text-center py-12 rounded-2xl bg-red-500/10 border border-red-500/30 p-6">
          <Database className="h-10 w-10 mx-auto mb-2 text-red-400 opacity-60" />
          <p className="text-xs text-red-300 font-bold">Failed to load audit logs: {error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-[#141518]/90 border border-white/10 text-zinc-400 text-xs">
          <ScrollText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>No audit events found</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {logs.map((log) => (
            <details
              key={log.id}
              className="rounded-2xl bg-[#141518]/95 border border-white/10 hover:border-white/20 transition-colors group overflow-hidden"
            >
              <summary className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-4 cursor-pointer select-none">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-zinc-300 text-[10px] font-mono font-bold">
                    {log.action}
                  </span>
                  {log.entity_type && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {log.entity_type}
                    </span>
                  )}
                </div>
                <span className="text-xs text-white font-bold truncate flex-1">
                  Actor: {log.actor_name || (log.actor_user_id ? log.actor_user_id.slice(0, 8) : "system")}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </summary>

              <div className="px-4 pb-4 pt-1 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs border-t border-white/5">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                    Before
                  </div>
                  <pre className="p-3 rounded-xl bg-black border border-white/10 overflow-x-auto text-[10px] text-rose-300 whitespace-pre-wrap break-all">
                    {log.old_data ? JSON.stringify(log.old_data, null, 2) : "—"}
                  </pre>
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                    After
                  </div>
                  <pre className="p-3 rounded-xl bg-black border border-white/10 overflow-x-auto text-[10px] text-emerald-300 whitespace-pre-wrap break-all">
                    {log.new_data ? JSON.stringify(log.new_data, null, 2) : "—"}
                  </pre>
                </div>
                {log.entity_id && (
                  <div className="md:col-span-2 text-[10px] font-mono text-zinc-500">
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
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-xs font-mono text-zinc-400">
                {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
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
