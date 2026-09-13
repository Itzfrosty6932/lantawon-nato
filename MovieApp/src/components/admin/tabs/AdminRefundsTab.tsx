"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Undo2,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Search,
  AlertTriangle,
  Eye,
  Tv,
  Check,
  X,
  Film,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";

interface RefundRow {
  id: string;
  payment_submission_id: string;
  account_id: string;
  requested_by_user_id: string;
  reason: string;
  was_eligible_at_request: boolean;
  first_nontrailer_watched_at: string | null;
  status: "pending" | "approved" | "rejected" | "processed";
  decision_note: string | null;
  decided_at: string | null;
  created_at: string;
  amount?: number;
  reference_number?: string | null;
  requester_name?: string;
  // Computed Live Watch Telemetry
  total_watch_seconds?: number;
  nontrailer_videos_count?: number;
}

function formatFullDate(iso: string | undefined | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(secs: number): string {
  if (!secs || secs <= 0) return "0 mins";
  const hrs = Math.floor(secs / 3600);
  const mins = Math.floor((secs % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} mins`;
}

export function AdminRefundsTab() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "processed">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<RefundRow | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const loadRefunds = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("refund_requests")
        .select(`*, payment:payment_submissions(amount, reference_number)`)
        .eq("status", filter)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading refunds:", JSON.stringify(error));
        showToast(`Failed to load refunds: ${error.message}`, "error");
        setRefunds([]);
        setLoading(false);
        return;
      }

      const rows = (data || []) as unknown as Record<string, unknown>[];
      const userIds = [...new Set(rows.map((r) => String(r.requested_by_user_id)))];

      // Map names and watch telemetry
      const nameById = new Map<string, string>();
      const watchTimeById = new Map<string, number>();
      const nonTrailerCountById = new Map<string, number>();

      if (userIds.length > 0) {
        const [{ data: profiles }, { data: sessions }] = await Promise.all([
          supabase.from("profiles").select("id, username, display_name").in("id", userIds),
          supabase.from("watch_sessions").select("user_id, watch_duration_seconds, is_trailer").in("user_id", userIds),
        ]);

        for (const p of profiles || []) {
          nameById.set(p.id, p.display_name || p.username || p.id.slice(0, 8));
        }

        for (const s of sessions || []) {
          const uid = s.user_id;
          watchTimeById.set(uid, (watchTimeById.get(uid) || 0) + (s.watch_duration_seconds || 0));
          if (!s.is_trailer) {
            nonTrailerCountById.set(uid, (nonTrailerCountById.get(uid) || 0) + 1);
          }
        }
      }

      setRefunds(
        rows.map((r) => {
          const payment = r.payment as { amount?: number; reference_number?: string } | null;
          const uid = String(r.requested_by_user_id);
          return {
            ...(r as unknown as RefundRow),
            amount: payment?.amount,
            reference_number: payment?.reference_number,
            requester_name: nameById.get(uid) || uid.slice(0, 8),
            total_watch_seconds: watchTimeById.get(uid) || 0,
            nontrailer_videos_count: nonTrailerCountById.get(uid) || 0,
          };
        })
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to load refund requests.", "error");
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, showToast]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const decide = async (refund: RefundRow, decision: "approved" | "rejected") => {
    if (decision === "rejected" && decisionNote.trim().length < 3) {
      showToast("Please provide a note when rejecting a refund.", "error");
      return;
    }

    setProcessingId(refund.id);
    audioFX.playClick();

    try {
      const { error } = await supabase
        .from("refund_requests")
        .update({
          status: decision,
          decision_note: decisionNote.trim() || null,
          decided_at: new Date().toISOString(),
          decided_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        })
        .eq("id", refund.id)
        .eq("status", "pending");

      if (error) throw error;

      audioFX.playSuccess();
      showToast(
        decision === "approved"
          ? "Refund approved — process GCash payout."
          : "Refund rejected.",
        "success"
      );
      setReviewing(null);
      setDecisionNote("");
      loadRefunds();
    } catch (err: any) {
      showToast(err.message || "Failed to update refund", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = refunds.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (r.requester_name && r.requester_name.toLowerCase().includes(q)) ||
      (r.reference_number && r.reference_number.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header & Filters ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-[#E50914]" />
            <span>Refund Management &amp; Activity Audit</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit requester watch history &amp; non-trailer watch time to verify refund eligibility.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-900 border border-white/10 text-xs">
            {(["pending", "approved", "rejected", "processed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-full font-bold capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? "bg-white text-zinc-950 shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, reason..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 text-base sm:text-xs outline-none focus:border-[#E50914] transition-colors"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2 rounded-2xl bg-[#141518]/90 border border-white/10">
          <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
          <span className="text-xs font-semibold">Loading refund requests &amp; watch audits...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 text-xs rounded-2xl bg-[#141518]/90 border border-white/10">
          No refund requests in &quot;{filter}&quot; state.
        </div>
      ) : (
        <>
          {/* ── 📱 MOBILE CARD UI (Visible only on mobile/small screens) ── */}
          <div className="block md:hidden space-y-3">
            {filtered.map((r) => {
              const watchSecs = r.total_watch_seconds || 0;
              const nonTrailerCount = r.nontrailer_videos_count || 0;
              const isEligible = r.was_eligible_at_request && nonTrailerCount === 0;

              return (
                <div
                  key={r.id}
                  onClick={() => setReviewing(r)}
                  className="p-4 rounded-2xl bg-[#141518]/95 border border-white/10 space-y-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Top: Requester, Amount, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm">{r.requester_name}</div>
                      <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{formatFullDate(r.created_at)}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-white font-mono">₱{r.amount || "—"}</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                          r.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : r.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Watch Activity & Eligibility */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Watch Duration</div>
                      <div className="font-mono text-emerald-400 font-bold mt-0.5">
                        {formatDuration(watchSecs)} ({nonTrailerCount} videos)
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-semibold">Eligibility</div>
                      <div className="mt-0.5">
                        {isEligible ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold font-mono">
                            <Check className="h-3 w-3" /> Eligible
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-bold font-mono">
                            <AlertTriangle className="h-3 w-3" /> Ineligible
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reason snippet */}
                  <div className="pt-2 border-t border-white/5 text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    <span className="text-zinc-500 font-semibold">Reason:</span> {r.reason}
                  </div>

                  {/* Bottom: Full Width Auto-Layout Action Buttons */}
                  <div
                    className="pt-2 border-t border-white/5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {r.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => setReviewing(r)}
                        className="w-full py-2.5 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        <span>Decide Refund</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewing(r)}
                        className="w-full py-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Decision</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 💻 DESKTOP TABLE VIEW (Visible only on medium screens and up) ── */}
          <div className="hidden md:block rounded-2xl bg-[#141518]/90 border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 border-b border-white/10 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-4">Amount &amp; Ref</th>
                    <th className="py-3.5 px-4">Watch Time &amp; Activity</th>
                    <th className="py-3.5 px-4">Eligibility Audit</th>
                    <th className="py-3.5 px-4">Reason</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {filtered.map((r) => {
                    const watchSecs = r.total_watch_seconds || 0;
                    const nonTrailerCount = r.nontrailer_videos_count || 0;
                    const isEligible = r.was_eligible_at_request && nonTrailerCount === 0;

                    return (
                      <tr
                        key={r.id}
                        onClick={() => setReviewing(r)}
                        className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        {/* User */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white truncate">{r.requester_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{formatFullDate(r.created_at)}</div>
                        </td>

                        {/* Amount & Ref */}
                        <td className="py-3.5 px-4 font-mono">
                          <div className="font-bold text-white">₱{r.amount || "—"}</div>
                          <div className="text-[10px] text-zinc-400">{r.reference_number || "No Ref"}</div>
                        </td>

                        {/* Watch Activity Audit */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <Tv className="h-4 w-4 text-zinc-400 shrink-0" />
                            <div>
                              <div className="font-bold text-white">
                                {nonTrailerCount === 0 ? "0 videos watched" : `${nonTrailerCount} videos watched`}
                              </div>
                              <div className="text-[10px] text-zinc-400 font-mono">
                                Total time: {formatDuration(watchSecs)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Eligibility Snapshot */}
                        <td className="py-3.5 px-4">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                              <Check className="h-3 w-3" />
                              Eligible (0 Watched)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-mono font-bold">
                              <AlertTriangle className="h-3 w-3" />
                              Ineligible (Content Watched)
                            </span>
                          )}
                        </td>

                        {/* Reason */}
                        <td className="py-3.5 px-4 max-w-xs truncate text-zinc-300">
                          {r.reason}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {r.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => setReviewing(r)}
                              className="btn-yt-active px-3 py-1 text-[11px] font-bold"
                            >
                              Decide
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                r.status === "approved"
                                  ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                  : "bg-red-500/15 border border-red-500/30 text-red-400"
                              }`}
                            >
                              {r.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Review & Decide Modal ── */}
      {reviewing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#141518] border border-white/15 shadow-2xl p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Undo2 className="h-5 w-5 text-[#E50914]" />
                <h3 className="text-base font-bold text-white">Refund Decision &amp; Audit</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Requester & Watch Audit */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">User</div>
                <div className="font-bold text-white truncate">{reviewing.requester_name}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Amount</div>
                <div className="font-mono font-bold text-white text-sm">₱{reviewing.amount}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Videos Streamed</div>
                <div className="font-bold text-white">{reviewing.nontrailer_videos_count || 0} non-trailer videos</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Recorded Watch Time</div>
                <div className="font-mono font-bold text-emerald-400">{formatDuration(reviewing.total_watch_seconds || 0)}</div>
              </div>
            </div>

            {/* Reason */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-1">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Customer Reason</div>
              <p className="text-xs text-zinc-300 leading-relaxed">{reviewing.reason}</p>
            </div>

            {/* Decision note input */}
            <div className="space-y-1.5">
              <input
                type="text"
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Decision note for user (Required if rejecting)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-500 text-base sm:text-xs outline-none focus:border-[#E50914]"
              />
            </div>

            {/* Action buttons (Full Width Auto Layout) */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                disabled={processingId === reviewing.id}
                onClick={() => decide(reviewing, "approved")}
                className="w-full sm:flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Refund</span>
              </button>

              <button
                type="button"
                disabled={processingId === reviewing.id || !decisionNote.trim()}
                onClick={() => decide(reviewing, "rejected")}
                className="w-full sm:flex-1 py-2.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
