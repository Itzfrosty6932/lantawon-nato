"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Check,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Upload,
  Copy,
  ChevronLeft,
  Crown,
  ShieldCheck,
  X,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { subscriptionService } from "@/lib/services/subscription-service";
import { LantawonIcon } from "@/components/brand/BrandLogo";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <Loader2 className="h-8 w-8 text-[#E50914] animate-spin" />
        </div>
      }
    >
      <SignupFunnel />
    </Suspense>
  );
}

type FunnelStep = "register" | "payment" | "submitted";

function SignupFunnel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const { signUp, user, isLoading } = useAuth();
  const { showToast } = useToast();

  // Allow signup even if logged in (for testing multiple accounts)
  // No redirect needed - user can register a new account

  // Current Step
  const [step, setStep] = useState<FunnelStep>("register");

  // Form Fields
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Single Solo Plan Details
  const soloPlan = {
    name: "Lantawon Solo Pass",
    price: 349,
    screens: 1,
    billing: "monthly",
  };

  // Payment Details
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [proofFileSize, setProofFileSize] = useState<string | null>(null);
  // AUDIT H2: storage path persisted to DB (proofImage is only the preview).
  const proofPathRef = useRef<string>("");
  // The raw receipt file is held here at selection time; the storage upload
  // only happens AFTER signUp() succeeds, since the private bucket policy
  // requires the real auth uid as the folder name.
  const proofFileRef = useRef<File | null>(null);
  // The freshly registered user's id — needed to upload into their own
  // private folder before the session cache has caught up.
  const uploadedUserIdRef = useRef<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Step 1: Handle Initial Account Registration
  const handleContinueFromRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !email.trim() || !password.trim()) {
      setErrorMessage("Please enter all required information.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Password and Confirm Password do not match.");
      return;
    }

    // Check for duplicate email/username BEFORE proceeding to payment
    try {
      const checkRes = await fetch("/api/auth/check-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), username: username.trim() }),
      });
      if (!checkRes.ok) {
        const err = await checkRes.json();
        setErrorMessage(err.error || "Account already exists. Please log in instead.");
        return;
      }
    } catch {
      setErrorMessage("Unable to verify account. Please try again.");
      return;
    }

    audioFX.playClick();
    setStep("payment");
  };

  // Step 2: Handle Final Payment Submission
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      setErrorMessage("Please enter the Reference Number from your payment receipt.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    audioFX.playClick();

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // 1. Register Auth User (SECURITY audit H5: no client-supplied tier —
      // entitlement is granted server-side when the admin approves payment).
      // Retry-safe: if a previous attempt already created the auth user (and we
      // failed later on the payment record), the session still holds that user.
      // Re-registering would throw "email already exists", so detect it and
      // skip straight to the payment submission instead.
      const { data: existing } = await supabase.auth.getUser();
      const alreadyRegistered =
        existing?.user?.email?.toLowerCase() === email.trim().toLowerCase();

      // The freshly created user's id. signUp() returns it directly, which is
      // more reliable than re-reading getUser() immediately after — the browser
      // client's session hasn't always propagated yet at that instant.
      let currentUserId = existing?.user?.id || "";

      if (!alreadyRegistered) {
        const res = await signUp(username, email, password);
        if (!res.success) {
          setErrorMessage(res.error || "Failed to create account. Please try again.");
          setIsSubmitting(false);
          return;
        }
        currentUserId = res.userId || currentUserId;
      }

      // Fallback: if we still don't have an id (retry path with a lagging
      // session cache), give the session a moment and re-read it.
      if (!currentUserId) {
        for (let attempt = 0; attempt < 5 && !currentUserId; attempt++) {
          await new Promise((r) => setTimeout(r, 400));
          const { data: retry } = await supabase.auth.getUser();
          currentUserId = retry?.user?.id || "";
        }
      }

      if (!currentUserId) {
        throw new Error("Session not ready — please log in to finish your payment submission.");
      }

      // 2. Submit payment record to backend.
      // CRITICAL: any failure here MUST surface — never leave the user in a
      // "pending" state with no payment record for the admin to verify. On
      // failure we throw, the user stays on this step, and a retry resumes
      // from the payment submission (the auth user already exists).
      const packagesList = await subscriptionService.getActivePackages();
      const targetPkg = packagesList.find((p) => p.code === "solo") || packagesList[0];
      if (!targetPkg) {
        throw new Error("No active membership package found. Please contact support.");
      }

      uploadedUserIdRef.current = currentUserId;

      // AUDIT H2: the receipt is uploaded NOW — after signUp() — so it lands
      // inside the new user's own private folder ({uid}/{timestamp}.{ext}).
      if (proofFileRef.current && !proofPathRef.current) {
        const { uploadPaymentProof } = await import("@/lib/services/payment-proof");
        const uploadRes = await uploadPaymentProof(
          proofFileRef.current,
          currentUserId
        );
        if (uploadRes.path) {
          proofPathRef.current = uploadRes.path;
        } else {
          console.warn("[Signup] Proof upload failed:", uploadRes.error);
        }
      }

      let account = await subscriptionService.getUserAccount(currentUserId);
      if (!account) {
        const createRes = await subscriptionService.createAccount(
          currentUserId,
          `${username}'s Account`
        );
        if (createRes.success && createRes.accountId) {
          account = await subscriptionService.getUserAccount(currentUserId);
        }
      }

      if (!account) {
        throw new Error("Could not set up your account. Please try again.");
      }

      const submitRes = await fetch("/api/payments/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          packageId: targetPkg.id,
          amount: soloPlan.price,
          referenceNumber: referenceNumber.trim(),
          proofImageUrl: proofPathRef.current,
        }),
      });

      if (!submitRes.ok) {
        const err = await submitRes.json().catch(() => ({}));
        throw new Error(
          err.error ||
            "Your account was created but we couldn't record your payment. Please tap Submit again."
        );
      }

      audioFX.playSuccess();
      setStep("submitted");
      showToast(
        "Payment submitted for review. You can log in now — watching unlocks once an admin approves your payment.",
        "success"
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("File is too large (Maximum size is 10MB)", "error");
        return;
      }
      audioFX.playClick();
      // Hold the raw file — the actual storage upload happens right after
      // account creation, when we know the real auth user id (AUDIT H2).
      proofFileRef.current = file;
      setProofFileName(file.name);
      setProofFileSize((file.size / (1024 * 1024)).toFixed(2) + " MB");
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        showToast("Receipt screenshot attached.", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveScreenshot = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    audioFX.playPop();
    proofFileRef.current = null;
    proofPathRef.current = "";
    setProofImage(null);
    setProofFileName(null);
    setProofFileSize(null);
    showToast("Screenshot removed", "info");
  };

  const GCASH_NUMBER = "09777044683";
  const GCASH_NAME = "JO***A WA***N A.";

  const copyAccountNum = () => {
    audioFX.playClick();
    navigator.clipboard.writeText(GCASH_NUMBER);
    setCopiedAccount(true);
    showToast("Copied GCash number!", "success");
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  return (
    <div className="w-full max-w-xl my-4 sm:my-6 px-4 sm:px-0">
      <div className="rounded-none sm:rounded-3xl bg-transparent sm:bg-zinc-950/90 border-0 sm:border border-zinc-800/80 p-0 sm:p-8 backdrop-blur-none sm:backdrop-blur-2xl shadow-none sm:shadow-2xl space-y-6">
        {/* ─── STEP 1: REGISTRATION (SOLO PLAN) ─── */}
        {step === "register" && (
          <form onSubmit={handleContinueFromRegister} className="space-y-5 animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <LantawonIcon className="h-12 w-12 sm:h-14 sm:w-14" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E31937]/15 border border-[#E31937]/30 text-[#E31937] text-[11px] font-mono font-bold mb-1">
                <Sparkles className="h-3 w-3 text-[#FFD106]" />
                <span>SOLO MEMBERSHIP</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#FFF8E7] font-heading tracking-tight">
                Create Your Account
              </h1>
              <p className="text-xs text-zinc-400">
                Unlock full access to movies, series, and anime with the Solo Pass.
              </p>
            </div>

            {/* Solo Plan Preview Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1c1c1c] to-[#141414] border border-[#E31937]/40 shadow-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#E31937]/20 border border-[#E31937]/30 flex items-center justify-center text-[#E31937] shrink-0">
                  <Crown className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <span className="font-bold text-white text-sm block font-heading">
                    {soloPlan.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    1 Active Screen • Zero Ads
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg sm:text-xl font-black text-white font-mono">
                  ₱{soloPlan.price}
                </div>
                <span className="text-[10px] text-zinc-400">/ month</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <div className="space-y-3.5">
              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 text-base sm:text-sm outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 text-base sm:text-sm outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min. 6 characters)"
                    className="w-full h-11 pl-10 pr-10 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 text-base sm:text-sm outline-none focus:border-[#E50914] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900/90 border border-zinc-700/80 text-white placeholder-zinc-500 text-base sm:text-sm outline-none focus:border-[#E50914] transition-colors"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E50914]/30 cursor-pointer"
            >
              <span>Continue to Payment (₱349 / mo)</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-xs text-zinc-400">
              Already have an account?{" "}
              <Link href="/login" className="text-white font-bold hover:underline hover:text-[#E50914] transition-colors">
                Log In
              </Link>
            </p>
          </form>
        )}

        {/* ─── STEP 2: PAYMENT (₱349 GCASH / MAYA QR) ─── */}
        {step === "payment" && (
          <form onSubmit={handleSubmitPayment} className="space-y-5 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep("register")}
                aria-label="Back"
                className="h-9 w-9 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="space-y-0.5">
                <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight">
                  Complete Your Payment
                </h2>
                <p className="text-xs text-zinc-400">
                  Scan the GCash QR code and submit your reference number.
                </p>
              </div>
            </div>

            {/* Selected Plan Summary */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 block">Membership:</span>
                <span className="font-bold text-white text-base font-heading">
                  {soloPlan.name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400 block">Total Amount:</span>
                <span className="font-black text-xl text-white font-mono">
                  ₱{soloPlan.price} / month
                </span>
              </div>
            </div>

            {/* Scan to Pay Section (GCash QR) */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-black font-mono">
                  GCASH QR PAYMENT
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

              {/* Account Info Box */}
              <div className="p-3 rounded-xl bg-black/60 border border-zinc-800 flex items-center justify-between text-left gap-3">
                <div className="min-w-0">
                  <span className="text-[10px] text-zinc-400 block">GCash Number:</span>
                  <span className="font-mono font-bold text-sm sm:text-base text-blue-400 tracking-wide">
                    {GCASH_NUMBER}
                  </span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    Account Name: {GCASH_NAME}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={copyAccountNum}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 font-mono font-semibold flex items-center gap-1 transition-colors shrink-0"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedAccount ? "Copied" : "Copy No."}</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-400">
                Scan the QR code using your GCash or Maya app for <strong className="text-white">₱349</strong>, then enter the Reference Number below.
              </p>
            </div>

            {/* Form Fields: Reference Number & Upload */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-300">GCash</label>
                <input
                  type="text"
                  required
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Enter Reference No. (e.g. 100234567890)"
                  className="w-full h-11 px-3.5 rounded-xl bg-zinc-900 border border-zinc-700 text-base sm:text-sm text-white font-mono outline-none focus:border-[#E50914]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span>Payment Screenshot (Optional)</span>
                  {proofImage && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3" /> ATTACHED
                    </span>
                  )}
                </label>

                {!proofImage ? (
                  <label className="flex flex-col items-center justify-center gap-2 p-5 rounded-2xl bg-zinc-900/90 border-2 border-dashed border-zinc-700 hover:border-[#E50914] text-zinc-300 hover:text-white cursor-pointer transition-all group">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800 group-hover:bg-[#E50914]/20 flex items-center justify-center text-zinc-400 group-hover:text-[#E50914] transition-colors">
                      <Upload className="h-5 w-5" />
                    </div>
                    <div className="text-center space-y-0.5">
                      <span className="text-xs font-bold block text-zinc-200 group-hover:text-white">
                        Click to upload GCash / Maya receipt screenshot
                      </span>
                      <span className="text-[10px] text-zinc-400 block font-medium">
                        Supports JPG, PNG, WEBP (Max 10MB)
                      </span>
                    </div>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                ) : (
                  <div className="relative rounded-2xl bg-zinc-900 border border-emerald-500/40 p-3 flex items-center gap-3 shadow-lg animate-in fade-in zoom-in-95">
                    {/* Thumbnail Preview */}
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-black border border-zinc-700 shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proofImage}
                        alt="Payment Receipt Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-white truncate">
                          {proofFileName || "GCash_Receipt_Screenshot.png"}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>{proofFileSize || "Image verified"}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold">Ready to submit</span>
                      </div>
                    </div>

                    {/* Action Buttons: Replace & Remove */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <label
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-bold text-zinc-200 hover:text-white cursor-pointer transition-colors border border-zinc-700 flex items-center gap-1"
                        title="Change image"
                      >
                        <RefreshCw className="h-3 w-3 text-zinc-400" />
                        <span>Replace</span>
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveScreenshot}
                        className="h-7 w-7 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Remove screenshot"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E50914]/30 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Submit Payment &amp; Activate</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* ─── STEP 3: SUBMITTED CONFIRMATION (PENDING ADMIN REVIEW) ─── */}
        {step === "submitted" && (
          <div className="text-center space-y-6 animate-in zoom-in-95 duration-300 py-4">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black font-heading text-white">Payment Submitted!</h2>
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                Salamat! Naipasa na ang iyong bayad para sa Solo Pass.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Waiting for Admin Verification</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left space-y-2 max-w-sm mx-auto">
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong className="text-white">Ano ang susunod?</strong> Chine-check pa ng admin ang iyong GCash payment. Habang naghihintay:
              </p>
              <ul className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <Check className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Puwede ka nang mag-browse at mag-explore ng buong catalog.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Loader2 className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                  <span>Mabubuksan ang panonood kapag na-verify na ng admin ang bayad mo — usually mabilis lang.</span>
                </li>
              </ul>
            </div>

            <Link
              href="/home"
              className="w-full h-12 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>Browse the Catalog</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
