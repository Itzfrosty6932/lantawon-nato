"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  Search,
  Eye,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Sparkles,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";
import { resolveProofUrl } from "@/lib/services/payment-proof";

interface AdminPaymentRow {
  id: string;
  account_id: string;
  package_id: string;
  submitted_by_user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  reference_number: string | null;
  proof_image_url: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  // Joined data
  user_email?: string;
  package_name?: string;
  package_price_php?: number;
  package_promo_percent?: number | null;
  package_promo_label?: string | null;
  demanded_price?: number;
  account_name?: string;
}

interface PaymentSubmission extends AdminPaymentRow {}

interface GlobalPaymentStats {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
  totalRevenue: number;
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

export function AdminPaymentsTab() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [proofUrls, setProofUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [globalStats, setGlobalStats] = useState<GlobalPaymentStats>({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0,
  });

  // Review modal
  const [reviewingPayment, setReviewingPayment] = useState<PaymentSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    setLoading(true);

    try {
      // 1. Fetch authoritative global stats counts
      const [
        { count: pendingCount },
        { count: approvedCount },
        { count: rejectedCount },
        { data: approvedAmounts },
      ] = await Promise.all([
        supabase.from("payment_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("payment_submissions").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("payment_submissions").select("*", { count: "exact", head: true }).eq("status", "rejected"),
        supabase.from("payment_submissions").select("amount").eq("status", "approved"),
      ]);

      const totalRev = (approvedAmounts || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      setGlobalStats({
        pending: pendingCount || 0,
        approved: approvedCount || 0,
        rejected: rejectedCount || 0,
        all: (pendingCount || 0) + (approvedCount || 0) + (rejectedCount || 0),
        totalRevenue: totalRev,
      });

      // 2. Fetch list based on active filter
      let query = supabase
        .from("payment_submissions")
        .select(`
          *,
          package:subscription_packages(name, price_php, promo_percent, promo_label),
          account:accounts(name, owner_user_id)
        `)
        .order("submitted_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error loading payments:", JSON.stringify(error));
        showToast(`Failed to load payments: ${error.message}`, "error");
        setPayments([]);
        setLoading(false);
        return;
      }

      const rows = (data || []) as unknown as Record<string, any>[];

      // Second pass: map user ids → profile names
      const userIds = [...new Set(rows.map((p) => p.submitted_by_user_id))];
      const nameById = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, display_name")
          .in("id", userIds);
        for (const p of profiles || []) {
          nameById.set(p.id, p.display_name || p.username || p.id.slice(0, 8));
        }
      }

      const flattened: PaymentSubmission[] = rows.map((p) => {
        const pkg = p.package;
        const basePrice = pkg?.price_php || 99;
        const promoPct = pkg?.promo_percent || null;
        const demanded = promoPct ? Math.round(basePrice * (1 - promoPct / 100)) : basePrice;

        return {
          ...p,
          package_name: pkg?.name || "Solo VIP Pass",
          package_price_php: basePrice,
          package_promo_percent: promoPct,
          package_promo_label: pkg?.promo_label || null,
          demanded_price: demanded,
          account_name: p.account?.name || "Account",
          user_email: nameById.get(p.submitted_by_user_id) || p.submitted_by_user_id.slice(0, 8),
        } as PaymentSubmission;
      });

      setPayments(flattened);

      // Pre-sign proof URLs for private bucket
      const proofsToSign = flattened.filter((p) => p.proof_image_url);
      const urlMap: Record<string, string | null> = {};
      await Promise.all(
        proofsToSign.map(async (p) => {
          if (p.proof_image_url) {
            urlMap[p.id] = await resolveProofUrl(p.proof_image_url);
          }
        })
      );
      setProofUrls(urlMap);
    } catch (err) {
      console.error("Error:", err);
      showToast("Failed to load payment submissions.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    setProcessing(true);
    audioFX.playClick();

    try {
      const { error } = await supabase.rpc("approve_payment_submission", {
        p_submission_id: paymentId,
      });

      if (error) {
        throw error;
      }

      audioFX.playSuccess();
      showToast("Payment approved & subscription activated!", "success");
      setReviewingPayment(null);
      loadPayments();
    } catch (err: any) {
      showToast(err.message || "Failed to approve payment", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (paymentId: string) => {
    if (!rejectionReason.trim()) {
      showToast("Please provide a reason for rejection.", "error");
      return;
    }

    setProcessing(true);
    audioFX.playClick();

    try {
      const { error } = await supabase.rpc("reject_payment_submission", {
        p_submission_id: paymentId,
        p_reason: rejectionReason.trim(),
      });

      if (error) {
        throw error;
      }

      audioFX.playPop();
      showToast("Payment submission rejected.", "info");
      setReviewingPayment(null);
      setRejectionReason("");
      loadPayments();
    } catch (err: any) {
      showToast(err.message || "Failed to reject payment", "error");
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.user_email && p.user_email.toLowerCase().includes(q)) ||
      (p.reference_number && p.reference_number.toLowerCase().includes(q)) ||
      (p.package_name && p.package_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global Revenue Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#141518]/90 border border-white/10 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase font-semibold">Total Revenue</div>
          <div className="text-xl sm:text-2xl font-black text-white font-mono">
            ₱{globalStats.totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-400 font-semibold">{globalStats.approved} approved orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141518]/90 border border-amber-500/20 space-y-1">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Pending Review</div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
            {globalStats.pending}
          </div>
          <div className="text-[10px] text-zinc-400">Needs admin approval</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141518]/90 border border-white/10 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase font-semibold">Approved</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            {globalStats.approved}
          </div>
          <div className="text-[10px] text-zinc-400">Active VIP accesses</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#141518]/90 border border-white/10 space-y-1">
          <div className="text-[10px] text-zinc-500 uppercase font-semibold">Rejected</div>
          <div className="text-xl sm:text-2xl font-black text-red-400 font-mono">
            {globalStats.rejected}
          </div>
          <div className="text-[10px] text-zinc-400">Invalid proofs/refs</div>
        </div>
      </div>

      {/* ── Action Bar with Filter Pills & Search ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-900 border border-white/10 text-xs">
          {[
            { id: "pending" as const, label: `Pending (${globalStats.pending})` },
            { id: "approved" as const, label: `Approved (${globalStats.approved})` },
            { id: "rejected" as const, label: `Rejected (${globalStats.rejected})` },
            { id: "all" as const, label: `All (${globalStats.all})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer ${
                filter === tab.id
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input (16px base font on mobile to prevent iOS auto zoom) */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ref #, email..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-zinc-900 border border-white/10 text-white placeholder:text-zinc-500 text-base sm:text-xs outline-none focus:border-[#E50914] transition-colors"
          />
        </div>
      </div>

      {/* ── Payments List (Desktop Table + Mobile Cards UI) ── */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2 rounded-2xl bg-[#141518]/90 border border-white/10">
          <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
          <span className="text-xs font-semibold">Loading payment audit logs...</span>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 text-xs rounded-2xl bg-[#141518]/90 border border-white/10">
          No payment submissions found for &quot;{filter}&quot;.
        </div>
      ) : (
        <>
          {/* ── 📱 MOBILE CARD UI (Visible only on mobile/small screens) ── */}
          <div className="block md:hidden space-y-3">
            {filteredPayments.map((p) => {
              const proofSigned = proofUrls[p.id] || p.proof_image_url;
              const demanded = p.demanded_price || 99;
              const actual = Number(p.amount) || 0;
              const isMatch = actual === demanded;
              const isUnderpaid = actual < demanded;

              return (
                <div
                  key={p.id}
                  onClick={() => setReviewingPayment(p)}
                  className="p-4 rounded-2xl bg-[#141518]/95 border border-white/10 space-y-3 shadow-lg active:scale-[0.99] transition-transform cursor-pointer"
                >
                  {/* Top: User, Amount, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-white text-sm truncate">{p.user_email}</div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{p.package_name}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-black text-white font-mono">₱{actual}</div>
                      <span
                        className={`inline-flex items-center px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase ${
                          p.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : p.status === "rejected"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Price Audit Match Badge */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div>
                      {isMatch ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                          <Check className="h-3 w-3" />
                          Match (₱{actual}/₱{demanded})
                        </span>
                      ) : isUnderpaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                          <AlertTriangle className="h-3 w-3" />
                          Underpaid (₱{actual} &lt; ₱{demanded})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold">
                          <Info className="h-3 w-3" />
                          Overpaid (₱{actual} &gt; ₱{demanded})
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Ref: <span className="text-zinc-200 font-bold">{p.reference_number || "—"}</span>
                    </div>
                  </div>

                  {/* Bottom: Full Width Auto-Layout Action Buttons */}
                  <div
                    className="flex items-center gap-2 pt-2 border-t border-white/5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {p.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => setReviewingPayment(p)}
                        className="flex-1 py-2 rounded-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Review &amp; Approve</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewingPayment(p)}
                        className="flex-1 py-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View Details</span>
                      </button>
                    )}

                    {proofSigned && (
                      <a
                        href={proofSigned}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 text-xs font-semibold flex items-center justify-center gap-1 shrink-0"
                      >
                        <span>Proof</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
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
                    <th className="py-3.5 px-4">User / Account</th>
                    <th className="py-3.5 px-4">Plan &amp; Demanded Price</th>
                    <th className="py-3.5 px-4">Actual Paid Amount</th>
                    <th className="py-3.5 px-4">Price Audit Match</th>
                    <th className="py-3.5 px-4">Reference &amp; Date</th>
                    <th className="py-3.5 px-4">Proof</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {filteredPayments.map((p) => {
                    const proofSigned = proofUrls[p.id] || p.proof_image_url;
                    const demanded = p.demanded_price || 99;
                    const actual = Number(p.amount) || 0;
                    const isMatch = actual === demanded;
                    const isUnderpaid = actual < demanded;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => setReviewingPayment(p)}
                        className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                      >
                        {/* User */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white truncate">{p.user_email}</div>
                          <div className="text-[10px] text-zinc-500 font-mono truncate">{p.account_name}</div>
                        </td>

                        {/* Plan & Demanded Price */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-200">{p.package_name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            Expected: <span className="text-white font-bold">₱{demanded}</span>
                            {p.package_promo_percent && (
                              <span className="ml-1 text-[10px] text-emerald-400">({p.package_promo_percent}% OFF)</span>
                            )}
                          </div>
                        </td>

                        {/* Actual Paid Amount */}
                        <td className="py-3.5 px-4">
                          <div className="text-sm font-black text-white font-mono">
                            ₱{actual} <span className="text-[10px] text-zinc-500 font-normal">{p.currency}</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 uppercase font-mono">{p.payment_method || "GCash"}</div>
                        </td>

                        {/* Demanded vs Paid Audit Match */}
                        <td className="py-3.5 px-4">
                          {isMatch ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                              <Check className="h-3 w-3" />
                              Match (₱{actual}/₱{demanded})
                            </span>
                          ) : isUnderpaid ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold">
                              <AlertTriangle className="h-3 w-3" />
                              Underpaid (₱{actual} &lt; ₱{demanded})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono font-bold">
                              <Info className="h-3 w-3" />
                              Overpaid (₱{actual} &gt; ₱{demanded})
                            </span>
                          )}
                        </td>

                        {/* Reference & Date */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-zinc-300 font-bold">{p.reference_number || "No Ref #"}</div>
                          <div className="text-[10px] text-zinc-500 font-mono">{formatFullDate(p.submitted_at)}</div>
                        </td>

                        {/* Proof */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          {proofSigned ? (
                            <a
                              href={proofSigned}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-zinc-300 hover:text-white inline-flex items-center gap-1 text-[11px]"
                              title="View GCash Screenshot"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Proof</span>
                            </a>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">None</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {p.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => setReviewingPayment(p)}
                              className="btn-yt-active px-3 py-1 text-[11px] font-bold"
                            >
                              Review
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                p.status === "approved"
                                ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                                : "bg-red-500/15 border border-red-500/30 text-red-400"
                              }`}
                            >
                              {p.status}
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

      {/* ── Review Payment Modal (Clean Dialog) ── */}
      {reviewingPayment && (
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
                <CreditCard className="h-5 w-5 text-[#E50914]" />
                <h3 className="text-base font-bold text-white">Review Payment Submission</h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewingPayment(null)}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Audit Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">User</div>
                <div className="font-bold text-white truncate">{reviewingPayment.user_email}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Reference #</div>
                <div className="font-mono font-bold text-zinc-300">{reviewingPayment.reference_number || "—"}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Demanded Price</div>
                <div className="font-mono font-bold text-white text-sm">₱{reviewingPayment.demanded_price}</div>
              </div>
              <div className="p-3 rounded-xl bg-black/50 border border-white/5 space-y-1">
                <div className="text-[10px] text-zinc-500 uppercase font-semibold">Actual Amount Paid</div>
                <div className="font-mono font-bold text-emerald-400 text-sm">₱{reviewingPayment.amount}</div>
              </div>
            </div>

            {/* Proof Preview */}
            {proofUrls[reviewingPayment.id] && (
              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Payment Screenshot Proof</div>
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black max-h-52 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofUrls[reviewingPayment.id]!}
                    alt="Payment Proof"
                    className="max-h-52 w-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* Rejection reason input */}
            <div className="space-y-2">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (e.g. Reference number not found in GCash)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white placeholder:text-zinc-500 text-base sm:text-xs outline-none focus:border-[#E50914]"
              />
            </div>

            {/* Action Buttons (Full Width Auto Layout) */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <button
                type="button"
                disabled={processing}
                onClick={() => handleApprove(reviewingPayment.id)}
                className="w-full sm:flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve &amp; Activate Plan</span>
              </button>

              <button
                type="button"
                disabled={processing || !rejectionReason.trim()}
                onClick={() => handleReject(reviewingPayment.id)}
                className="w-full sm:flex-1 py-2.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
              >
                <XCircle className="h-4 w-4" />
                <span>Reject Submission</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
