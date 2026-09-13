"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Download,
  ExternalLink,
  Smartphone,
  Laptop,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Copy,
  Check,
  X,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";

export type DetectedOS = "ios" | "android" | "macos" | "windows" | "linux" | "other";

/**
 * Official Vector SVG for Brave Browser (Lion Emblem)
 */
export function BraveOfficialLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="braveOfficialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7638" />
          <stop offset="100%" stopColor="#FF1800" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#braveOfficialGrad)" />
      {/* Official Brave Lion Vector Silhouette */}
      <path
        d="M16 6L21.5 9.5L24 14.5L22 17.5L23.5 21L19.5 24L16 26L12.5 24L8.5 21L10 17.5L8 14.5L10.5 9.5L16 6Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path
        d="M16 9.5L19 12L20.5 15.5L18.5 17L16 18.5L13.5 17L11.5 15.5L13 12L16 9.5Z"
        fill="#FF2A00"
      />
      <path
        d="M14.5 13.5L16 14.5L17.5 13.5L16.8 15L16 15.8L15.2 15L14.5 13.5Z"
        fill="white"
      />
      <path
        d="M13.5 20L16 22.5L18.5 20L16 21.2L13.5 20Z"
        fill="white"
      />
    </svg>
  );
}

export function useBraveDetection() {
  const [isBrave, setIsBrave] = useState<boolean | null>(null);
  const [os, setOs] = useState<DetectedOS>("other");

  useEffect(() => {
    // Detect OS
    const ua = navigator.userAgent || "";
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || "";

    if (/iPad|iPhone|iPod/.test(ua) || (platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      setOs("ios");
    } else if (/android/i.test(ua)) {
      setOs("android");
    } else if (/Mac|Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua) || /Mac/i.test(platform)) {
      setOs("macos");
    } else if (/Win32|Win64|Windows|WinCE/i.test(ua) || /Win/i.test(platform)) {
      setOs("windows");
    } else if (/Linux/i.test(ua) || /Linux/i.test(platform)) {
      setOs("linux");
    } else {
      setOs("other");
    }

    // Detect Brave Browser
    const checkBrave = async () => {
      try {
        const nav = navigator as any;
        if (nav.brave && typeof nav.brave.isBrave === "function") {
          const res = await nav.brave.isBrave();
          setIsBrave(Boolean(res));
          return;
        }
      } catch {
        // Ignore detection error
      }
      setIsBrave(false);
    };

    checkBrave();
  }, []);

  return { isBrave, os };
}

export const BRAVE_DOWNLOAD_LINKS = {
  ios: "https://apps.apple.com/app/brave-private-web-browser/id1052879175",
  android: "https://play.google.com/store/apps/details?id=com.brave.browser",
  desktop: "https://brave.com/download/",
  mac: "https://brave.com/download/",
  windows: "https://brave.com/download/",
};

/**
 * Sticky / floating top alert bar that encourages downloading or opening in Brave Browser.
 */
export function BraveTopBanner() {
  const { isBrave, os } = useBraveDetection();
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  if (dismissed) return null;

  const downloadUrl =
    os === "ios"
      ? BRAVE_DOWNLOAD_LINKS.ios
      : os === "android"
      ? BRAVE_DOWNLOAD_LINKS.android
      : BRAVE_DOWNLOAD_LINKS.desktop;

  const platformLabel =
    os === "ios"
      ? "App Store (iOS)"
      : os === "android"
      ? "Google Play (Android)"
      : os === "macos"
      ? "macOS"
      : "Windows";

  const handleCopyLink = () => {
    audioFX.playClick();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("Link copied! Paste it in Brave Browser for ad-free streaming.", "success");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenInBrave = () => {
    audioFX.playClick();
    if (typeof window !== "undefined") {
      const currentUrl = window.location.href;
      window.location.href = `brave://${currentUrl.replace(/^https?:\/\//, "")}`;
      setTimeout(() => {
        handleCopyLink();
      }, 1200);
    }
  };

  return (
    <div className="relative z-40 bg-gradient-to-r from-[#FF5500]/95 via-[#FB542B]/90 to-[#9E1F63]/95 text-white py-2 px-3 sm:px-4 shadow-xl border-b border-orange-400/30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
        {/* Left message - 1 row on mobile */}
        <div className="flex items-center gap-2 text-center sm:text-left flex-1 min-w-0 w-full sm:w-auto justify-center sm:justify-start">
          <BraveOfficialLogo className="h-5 w-5 shrink-0 rounded-md shadow-sm" />
          {isBrave ? (
            <p className="font-semibold text-white truncate text-xs sm:text-sm">
              <span className="text-yellow-200 font-bold">Shields Active:</span> Browsing in Brave with zero popups!
            </p>
          ) : (
            <p className="font-medium text-white/95 truncate text-xs sm:text-sm">
              <strong className="text-yellow-200 font-bold">Ad-Free Viewing:</strong> Use{" "}
              <span className="font-extrabold text-white underline decoration-yellow-300 underline-offset-2">
                Brave Browser
              </span>{" "}
              to block video player popups.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isBrave && (
            <>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => audioFX.playClick()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-orange-600 hover:bg-orange-50 font-black text-xs shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Get Brave ({platformLabel})</span>
              </a>

              <button
                type="button"
                onClick={handleOpenInBrave}
                title="Open in Brave or Copy Link"
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/30 hover:bg-black/40 border border-white/30 text-white font-medium text-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                {copied ? <Check className="h-3 w-3 text-green-300" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? "Copied!" : "Open in Brave"}</span>
              </button>
            </>
          )}

          {isBrave && (
            <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-green-500/30 border border-green-300/40 text-white text-xs font-bold whitespace-nowrap">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-300" />
              <span>Shields On</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Dedicated Section in Landing Page to educate and direct users to download Brave.
 */
export function BraveFeatureSection() {
  const { isBrave, os } = useBraveDetection();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    audioFX.playClick();
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      showToast("Lantawon link copied! Open Brave and paste the link to watch ad-free.", "success");
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenInBrave = () => {
    audioFX.playClick();
    if (typeof window !== "undefined") {
      const url = window.location.href;
      window.location.href = `brave://${url.replace(/^https?:\/\//, "")}`;
      setTimeout(() => {
        handleCopyLink();
      }, 1000);
    }
  };

  return (
    <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#FF5500]/15 via-[#FB542B]/10 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 bg-gradient-to-b from-[#18181b] via-[#121215] to-[#0d0d0f] border border-[#27272a] rounded-3xl p-5 sm:p-10 lg:p-12 shadow-2xl overflow-hidden">
        {/* Top Status Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 sm:pb-8 border-b border-[#27272a]">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="shrink-0 p-1 sm:p-1.5 rounded-2xl bg-gradient-to-br from-[#FF5500]/20 to-[#FB542B]/20 border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <BraveOfficialLogo className="h-10 w-10 sm:h-12 sm:w-12" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-mono text-[10px] sm:text-[11px] font-bold tracking-wider whitespace-nowrap">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span>OFFICIAL STREAMING RECOMMENDATION</span>
              </div>
              <h2 className="text-base sm:text-2xl md:text-3xl font-black font-heading text-white tracking-tight mt-1 leading-tight sm:leading-snug">
                Stream 100% Ad-Free with Brave Browser
              </h2>
            </div>
          </div>

          {/* Verification Badge - Single Row */}
          {isBrave ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 self-start md:self-auto">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 shrink-0" />
              <span>You are using Brave Browser! Shields Active.</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 self-start md:self-auto">
              <Shield className="h-4 w-4 text-orange-400 shrink-0" />
              <span>Recommended for All Devices</span>
            </div>
          )}
        </div>

        {/* Core Value Props */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 py-6 sm:py-8">
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Blocks Video Player Popups</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Third-party streaming servers often have intrusive redirect popups. Brave’s built-in <strong>Shields</strong> block them at the network layer automatically.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">3x Faster &amp; Saves Mobile Data</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              By blocking heavy tracking scripts and bandwidth-hogging ad banners, videos load up to 3 times faster while conserving your mobile data.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">100% Free &amp; Zero Setup</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              No extensions or complicated configuration required. Just install Brave on your phone, tablet, or PC and open Lantawon.
            </p>
          </div>
        </div>

        {/* Download Buttons for All Platforms */}
        <div className="pt-6 border-t border-[#27272a] space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h4 className="text-sm sm:text-base font-bold text-white">
                Download Brave on your device:
              </h4>
              <p className="text-xs text-zinc-400">
                Available for Android, iOS (iPhone &amp; iPad), macOS, and Windows PC.
              </p>
            </div>

            {/* Quick Action Buttons - Clean 1 row on mobile */}
            <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap"
              >
                {copied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 shrink-0" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />}
                <span className="truncate">{copied ? "Link Copied!" : "Copy Link to Open in Brave"}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenInBrave}
                className="flex-1 sm:flex-none px-3.5 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FB542B] hover:opacity-90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap"
              >
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="truncate">Launch in Brave</span>
              </button>
            </div>
          </div>

          {/* Store Badges Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {/* Google Play Store */}
            <a
              href={BRAVE_DOWNLOAD_LINKS.android}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioFX.playClick()}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 group cursor-pointer ${
                os === "android"
                  ? "bg-orange-500/15 border-orange-500/50 shadow-lg shadow-orange-500/10"
                  : "bg-white/[0.02] border-white/[0.08] hover:border-orange-500/40 hover:bg-white/[0.05]"
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
                  Android Phones &amp; Tablets {os === "android" && "• (Your Device)"}
                </div>
                <div className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                  <span>Google Play Store</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </div>
              </div>
            </a>

            {/* Apple App Store */}
            <a
              href={BRAVE_DOWNLOAD_LINKS.ios}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioFX.playClick()}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 group cursor-pointer ${
                os === "ios"
                  ? "bg-orange-500/15 border-orange-500/50 shadow-lg shadow-orange-500/10"
                  : "bg-white/[0.02] border-white/[0.08] hover:border-orange-500/40 hover:bg-white/[0.05]"
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
                  iPhone &amp; iPad {os === "ios" && "• (Your Device)"}
                </div>
                <div className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                  <span>Apple App Store</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </div>
              </div>
            </a>

            {/* Desktop / Mac / PC */}
            <a
              href={BRAVE_DOWNLOAD_LINKS.desktop}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioFX.playClick()}
              className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 group cursor-pointer ${
                os === "macos" || os === "windows" || os === "linux"
                  ? "bg-orange-500/15 border-orange-500/50 shadow-lg shadow-orange-500/10"
                  : "bg-white/[0.02] border-white/[0.08] hover:border-orange-500/40 hover:bg-white/[0.05]"
              }`}
            >
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Laptop className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
                  Mac, Windows &amp; Linux {(os === "macos" || os === "windows" || os === "linux") && "• (Your Device)"}
                </div>
                <div className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                  <span>Brave for Desktop</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
