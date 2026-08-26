"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ChevronLeft,
  Copy,
  Check,
  Sparkles,
  Smartphone,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import {
  subscriptionService,
  type SubscriptionPackage,
} from "@/lib/services/subscription-service";
import { uploadPaymentProof } from "@/lib/services/payment-proof";

export const dynamic = "force-dynamic";

export default function CheckoutPaymentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
          <Loader2 className="h-8 w-8 text-[#E50914] animate-spin" />
        </div>
      }
    >
      <CheckoutForm />
    </React.Suspense>
  );
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageCode = searchParams.get("package") || "solo";
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<SubscriptionPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "maya">("gcash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofImageUrl, setProofImageUrl] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // AUDIT H2: storage path persisted to DB (NOT the local preview data URL).
  const proofPathRef = React.useRef<string>("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const list = await subscriptionService.getActivePackages();
      setPackages(list);

      const target = list.find((p) => p.code === packageCode) || list[1] || list[0];
      setSelectedPkg(target || null);
      setLoading(false);
    };
    fetchPackages();
  }, [packageCode]);

  const copyToClipboard = (text: string, field: string) => {
    audioFX.playClick();
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    showToast(`Copied ${field} to clipboard!`, "success");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    audioFX.playClick();
    setUploadingProof(true);

    try {
      // AUDIT H2: upload to the PRIVATE payment-proofs bucket under the
      // user's folder. Only the storage path is persisted; admins view the
      // image through short-lived signed URLs.
      const result = await uploadPaymentProof(file, user.id);
      if (result.error || !result.path) {
        showToast(`⚠️ ${result.error || "Upload failed. Try again."}`, "error");
        return;
      }

      proofPathRef.current = result.path;

      // Local preview only — never submitted to the DB.
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImageUrl(reader.result as string);
        showToast("Proof of payment uploaded!", "success");
      };
      reader.readAsDataURL(file);
    } catch {
      showToast("Could not upload proof. Try again.", "error");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;

    if (!user) {
      audioFX.playClick();
      router.push(`/login?redirect=/checkout?package=${selectedPkg.code}`);
      return;
    }

    if (!referenceNumber.trim()) {
      showToast("Pakilagay ang GCash/Maya Reference Number.", "error");
      return;
    }

    if (!proofPathRef.current) {
      showToast("Paki-upload ang screenshot ng resibo.", "error");
      return;
    }

    setSubmitting(true);
    audioFX.playClick();

    try {
      let account = await subscriptionService.getUserAccount(user.id);
      if (!account) {
        const createRes = await subscriptionService.createAccount(
          user.id,
          `${user.email}'s Account`
        );
        if (createRes.success && createRes.accountId) {
          account = await subscriptionService.getUserAccount(user.id);
        }
      }

      if (account) {
        await subscriptionService.submitPayment({
          accountId: account.id,
          packageId: selectedPkg.id,
          amount: selectedPkg.price_php,
          referenceNumber: referenceNumber.trim(),
          proofImageUrl: proofPathRef.current, // storage path — resolved via signed URLs
        });
      }

      audioFX.playSuccess();
      setIsSuccess(true);
      showToast(
        "Payment submitted for review — watching unlocks once an admin approves it. Track it in Account → Subscription.",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to submit payment.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#E50914] animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full rounded-3xl bg-zinc-950 border border-zinc-800 p-8 text-center space-y-6 shadow-2xl">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-heading text-white">
              Naisumite na ang Bayad!
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Salamat! Naitala na ang iyong reference number{" "}
              <span className="font-mono text-white font-bold">{referenceNumber}</span>.
              Awtomatikong magiging active ang iyong subscription sa oras na ma-verify ito ng admin.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Package:</span>
              <span className="font-bold text-white">{selectedPkg?.name} Plan</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Halaga:</span>
              <span className="font-bold text-emerald-400 font-mono">
                ₱{selectedPkg?.price_php.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Method:</span>
              <span className="font-bold text-white uppercase">{paymentMethod}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href="/account/subscription"
              className="w-full py-3.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E50914]/30"
            >
              <span>Pumunta sa Subscription Hub</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/home"
              className="block text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Bumalik sa Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 text-white">
      {/* Back to Pricing */}
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        <span>Bumalik sa Pricing Options</span>
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E50914]/15 border border-[#E50914]/30 text-[#E50914] text-xs font-mono font-bold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>SECURE DIRECT CHECKOUT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-heading tracking-tight">
          Kumpletuhin ang Iyong Membership
        </h1>
        <p className="text-sm text-zinc-400">
          Pumili ng package at magbayad gamit ang GCash o Maya QR.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Payment Instructions & Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Payment Method */}
          <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase font-mono text-zinc-400 tracking-wider">
                1. GCash QR Payment
              </h3>
              <span className="px-2.5 py-0.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold font-mono">
                Official GCash
              </span>
            </div>

            {/* Official GCash QR Box */}
            <div className="relative mx-auto w-52 sm:w-56 aspect-[9/16] rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-2xl bg-[#005CE6]">
              <Image
                src="/gcash-qr.jpg"
                alt="Official GCash QR"
                fill
                className="object-contain"
              />
            </div>

            {/* Account Details Box */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-left">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Account Name:</span>
                <span className="font-bold text-blue-400 font-mono">JO***A WA***N A.</span>
              </div>
              <p className="text-[11px] text-zinc-400 pt-1">
                I-scan ang QR sa itaas gamit ang GCash app at ilagay ang Reference Number sa ibaba.
              </p>
            </div>
          </div>

          {/* 2. Verification Form */}
          <form
            onSubmit={handleSubmitPayment}
            className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-5"
          >
            <h3 className="text-sm font-bold uppercase font-mono text-zinc-400 tracking-wider">
              2. Ilagay ang Payment Proof & Details
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Reference Number (Mula sa GCash/Maya Receipt)
              </label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Halimbawa: 9021 3456 7890"
                className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-700 focus:border-[#E50914] text-white font-mono text-sm outline-none transition-colors"
              />
            </div>

            {/* Proof Screenshot Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Screenshot ng Resibo (Opsyonal pero pampabilis ng approval)
              </label>

              <div className="flex items-center gap-3">
                <label className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-500 text-xs font-bold text-zinc-300 hover:text-white cursor-pointer transition-colors">
                  {uploadingProof ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#E50914]" />
                  ) : (
                    <Upload className="h-4 w-4 text-zinc-400" />
                  )}
                  <span>
                    {proofImageUrl ? "Palitan ang Screenshot" : "I-upload ang Resibo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProofUpload}
                    className="hidden"
                  />
                </label>
                {proofImageUrl && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Naka-attach
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 rounded-2xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-base flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E50914]/30 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span>Kumpirmahin at Isumite ang Bayad</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Package Summary & Selection (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 sticky top-24">
            <h3 className="text-sm font-bold uppercase font-mono text-zinc-400 tracking-wider">
              Order Summary
            </h3>

            {/* Plan Selector */}
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Piliin ang Plan:</label>
              <div className="grid grid-cols-3 gap-2">
                {packages.map((pkg) => {
                  const isSelected = selectedPkg?.id === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => {
                        audioFX.playClick();
                        setSelectedPkg(pkg);
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#E50914]/20 border-[#E50914] text-white ring-1 ring-[#E50914]"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="font-bold text-xs text-white">{pkg.name}</div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        ₱{pkg.price_php.toFixed(0)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Package Details */}
            {selectedPkg && (
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-base font-heading">
                    {selectedPkg.name} Package
                  </span>
                  <span className="font-black font-mono text-2xl text-white">
                    ₱{selectedPkg.price_php.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{selectedPkg.description}</p>
                <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-300 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>{selectedPkg.max_concurrent_sessions} Sabay-sabay na Screen</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Full HD & 4K Streaming Access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Personal Watchlist &amp; History Sync</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
              💡 <span className="text-zinc-300 font-bold">Paalala:</span> Matapos mag-submit,
              iverify ng admin ang reference number. Hindi mawawala ang iyong mga playlists at history.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
