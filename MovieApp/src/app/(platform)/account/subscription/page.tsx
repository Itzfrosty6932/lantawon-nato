"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Crown,
  ArrowRight,
  CheckCircle2,
  Clock,
  Upload,
  X,
  Loader2,
  AlertCircle,
  CreditCard,
  Package,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import {
  subscriptionService,
  type SubscriptionPackage,
  type Subscription,
  type PaymentSubmission,
} from "@/lib/services/subscription-service";
import { createClient } from "@/lib/supabase/client";
import { uploadPaymentProof } from "@/lib/services/payment-proof";
import { requestRefund, getRefundEligibility } from "@/lib/services/refund-service";
import { Undo2, ShieldAlert } from "lucide-react";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [currentPackage, setCurrentPackage] = useState<SubscriptionPackage | null>(null);
  const [pendingPackage, setPendingPackage] = useState<SubscriptionPackage | null>(null);
  const [availablePackages, setAvailablePackages] = useState<SubscriptionPackage[]>([]);
  const [paymentSubmissions, setPaymentSubmissions] = useState<PaymentSubmission[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Payment submission modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<SubscriptionPackage | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [submittingPayment, setSubmittingPayment] = useState(false);
  // AUDIT H2: storage path persisted to DB (NOT the local preview data URL).
  const proofPathRef = useRef<string>("");

  // Refund request UI state — canonical rule enforced server-side by the
  // request_refund RPC; UI only surfaces eligibility + the free-text reason.
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTarget, setRefundTarget] = useState<PaymentSubmission | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundEligibility, setRefundEligibility] = useState<{
    eligible: boolean;
    firstNontrailerWatchedAt: string | null;
  } | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  // Map: payment_submission_id → refund status ("pending"/"approved"/…)
  const [refundStatusByPayment, setRefundStatusByPayment] = useState<Record<string, string>>({});

  // User-side payment management (cancel pending / toggle renewal)
  const [cancelingPaymentId, setCancelingPaymentId] = useState<string | null>(null);
  const [togglingRenewal, setTogglingRenewal] = useState(false);

  const handleCancelPendingPayment = async (payment: PaymentSubmission) => {
    if (!window.confirm(
      `Kanselahin ang ₱${payment.amount.toFixed(2)} payment (${payment.reference_number})? Hindi na ito maibabalik — kung nagbayad ka na, mag-submit ng panibagong payment request.`
    )) {
      return;
    }
    audioFX.playClick();
    setCancelingPaymentId(payment.id);
    try {
      const res = await subscriptionService.cancelOwnPendingPayment(payment.id);
      if (res.success) {
        showToast("✅ Payment request canceled.", "success");
        loadSubscriptionData();
      } else {
        showToast(`❌ ${res.error ?? "Failed to cancel payment."}`, "error");
      }
    } finally {
      setCancelingPaymentId(null);
    }
  };

  const handleToggleRenewal = async () => {
    if (!subscription || subscription.status !== "active") return;
    const next = !subscription.cancel_at_period_end;
    audioFX.playClick();
    setTogglingRenewal(true);
    try {
      const res = await subscriptionService.setCancelAtPeriodEnd(next);
      if (res.success) {
        showToast(
          next
            ? "Auto-renewal paused. Manonood ka pa hanggang matapos ang current period mo."
            : "Auto-renewal resumed.",
          "info"
        );
        loadSubscriptionData();
      } else {
        showToast(`❌ ${res.error ?? "Failed to update renewal setting."}`, "error");
      }
    } finally {
      setTogglingRenewal(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    setLoading(true);

    // Get or Create account
    let account = await subscriptionService.getUserAccount(user.id);

    if (!account) {
      // Create account for user
      const result = await subscriptionService.createAccount(
        user.id,
        `${user.email}'s Account`
      );
      if (result.success && result.accountId) {
        account = await subscriptionService.getUserAccount(user.id);
      }
    }

    if (account) {
      setAccountId(account.id);

      // Load subscription data
      const { subscription: sub, currentPackage: current, pendingPackage: pending } =
        await subscriptionService.getSubscriptionWithPackage(account.id);

      setSubscription(sub);
      setCurrentPackage(current);
      setPendingPackage(pending);

      // Load payment submissions
      const payments = await subscriptionService.getUserPaymentSubmissions(user.id);
      setPaymentSubmissions(payments);

      // Load existing refund requests for this user so approved payments
      // that already have a pending/decided refund can render their state
      // instead of a duplicate request button. RLS scopes rows to the user.
      const { data: refunds } = await supabase
        .from("refund_requests")
        .select("payment_submission_id, status")
        .eq("requested_by_user_id", user.id);
      const map: Record<string, string> = {};
      for (const r of (refunds ?? []) as Array<{ payment_submission_id: string; status: string }>) {
        map[r.payment_submission_id] = r.status;
      }
      setRefundStatusByPayment(map);
    }

    // Load available packages
    const packages = await subscriptionService.getActivePackages();
    setAvailablePackages(packages);

    setLoading(false);
  };

  const handleSelectPackage = (pkg: SubscriptionPackage) => {
    audioFX.playClick();
    setSelectedPackage(pkg);
    setShowPaymentModal(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    audioFX.playClick();
    setProofFileName(file.name);
    setUploadingProof(true);

    try {
      // AUDIT H2: proofs go to the PRIVATE payment-proofs bucket under the
      // user's own folder. We keep a local data-URL purely as an instant
      // preview; the value persisted to the database is the storage path,
      // which admins view through short-lived signed URLs.
      const result = await uploadPaymentProof(file, user.id);
      if (result.error) {
        showToast(`⚠️ ${result.error}`, "error");
        setUploadingProof(false);
        return;
      }

      // Local preview only — never submitted to the DB.
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      if (result.path) {
        proofPathRef.current = result.path;
      }
      showToast("✅ Screenshot attached successfully", "success");
    } catch (error) {
      console.warn("Proof upload failed:", error);
      showToast("⚠️ Could not upload screenshot. Try again.", "error");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!selectedPackage || !accountId || !referenceNumber || !proofPathRef.current) {
      showToast("⚠️ Please fill all fields and upload proof", "error");
      return;
    }

    setSubmittingPayment(true);

    try {
      const result = await subscriptionService.submitPayment({
        accountId,
        packageId: selectedPackage.id,
        amount: selectedPackage.price_php,
        referenceNumber,
        proofImageUrl: proofPathRef.current, // storage path — resolved via signed URLs
      });

      if (result.success) {
        showToast("✅ Payment submitted! Waiting for verification.", "success");
        setShowPaymentModal(false);
        setReferenceNumber("");
        setProofImageUrl("");
        setProofFileName("");
        proofPathRef.current = "";
        setSelectedPackage(null);
        loadSubscriptionData();
      } else {
        showToast(`❌ ${result.error}`, "error");
      }
    } catch (error) {
      showToast("❌ Failed to submit payment", "error");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openRefundModal = async (payment: PaymentSubmission) => {
    if (!accountId) return;
    audioFX.playClick();
    setRefundTarget(payment);
    setRefundReason("");
    setRefundEligibility(null);
    setShowRefundModal(true);
    setCheckingEligibility(true);
    // Ask the server whether the account has already watched a non-trailer.
    // Rendering the outcome is UX only — the RPC re-validates on submit.
    const result = await getRefundEligibility(accountId);
    setRefundEligibility(result);
    setCheckingEligibility(false);
  };

  const handleRequestRefund = async () => {
    if (!refundTarget) return;
    if (refundReason.trim().length < 10) {
      showToast("⚠️ Please describe your reason (at least 10 characters).", "error");
      return;
    }
    setSubmittingRefund(true);
    try {
      const res = await requestRefund(refundTarget.id, refundReason);
      if (res.success) {
        showToast("✅ Refund request submitted. We'll notify you once reviewed.", "success");
        setShowRefundModal(false);
        setRefundTarget(null);
        setRefundReason("");
        setRefundEligibility(null);
        loadSubscriptionData();
      } else {
        showToast(`❌ ${res.error ?? "Failed to submit refund request."}`, "error");
      }
    } finally {
      setSubmittingRefund(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black font-heading">Subscription</h1>
        <p className="text-sm text-zinc-400">
          Manage your Lantawon Nato membership and billing
        </p>
      </div>

      {/* Pending-review / expired gating banners (Bug 2 fix + user CRUD) */}
      {(() => {
        const pendingPayments = paymentSubmissions.filter(
          (p) => p.status === "pending"
        );
        const hasPendingPayment =
          subscription?.status === "pending_payment" || pendingPayments.length > 0;
        const isExpired =
          !hasPendingPayment &&
          ((subscription &&
            new Date(subscription.current_period_end).getTime() < Date.now()) ||
            subscription?.status === "expired");

        if (hasPendingPayment && pendingPayments.length > 0) {
          return (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/40 p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <div className="text-sm font-bold text-amber-300">
                    ⏳ Payment Under Review
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {pendingPayments.length === 1
                      ? "Your payment"
                      : `${pendingPayments.length} payments`}{" "}
                    {pendingPayments.length === 1 ? "was" : "were"} received and an admin will verify{" "}
                    {pendingPayments.length === 1 ? "it" : "them"} soon. You can log in and browse
                    freely — <span className="font-bold text-white">watching stays locked</span>{" "}
                    until approval. We&apos;ll contact you via your Gmail once it&apos;s done.
                  </p>
                </div>
              </div>
              {/* User-side CRUD: withdraw a pending payment while it awaits review */}
              <div className="flex flex-wrap gap-2 pl-8">
                {pendingPayments.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleCancelPendingPayment(p)}
                    disabled={cancelingPaymentId === p.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                    title="Withdraw this payment request"
                  >
                    {cancelingPaymentId === p.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Cancel ₱{p.amount.toFixed(0)} payment ({p.reference_number})
                  </button>
                ))}
              </div>
            </div>
          );
        }

        if (isExpired) {
          return (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/40 p-5 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-red-300">
                  Subscription Expired — Streaming Locked
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Pick a package below and submit your payment to get back in.
                  Watching unlocks again once the admin approves your renewal.
                </p>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Current Subscription */}
      {currentPackage ? (
        <div className="rounded-2xl bg-gradient-to-br from-[#E31937]/10 to-zinc-950 border border-[#E31937]/30 p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-[#E31937]" />
                <h2 className="text-xl font-bold">Current Package</h2>
              </div>
              <p className="text-sm text-zinc-400">Your active subscription</p>
            </div>
            <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
              {subscription?.status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 font-mono uppercase">Package</div>
              <div className="text-2xl font-bold text-white">{currentPackage.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 font-mono uppercase">Price</div>
              <div className="text-2xl font-bold text-white">
                ₱{currentPackage.price_php.toFixed(0)}
                <span className="text-sm text-zinc-400">/mo</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-500 font-mono uppercase">Sessions</div>
              <div className="text-2xl font-bold text-white">
                {currentPackage.max_concurrent_sessions}
              </div>
            </div>
          </div>

          {subscription && (
            <div className="pt-4 border-t border-zinc-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500">Period Start: </span>
                <span className="text-white">
                  {new Date(subscription.current_period_start).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Period End: </span>
                <span className="text-white">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          {/* Renewal management — user can pause/resume auto-renewal on their active sub */}
          {subscription && subscription.status === "active" && (
            <div
              className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                subscription.cancel_at_period_end
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-emerald-500/20 bg-emerald-500/5"
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <div
                  className={`flex items-center gap-2 text-sm font-bold ${
                    subscription.cancel_at_period_end ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {subscription.cancel_at_period_end ? (
                    <>
                      <Clock className="h-4 w-4 shrink-0" />
                      Auto-renewal paused
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 shrink-0" />
                      Auto-renewal on
                    </>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {subscription.cancel_at_period_end
                    ? `Hindi mag-re-new ang plan mo — access hanggang ${new Date(
                        subscription.current_period_end
                      ).toLocaleDateString()} lang.`
                    : "Automatic na magre-renew pagkatapos ng current period mo."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleRenewal}
                disabled={togglingRenewal}
                className={`shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  subscription.cancel_at_period_end
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200"
                }`}
              >
                {togglingRenewal ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                {subscription.cancel_at_period_end ? "Resume Renewal" : "Cancel Renewal"}
              </button>
            </div>
          )}

          {pendingPackage && (
            <div className="pt-4 border-t border-amber-500/20 bg-amber-500/5 -mx-6 -mb-6 px-6 py-4 rounded-b-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                <Clock className="h-4 w-4" />
                Pending Package Change
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Switching to <span className="text-white font-bold">{pendingPackage.name}</span> on{" "}
                {subscription?.package_change_at &&
                  new Date(subscription.package_change_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
            <Package className="h-8 w-8 text-zinc-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold">No Active Subscription</h3>
            <p className="text-sm text-zinc-400">Choose a package to get started</p>
          </div>
        </div>
      )}

      {/* Available Packages */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Available Membership</h2>
        <div className="grid grid-cols-1 max-w-md mx-auto gap-4">
          {availablePackages.map((pkg) => {
            const isCurrent = currentPackage?.code === pkg.code;
            const isPending = pendingPackage?.code === pkg.code;

            return (
              <div
                key={pkg.id}
                className={`rounded-xl p-6 border ${
                  isCurrent
                    ? "bg-[#E50914]/10 border-[#E50914]/50"
                    : "bg-zinc-950 border-zinc-800"
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold">{pkg.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {pkg.max_concurrent_sessions} concurrent{" "}
                      {pkg.max_concurrent_sessions === 1 ? "session" : "sessions"}
                    </p>
                  </div>

                  <div className="text-3xl font-black">
                    ₱{pkg.price_php.toFixed(0)}
                    <span className="text-sm text-zinc-400">/mo</span>
                  </div>

                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-zinc-900 text-zinc-500 text-sm font-bold border border-zinc-800"
                    >
                      Current Package
                    </button>
                  ) : isPending ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-amber-500/20 text-amber-400 text-sm font-bold border border-amber-500/30"
                    >
                      Pending
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPackage(pkg)}
                      className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-sm font-bold transition-colors"
                    >
                      {currentPackage ? "Switch to" : "Select"} {pkg.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Submissions */}
      {paymentSubmissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Payment History</h2>
          <div className="space-y-3">
            {paymentSubmissions.map((payment) => {
              const refundStatus = refundStatusByPayment[payment.id];
              return (
                <div
                  key={payment.id}
                  className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 flex items-center justify-between gap-3 flex-wrap"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-bold">₱{payment.amount.toFixed(2)}</div>
                    <div className="text-xs text-zinc-400">
                      {new Date(payment.submitted_at).toLocaleDateString()} •{" "}
                      {payment.reference_number}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {refundStatus && (
                      <span
                        className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase border ${
                          refundStatus === "approved" || refundStatus === "processed"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : refundStatus === "rejected"
                            ? "bg-red-500/15 text-red-400 border-red-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                        title="Refund request status"
                      >
                        Refund: {refundStatus}
                      </span>
                    )}
                    {payment.status === "approved" && !refundStatus && (
                      <button
                        onClick={() => openRefundModal(payment)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-200 hover:text-white transition-colors"
                      >
                        <Undo2 className="h-3.5 w-3.5" /> Request Refund
                      </button>
                    )}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        payment.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : payment.status === "rejected"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {payment.status.toUpperCase()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Submit Payment</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setReferenceNumber("");
                  setProofImageUrl("");
                  setProofFileName("");
                  proofPathRef.current = "";
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="text-sm font-bold mb-2">Package: {selectedPackage.name}</div>
                <div className="text-2xl font-black text-[#E50914]">
                  ₱{selectedPackage.price_php.toFixed(2)}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2">
                <div className="text-sm font-bold text-blue-400">GCash Payment Instructions</div>
                <div className="text-xs text-zinc-300 space-y-1">
                  <p>1. Send ₱{selectedPackage.price_php.toFixed(2)} to GCash number: <span className="font-bold">0917-123-4567</span></p>
                  <p>2. Save the reference number</p>
                  <p>3. Take a screenshot of the payment confirmation</p>
                  <p>4. Upload below and submit</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Reference Number</label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Enter GCash reference number"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Payment Proof Screenshot</span>
                  {proofImageUrl && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3" /> ATTACHED
                    </span>
                  )}
                </label>

                {!proofImageUrl ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-zinc-900/90 border-2 border-dashed border-zinc-700 hover:border-[#E50914] cursor-pointer transition-all group"
                    >
                      {uploadingProof ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
                          <span>Uploading receipt...</span>
                        </div>
                      ) : (
                        <>
                          <div className="h-10 w-10 rounded-xl bg-zinc-800 group-hover:bg-[#E50914]/20 flex items-center justify-center text-zinc-400 group-hover:text-[#E50914] transition-colors">
                            <Upload className="h-5 w-5" />
                          </div>
                          <div className="text-center space-y-0.5">
                            <span className="text-xs font-bold block text-zinc-200 group-hover:text-white">
                              Click to upload payment screenshot
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-medium">
                              Supports JPG, PNG, WEBP (Max 10MB)
                            </span>
                          </div>
                        </>
                      )}
                    </label>
                  </div>
                ) : (
                  <div className="relative rounded-2xl bg-zinc-900 border border-emerald-500/40 p-3 flex items-center gap-3 shadow-lg animate-in fade-in zoom-in-95">
                    {/* Thumbnail Preview */}
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-black border border-zinc-700 shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofImageUrl}
                        alt="Payment Receipt Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">
                          {proofFileName || "Receipt_Screenshot.png"}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                        <span className="text-emerald-400 font-bold">Ready to submit</span>
                      </div>
                    </div>

                    {/* Action Buttons: Replace & Remove */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label
                        htmlFor="proof-upload-replace"
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-200 hover:text-white cursor-pointer transition-colors border border-zinc-700 flex items-center gap-1"
                        title="Change image"
                      >
                        <RefreshCw className="h-3 w-3 text-zinc-400" />
                        <span>Replace</span>
                        <input
                          id="proof-upload-replace"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          audioFX.playPop();
                          setProofImageUrl("");
                          setProofFileName("");
                          proofPathRef.current = "";
                          showToast("Screenshot removed", "info");
                        }}
                        className="h-7 w-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove screenshot"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleSubmitPayment}
                disabled={submittingPayment || !referenceNumber || !proofImageUrl}
                className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2"
              >
                {submittingPayment ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    Submit for Verification
                  </>
                )}
              </button>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-300">
                  Your payment will be verified by our team within 24 hours. You'll be notified once approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Undo2 className="h-5 w-5 text-[#E50914]" /> Request Refund
              </h3>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundTarget(null);
                  setRefundReason("");
                  setRefundEligibility(null);
                }}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
              <div className="text-2xl font-black text-white">
                ₱{refundTarget.amount.toFixed(2)}
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                Ref: {refundTarget.reference_number}
              </div>
            </div>

            {/* Canonical rule notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <ShieldAlert className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-200 leading-relaxed">
                Refundable ka lang hangga&apos;t hindi mo pa napapanood ang unang{" "}
                <span className="font-bold">non-trailer</span> na video. Ang mga
                trailer ay hindi kasama — hindi nito naaapektuhan ang eligibility mo.
              </p>
            </div>

            {checkingEligibility ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
                Checking eligibility...
              </div>
            ) : refundEligibility && !refundEligibility.eligible ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
                <div className="text-sm font-bold text-red-400">Not eligible</div>
                <p className="text-xs text-red-200 leading-relaxed">
                  May napanood ka nang non-trailer na video
                  {refundEligibility.firstNontrailerWatchedAt
                    ? ` noong ${new Date(refundEligibility.firstNontrailerWatchedAt).toLocaleDateString("en-PH")}`
                    : ""}
                  , kaya hindi na refundable ang bayad na ito. Kung may problema ka,
                  mag-submit na lang ng support ticket.
                </p>
                <Link
                  href="/account/support"
                  className="inline-block pt-1 text-xs font-bold text-white underline hover:text-[#E50914]"
                >
                  Go to Support →
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    Bakit mo gustong i-refund? (min. 10 characters)
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Ikwento mo kung ano ang nangyari..."
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:border-[#E50914] focus:outline-none resize-none h-24"
                  />
                  <div className="text-[10px] font-mono text-zinc-500 text-right">
                    {refundReason.trim().length}/10
                  </div>
                </div>

                <button
                  onClick={handleRequestRefund}
                  disabled={submittingRefund || refundReason.trim().length < 10}
                  className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submittingRefund ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Undo2 className="h-5 w-5" />
                  )}
                  Submit Refund Request
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
