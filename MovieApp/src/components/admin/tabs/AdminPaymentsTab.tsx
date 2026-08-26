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
  Filter,
  Eye,
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
  account_name?: string;
}

interface PaymentSubmission extends AdminPaymentRow {}

export function AdminPaymentsTab() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [proofUrls, setProofUrls] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal
  const [reviewingPayment, setReviewingPayment] = useState<PaymentSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    setLoading(true);

    // NOTE: submitted_by_user_id references auth.users, which PostgREST does
    // NOT expose — an embedded join on it fails the whole request. Resolve
    // submitter names through a second-pass profiles lookup instead.
    let query = supabase
      .from("payment_submissions")
      .select(`
        *,
        package:subscription_packages(name),
        account:accounts(name, owner_user_id)
      `)
      .order("submitted_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading payments:", JSON.stringify(error));
      showToast(`❌ Failed to load payments: ${error.message}`, "error");
      setPayments([]);
      setLoading(false);
      return;
    }

    const rows = ((data || []) as unknown as AdminPaymentRow[]);

    // Second pass: map user ids → profile names.
    const userIds = [...new Set(rows.map((p) => p.submitted_by_user_id))];
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

    const flattened = rows.map((p) => ({
      ...p,
      package_name:
        (p as unknown as { package?: { name?: string } }).package?.name || "Unknown",
      account_name:
        (p as unknown as { account?: { name?: string } }).account?.name || "Unknown",
      user_email:
        nameById.get(p.submitted_by_user_id) || p.submitted_by_user_id.slice(0, 8),
    }));
    setPayments(flattened);

      // H2: proofs are private — mint short-lived signed URLs for display.
      const urlMap: Record<string, string | null> = {};
      await Promise.all(
        flattened
          .filter((p) => p.proof_image_url)
          .slice(0, 50)
          .map(async (p) => {
            urlMap[p.id] = await resolveProofUrl(p.proof_image_url);
          })
      );
      setProofUrls(urlMap);

    setLoading(false);
  };

  // SECURITY (audit H1): approval mutates subscriptions + payments through
  // SECURITY DEFINER RPCs. The old flow wrote to `subscriptions` directly from
  // the client, which RLS now blocks — and which any authenticated user could
  // have replayed against the REST endpoint.
  const handleApprove = async (payment: PaymentSubmission) => {
    setProcessing(true);
    audioFX.playClick();

    try {
      const { data, error } = await supabase.rpc("admin_approve_payment", {
        p_payment_id: payment.id,
      });

      if (error) throw error;
      showToast(
        `✅ Payment approved! Subscription active until ${
          data?.period_end ? new Date(data.period_end).toLocaleDateString() : "the new period"
        }.`,
        "success"
      );
      setReviewingPayment(null);
      loadPayments();
    } catch (error: unknown) {
      console.error("Approval error:", error);
      showToast(`❌ ${(error as Error).message || "Failed to approve payment."}`, "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewingPayment || !rejectionReason.trim()) {
      showToast("⚠️ Please provide a rejection reason", "error");
      return;
    }

    setProcessing(true);
    audioFX.playClick();

    try {
      const { error } = await supabase.rpc("admin_reject_payment", {
        p_payment_id: reviewingPayment.id,
        p_reason: rejectionReason.trim(),
      });

      if (error) throw error;

      showToast("✅ Payment rejected", "success");
      setReviewingPayment(null);
      setRejectionReason("");
      loadPayments();
    } catch (error: unknown) {
      console.error("Rejection error:", error);
      showToast(`❌ ${(error as Error).message || "Failed to reject payment."}`, "error");
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.reference_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.package_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: payments.filter((p) => p.status === "pending").length,
    approved: payments.filter((p) => p.status === "approved").length,
    rejected: payments.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Payment Verification</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Review and approve payment submissions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-1">
            <Clock className="h-4 w-4" />
            Pending
          </div>
          <div className="text-2xl font-black text-white">{stats.pending}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-1">
            <CheckCircle2 className="h-4 w-4" />
            Approved
          </div>
          <div className="text-2xl font-black text-white">{stats.approved}</div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-2 text-red-400 text-sm font-bold mb-1">
            <XCircle className="h-4 w-4" />
            Rejected
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
            placeholder="Search by email, reference, or package..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:border-[#E50914] focus:outline-none"
          />
        </div>

        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => {
                audioFX.playClick();
                setFilter(f);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                filter === f
                  ? "bg-[#E50914] text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No payments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${
                        payment.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : payment.status === "rejected"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {payment.status.toUpperCase()}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {payment.user_email}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-500">Package: </span>
                      <span className="text-white font-bold">{payment.package_name}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Amount: </span>
                      <span className="text-white font-bold">
                        ₱{payment.amount.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Reference: </span>
                      <span className="text-white font-mono">
                        {payment.reference_number || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Date: </span>
                      <span className="text-white">
                        {new Date(payment.submitted_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {payment.rejection_reason && (
                    <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                      <span className="font-bold">Rejection Reason: </span>
                      {payment.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {payment.status === "pending" && (
                    <>
                      <button
                        onClick={() => setReviewingPayment(payment)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-sm font-bold transition-colors flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Review
                      </button>
                    </>
                  )}
                  {payment.proof_image_url && proofUrls[payment.id] && (
                    <a
                      href={proofUrls[payment.id] as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-sm font-bold transition-colors flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Proof
                    </a>
                  )}
                  {payment.proof_image_url && !proofUrls[payment.id] && (
                    <span className="text-xs text-zinc-500 font-mono px-2">Proof unavailable</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold">Review Payment Submission</h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-zinc-500 text-xs mb-1">User</div>
                <div className="text-white font-bold">{reviewingPayment.user_email}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Package</div>
                <div className="text-white font-bold">{reviewingPayment.package_name}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Amount</div>
                <div className="text-white font-bold">₱{reviewingPayment.amount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Reference</div>
                <div className="text-white font-mono">{reviewingPayment.reference_number}</div>
              </div>
              <div className="col-span-2">
                <div className="text-zinc-500 text-xs mb-1">Submitted</div>
                <div className="text-white">
                  {new Date(reviewingPayment.submitted_at).toLocaleString()}
                </div>
              </div>
            </div>

            {reviewingPayment.proof_image_url && (
              <div className="space-y-2">
                <div className="text-sm font-bold">Payment Proof</div>
                {proofUrls[reviewingPayment.id] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={proofUrls[reviewingPayment.id] as string}
                    alt="Payment proof"
                    className="w-full rounded-xl border border-zinc-800"
                  />
                ) : (
                  <p className="text-xs text-zinc-500 font-mono">
                    Loading proof… (or access denied)
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => handleApprove(reviewingPayment)}
                disabled={processing}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Approve & Activate Subscription
                  </>
                )}
              </button>

              <div className="space-y-2">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Rejection reason (required to reject)..."
                  className="w-full px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:border-red-500 focus:outline-none resize-none h-20"
                />
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      Reject Payment
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => {
                  setReviewingPayment(null);
                  setRejectionReason("");
                }}
                className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
