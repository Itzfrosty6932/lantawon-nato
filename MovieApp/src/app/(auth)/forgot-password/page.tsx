"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  User,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Loader2,
  MailCheck,
} from "lucide-react";
import { LantawonIcon } from "@/components/brand/BrandLogo";

/**
 * MANUAL PASSWORD RESET — STEP 1 (user side)
 *
 * There is no automated email flow. The user requests a reset, our team
 * verifies them manually via Gmail/chat, and an admin issues a temporary
 * password from the Admin Portal. The user changes it after logging in.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter the email on your account.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md my-4 sm:my-8 px-4 sm:px-0">
      <div className="rounded-none sm:rounded-3xl bg-transparent sm:bg-[#151515]/95 border-0 sm:border border-[#262626] p-0 sm:p-8 backdrop-blur-none sm:backdrop-blur-2xl shadow-none sm:shadow-2xl space-y-6">
        {submitted ? (
          /* ── Confirmation state ─────────────────────────────────────── */
          <>
            <div className="space-y-3 text-center">
              <div className="flex justify-center mb-2">
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <MailCheck className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <h1 className="text-2xl font-black text-[#FFF8E7] font-heading tracking-tight">
                Request Sent
              </h1>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                If that email is registered, our team will contact you at your
                Gmail with a temporary password. You&apos;ll change it once
                you&apos;re back in your account.
              </p>
            </div>
            <Link
              href="/login"
              className="w-full h-12 rounded-xl bg-[#E31937] hover:bg-[#c4122d] text-[#FFF8E7] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E31937]/25"
            >
              Back to Log In
            </Link>
          </>
        ) : (
          /* ── Request form ───────────────────────────────────────────── */
          <>
            <div className="space-y-2 text-center">
              <div className="flex justify-center mb-2">
                <LantawonIcon className="h-12 w-12 sm:h-14 sm:w-14" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#FFF8E7] font-heading tracking-tight">
                Forgot Password
              </h1>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Enter your account email and our team will reach out via Gmail
                to verify it&apos;s you, then send a temporary password.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#FFF8E7]/90">Email</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A7A7A7]" />
                  <input
                    type="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0D0D0D] border border-[#262626] text-[#FFF8E7] placeholder-[#A7A7A7]/60 text-base sm:text-sm outline-none focus:border-[#E31937] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#FFF8E7]/90">
                  Describe your issue <span className="text-[#A7A7A7]/60 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A7A7A7]" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="e.g. I lost access to my old email, or anything that helps us verify you..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0D0D0D] border border-[#262626] text-[#FFF8E7] placeholder-[#A7A7A7]/60 text-sm outline-none focus:border-[#E31937] transition-colors resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#E31937] hover:bg-[#c4122d] text-[#FFF8E7] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E31937]/25 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Request Password Reset</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <Link
              href="/login"
              className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#A7A7A7] hover:text-[#FFF8E7] transition-colors py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Log In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
