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
}

/**
 * CANONICAL REFUND RULE: a payment is refundable only until the account
 * watches its FIRST non-trailer video. `was_eligible_at_request` is a
 * snapshot taken at request time (via request_refund RPC) — decisions are
 * made against the snapshot so post-request viewing never rewrites history.
 */
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

    // NOTE: requested_by_user_id references auth.users, which PostgREST does
    // not expose — resolve display names through profiles in a second pass.
    const { data, error } = await supabase
      .from("refund_requests")
      .select(`*, payment:payment_submissions(amount, reference_number)`)
      .eq("status", filter)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading refunds:", JSON.stringify(error));
      showToast(`❌ Failed to load refund requests: ${error.message}`, "error");
      setRefunds([]);
      setLoading(false);
      return;
    }

    const rows = (data || []) as unknown as Record<string, unknown>[];
    const userIds = [...new Set(rows.map((r) => String(r.requested_by_user_id)))];

    const nameById = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", userIds);
      for (const p of profiles || []) {
        nameById.set(p.id, p.username || p.display_name || p.id.slice(0, 8));
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
        };
      })
    );
    setLoading(false);
  }, [supabase, filter, showToast]);

  useEffect(() => {
    loadRefunds();
  }, [loadRefunds]);

  const decide = async (refund: RefundRow, decision: "approved" | "rejected") => {
    if (decision === "rejected" && decisionNote.trim().length < 3) {
      showToast("⚠️ Provide a short note when rejecting a refund.", "error");
      return;
    }

    setProcessingId(refund.id);
    audioFX.playClick();

    try {
      // RLS: only admins pass the manage policy. No SECURITY DEFINER needed —
      // the snapshot columns are already frozen at request time.
      const { error } = await supabase
        .from("refund_requests")
        .update({
          status: decision,
          decision_note: decisionNote.trim() || null,
          decided_at: new Date().toISOString(),
          decided_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        })
        .eq("id", refund.id)
        .eq("status", "pending"); // optimistic concurrency: never re-decide

      if (error) throw error;

      showToast(
        decision === "approved"
          ? "✅ Refund approved — process the payout offline."
          : "✅ Refund rejected.",
        "success"
      );
      setReviewing(null);
      setDecisionNote("");
      loadRefunds();
    } catch (err: unknown) {
      console.error(err);
      showToast(`❌ ${(err as Error).message || "Failed to update refund."}`, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const markProcessed = async (refund: RefundRow) => {
    setProcessingId(refund.id);
    try {
      const { error } = await supabase
        .from("refund_requests")
        .update({ status: "processed" })
        .eq("id", refund.id)
        .eq("status", "approved");
      if (error) throw error;
      showToast("✅ Refund marked as processed.", "success");
      loadRefunds();
    } catch (err: unknown) {
      showToast(`❌ ${(err as Error).message}`, "error");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = refunds.filter(
    (r) =>
      r.requester_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: refunds.filter((r) => r.status === "pending").length,
    approved: refunds.filter((r) => r.status === "approved").length,
    rejected: refunds.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-white">Refund Requests</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Refundable until the account watches its first non-trailer video.
          Trailers never affect eligibility.
        </p>
      </div>

      {/* Rule banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
        <AlertTriangle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200 leading-relaxed">
          Eligibility is snapshotted at request time (
          <span className="font-mono">was_eligible_at_request</span>). Decide against that
          snapshot — watching content after the request does not change it. Approve here,
          then complete the GCash/Maya payout outside the system and mark it processed.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-1">
            <Clock className="h-4 w-4" /> Pending
          </div>
          <div className="text-2xl font-black text-white">{stats.pending}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-1">
            <CheckCircle2 className="h-4 w-4" /> Approved
          </div>
          <div className="text-2xl font-black text-white">{stats.approved}</div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400 text-sm font-bold mb-1">
            <XCircle className="h-4 w-4" /> Rejected
          </div>
          <div className="text-2xl font-black text-white">{stats.rejected}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, reason, or reference..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:border-[#E50914] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "processed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                audioFX.playClick();
                setFilter(f);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors ${
                filter === f
                  ? "bg-[#E50914] text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <Undo2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No refund requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((refund) => (
            <div
              key={refund.id}
              className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        refund.status === "approved" || refund.status === "processed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : refund.status === "rejected"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {refund.status.toUpperCase()}
                    </span>
                    <span className="text-sm font-bold text-white">{refund.requester_name}</span>
                    {typeof refund.amount === "number" && (
                      <span className="text-sm font-mono font-bold text-white">
                        ₱{refund.amount.toFixed(2)}
                      </span>
                    )}
                    {refund.was_eligible_at_request ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                        ELIGIBLE AT REQUEST
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[10px] font-mono font-bold border border-red-500/30">
                        ALREADY WATCHED
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-2">{refund.reason}</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500">Reference: </span>
                      <span className="text-white font-mono">{refund.reference_number || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Requested: </span>
                      <span className="text-white">
                        {new Date(refund.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {refund.first_nontrailer_watched_at && (
                      <div>
                        <span className="text-zinc-500">First watch: </span>
                        <span className="text-white">
                          {new Date(refund.first_nontrailer_watched_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {refund.decision_note && (
                    <div className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg p-2">
                      <span className="font-bold text-zinc-300">Decision note: </span>
                      {refund.decision_note}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      audioFX.playClick();
                      setReviewing(refund);
                      setDecisionNote(refund.decision_note || "");
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-sm font-bold transition-colors flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" /> Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold">Review Refund Request</h3>

            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">User</span>
                <span className="text-white font-bold">{reviewing.requester_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount</span>
                <span className="text-white font-bold">
                  {typeof reviewing.amount === "number" ? `₱${reviewing.amount.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Eligible at request?</span>
                <span
                  className={`font-bold ${
                    reviewing.was_eligible_at_request ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {reviewing.was_eligible_at_request ? "YES" : "NO"}
                </span>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <div className="text-zinc-500 text-xs mb-1">Reason</div>
                <p className="text-white text-xs whitespace-pre-wrap">{reviewing.reason}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-300">
                Decision note {`(required for rejection)`}
              </label>
              <textarea
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Visible to the user in their subscription history..."
                className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:border-[#E50914] focus:outline-none resize-none h-20"
              />
            </div>

            {reviewing.status === "pending" ? (
              <>
                <button
                  onClick={() => decide(reviewing, "approved")}
                  disabled={processingId === reviewing.id}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {processingId === reviewing.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" /> Approve Refund
                    </>
                  )}
                </button>
                <button
                  onClick={() => decide(reviewing, "rejected")}
                  disabled={processingId === reviewing.id}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <XCircle className="h-5 w-5" /> Reject Refund
                </button>
              </>
            ) : (
              reviewing.status === "approved" && (
                <button
                  onClick={() => markProcessed(reviewing)}
                  disabled={processingId === reviewing.id}
                  className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="h-5 w-5" /> Mark as Processed (Payout Sent)
                </button>
              )
            )}

            <button
              onClick={() => {
                setReviewing(null);
                setDecisionNote("");
              }}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
