"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { LantawonIcon } from "@/components/brand/BrandLogo";
import { GuestTimerService } from "@/lib/services/guest-timer-service";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const { signIn, loginAsGuest, user, isLoading } = useAuth();
  const { showToast } = useToast();

  // Role-aware post-login destination: admins land in their console,
  // everyone else in the app. ?next= (set by middleware) wins if present.
  const resolvePostLoginRoute = (role: string): string => {
    if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
      return nextPath;
    }
    return role === "admin" || role === "super_admin" ? "/admin" : "/home";
  };

  // Already-authenticated users don't belong on the login page
  useEffect(() => {
    if (!isLoading && user.isLoggedIn && user.role !== "guest") {
      router.replace(resolvePostLoginRoute(user.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user, router]);

  const handleContinueAsGuest = async (e: React.MouseEvent) => {
    e.preventDefault();
    audioFX.playClick();

    // Check authoritative Supabase database first:
    const serverState = await GuestTimerService.syncWithServer();
    if (serverState?.isExpired) {
      showToast("Your guest trial has ended. Create an account to keep watching!", "info");
      router.push("/signup");
      return;
    } else if (!serverState && GuestTimerService.isGuestExpired()) {
      showToast("Your guest trial has ended. Create an account to keep watching!", "info");
      router.push("/signup");
      return;
    }

    // Clear any stale authenticated session before entering guest mode
    loginAsGuest();
    router.push("/home");
  };

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    // Supabase auth requires the email — usernames are display-only
    if (!identifier.includes("@")) {
      setErrorMessage("Please log in with your email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    audioFX.playClick();

    const res = await signIn(identifier, password);
    setIsSubmitting(false);

    if (res.success) {
      audioFX.playSuccess();
      showToast("Welcome back to Lantawon Nato!", "success");
      // Role-aware routing: admins go to the console, members to the app.
      // signIn() returns the server-resolved role directly — the context
      // `user` in this closure is stale (captured before login committed).
      router.push(resolvePostLoginRoute(res.role ?? user.role));
    } else {
      setErrorMessage(res.error || "Invalid credentials. Please check your email and password.");
    }
  };

  return (
    <div className="w-full max-w-md my-4 sm:my-8 px-4 sm:px-0">
      <div className="rounded-none sm:rounded-3xl bg-transparent sm:bg-[#151515]/95 border-0 sm:border border-[#262626] p-0 sm:p-8 backdrop-blur-none sm:backdrop-blur-2xl shadow-none sm:shadow-2xl space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <LantawonIcon className="h-12 w-12 sm:h-14 sm:w-14" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E31937]/15 border border-[#E31937]/30 text-[#E31937] text-[11px] font-mono font-bold mb-1">
            <Sparkles className="h-3 w-3 text-[#FFD106]" />
            <span>ACCOUNT LOG IN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#FFF8E7] font-heading tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-[#A7A7A7]">
            Log in to continue watching.
          </p>
        </div>

        {/* Device Concurrency / Superseded Notice */}
        {searchParams.get("reason") === "device_superseded" && (
          <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-200 text-xs font-semibold animate-in zoom-in-95 duration-200 flex items-start gap-3 shadow-lg shadow-amber-950/40">
            <span className="text-xl shrink-0">⚠️</span>
            <div className="space-y-1">
              <p className="font-black text-white text-sm">Session Disconnected</p>
              <p className="text-amber-200/90 text-xs leading-relaxed">
                You were automatically signed out because your account was logged into on another device. Lantawon accounts strictly enforce 1 active device at a time.
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
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
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#0D0D0D] border border-[#262626] text-[#FFF8E7] placeholder-[#A7A7A7]/60 text-base sm:text-sm outline-none focus:border-[#E31937] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#FFF8E7]/90">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A7A7A7]" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#0D0D0D] border border-[#262626] text-[#FFF8E7] placeholder-[#A7A7A7]/60 text-base sm:text-sm outline-none focus:border-[#E31937] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7A7A7] hover:text-[#FFF8E7] p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-[#E31937] hover:bg-[#c4122d] text-[#FFF8E7] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-[#E31937]/25 cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Forgot Password Link (Below Log In Button) */}
          <div className="text-center pt-0.5">
            <Link
              href="/forgot-password"
              onClick={() => audioFX.playClick()}
              className="text-xs font-medium text-[#A7A7A7] hover:text-[#FFF8E7] transition-colors cursor-pointer py-1"
            >
              Forgot Password?
            </Link>
          </div>
        </form>

        {/* Divider: or */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#262626]" />
          </div>
          <span className="relative px-3 bg-[#151515] text-xs text-[#A7A7A7] uppercase font-mono">
            or
          </span>
        </div>

        {/* Continue as Guest Button */}
        <Link
          href="/home"
          onClick={handleContinueAsGuest}
          className="w-full h-11 rounded-xl bg-[#0D0D0D] hover:bg-[#1f1f1f] border border-[#262626] text-[#FFF8E7] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>Continue as Guest</span>
        </Link>

        {/* Sign Up Footer */}
        <div className="text-center pt-2 text-xs text-[#A7A7A7]">
          <span>Don&apos;t have an account yet? </span>
          <Link
            href="/signup"
            onClick={() => audioFX.playClick()}
            className="text-[#FFF8E7] font-bold hover:underline hover:text-[#E31937] transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
