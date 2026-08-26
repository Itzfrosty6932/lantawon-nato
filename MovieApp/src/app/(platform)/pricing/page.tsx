"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Zap,
  Users,
  Monitor,
  ArrowRight,
  Crown,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import {
  subscriptionService,
  isPromoLive,
  getPromoPrice,
  type SubscriptionPackage,
} from "@/lib/services/subscription-service";

export default function PricingPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPackage, setUserPackage] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
    if (user) {
      loadUserSubscription();
    }
  }, [user]);

  const loadPackages = async () => {
    setLoading(true);
    const data = await subscriptionService.getActivePackages();
    setPackages(data);
    setLoading(false);
  };

  const loadUserSubscription = async () => {
    if (!user) return;

    const account = await subscriptionService.getUserAccount(user.id);
    if (account) {
      const { currentPackage } = await subscriptionService.getSubscriptionWithPackage(account.id);
      if (currentPackage) {
        setUserPackage(currentPackage.code);
      }
    }
  };

  const getPackageFeatures = (code: string, sessions: number) => {
    const baseFeatures = [
      "Complete movie, series & anime catalog",
      "Search, filters & mood discovery",
      "Watchlist, favorites & history",
      "Achievements & XP system",
      "Personal statistics & analytics",
    ];

    const sessionFeature = `${sessions} concurrent ${sessions === 1 ? "session" : "sessions"}`;

    return [sessionFeature, ...baseFeatures];
  };

  const isCurrentPackage = (code: string) => {
    return userPackage === code;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
          <span className="text-zinc-400">Loading pricing plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 sm:py-14 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E31937]/15 border border-[#E31937]/30 text-[#E31937] text-xs font-mono font-bold">
          <Sparkles className="h-3.5 w-3.5 text-[#FFD106]" />
          <span>LANTAWON NATO MEMBERSHIP</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-heading tracking-tight text-white">
          Simple, Transparent Plans
        </h1>
        <p className="text-sm sm:text-base text-zinc-400">
          Stream movies, anime, and series with no device limits. Your package controls concurrent sessions.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className={`grid grid-cols-1 ${packages.length > 1 ? "md:grid-cols-3" : "md:grid-cols-1"} gap-6 lg:gap-8 max-w-5xl mx-auto`}>
        {packages.map((pkg, index) => {
          const isCurrent = isCurrentPackage(pkg.code);
          // Always show as featured (only Solo plan exists)
          const isPopular = true;
          const pkgPromoLive = isPromoLive(pkg);

          return (
            <div
              key={pkg.id}
              className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative border transition-all ${
                isPopular
                  ? "bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-[#E50914]/50 shadow-[0_0_40px_rgba(229,9,20,0.15)] ring-1 ring-[#E50914]/30"
                  : "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700/80"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-[#E50914] text-white text-[11px] font-black uppercase font-mono tracking-wider shadow-md">
                  💎 Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2 flex-wrap">
                    {pkg.name}
                    {isCurrent && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Current
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {pkg.description || `${pkg.max_concurrent_sessions} concurrent ${pkg.max_concurrent_sessions === 1 ? "session" : "sessions"}`}
                  </p>
                </div>

                <div className="space-y-2">
                  {pkgPromoLive && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[11px] font-black uppercase font-mono animate-pulse">
                        {pkg.promo_label?.trim() || `${pkg.promo_percent}% OFF`}
                      </span>
                      {pkg.promo_expires_at && (
                        <span className="text-[10px] font-mono text-emerald-300/70">
                          ends {new Date(pkg.promo_expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {pkgPromoLive && (
                      <span className="text-lg font-bold font-mono text-zinc-500 line-through">
                        ₱{pkg.price_php.toFixed(0)}
                      </span>
                    )}
                    <span className={`text-xs ${pkgPromoLive ? "text-emerald-400" : "text-zinc-500"}`}>₱</span>
                    <span
                      className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                        pkgPromoLive ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {getPromoPrice(pkg)}
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">/ month</span>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-zinc-400 tracking-wider">
                    <Monitor className="h-3.5 w-3.5" />
                    <span>Features Included</span>
                  </div>
                  <ul className="space-y-2.5">
                    {getPackageFeatures(pkg.code, pkg.max_concurrent_sessions).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                        <Check className="h-4 w-4 text-[#E50914] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-zinc-900 text-zinc-400 font-semibold text-xs sm:text-sm border border-zinc-800 cursor-default flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Current Package
                  </button>
                ) : user ? (
                  <Link
                    href="/account/subscription"
                    onClick={() => audioFX.playClick()}
                    className="w-full py-3.5 rounded-2xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-[#E50914]/30"
                  >
                    {userPackage ? "Switch to " : "Select "}{pkg.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    onClick={() => audioFX.playClick()}
                    className="w-full py-3.5 rounded-2xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-[#E50914]/30"
                  >
                    Get Started with {pkg.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Comparison Info */}
      <div className="max-w-3xl mx-auto space-y-6 pt-6 border-t border-zinc-900">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-heading text-center">
          How It Works
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-[#E50914]/10 border border-[#E50914]/30 flex items-center justify-center text-[#E50914]">
              <Users className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Session-Based</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Your package controls how many people can watch at the same time, not who can use the account.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Monitor className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Device Switching</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Log in from any device. When the limit is reached, the oldest session auto-logs out.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 space-y-2">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Upgrade Anytime</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Switch packages without losing your watch history, achievements, or progress.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      {!user && (
        <div className="text-center pt-6">
          <Link
            href="/signup"
            onClick={() => audioFX.playClick()}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm transition-all shadow-2xl hover:shadow-[#E50914]/40"
          >
            <Crown className="h-5 w-5" />
            Create Your Account
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      )}
    </div>
  );
}
