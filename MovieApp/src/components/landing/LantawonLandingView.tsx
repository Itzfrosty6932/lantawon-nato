"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Tv,
  Smartphone,
  Laptop,
  Monitor,
  Check,
  Plus,
  Minus,
  Search,
  Flame,
  Film,
  MapPin,
  Popcorn,
  BookOpen,
  Trophy,
  Users,
  UserCheck,
  Crown,
  Quote,
  Globe,
  Wifi,
  Server,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { GuestTimerService } from "@/lib/services/guest-timer-service";
import {
  isPromoLive,
  getPromoPrice,
  type SubscriptionPackage,
} from "@/lib/services/subscription-service";
import type { MediaItem } from "@/types/media";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

interface LantawonLandingViewProps {
  trendingItems: MediaItem[];
  plan: SubscriptionPackage | null;
}

export function LantawonLandingView({ trendingItems, plan }: LantawonLandingViewProps) {
  const router = useRouter();
  const { loginAsGuest, user } = useAuth();
  const { showToast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedModalItem, setSelectedModalItem] = useState<MediaItem | null>(null);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  // The single plan's pricing — falls back to the canonical Solo Pass when
  // the DB has no active package (fresh install / outage).
  const planPrice = plan ? Math.round(plan.price_php) : 349;
  const promoActive = plan ? isPromoLive(plan) : false;
  const promoPrice = promoActive && plan ? getPromoPrice(plan) : null;
  const promoText =
    promoActive && plan
      ? plan.promo_label?.trim() || `${plan.promo_percent}% OFF`
      : null;

  // Auto-scroll to pricing if redirected with expired=1 or hash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isActuallyExpired = params.get("expired") === "1" && GuestTimerService.isGuestExpired();

      if (isActuallyExpired) {
        setExpiredNotice(true);
        setTimeout(() => {
          document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      } else if (window.location.hash === "#plans" || window.location.hash === "#pricing") {
        setTimeout(() => {
          document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    }
  }, []);

  const handleWatchAsGuest = async (e: React.MouseEvent) => {
    e.preventDefault();
    audioFX.playClick();

    // SESSION FIX: a signed-in user clicking the landing CTA must NEVER be
    // silently signed out — loginAsGuest() calls supabase.auth.signOut().
    // Route them to the app instead.
    if (user.isLoggedIn && user.role !== "guest") {
      router.push("/home");
      return;
    }

    // Check authoritative Supabase database first:
    const serverState = await GuestTimerService.syncWithServer();
    if (serverState?.isExpired) {
      showToast("Your guest trial has ended. Create an account to keep watching!", "info");
      router.push("/signup");
      return;
    } else if (!serverState && typeof window !== "undefined" && GuestTimerService.isGuestExpired()) {
      showToast("Your guest trial has ended. Create an account to keep watching!", "info");
      router.push("/signup");
      return;
    }

    loginAsGuest();
    router.push("/home");
  };

  // Lock body scroll and close on Escape while the preview modal is open
  // (Escape close is essential for TV remote / keyboard navigation)
  useEffect(() => {
    if (!selectedModalItem) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedModalItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedModalItem]);

  const toggleFaq = (index: number) => {
    audioFX.playClick();
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What is Lantawon Nato?",
      a: "“Lantawon Nato” is a Visayan expression that translates to “Let’s watch together” or “Our viewing space.” In the context of the platform, it represents discovering great cinema and effortlessly exploring what to watch.",
    },
    {
      q: "What devices are supported?",
      a: "Lantawon Nato is designed to work seamlessly across modern devices with a web browser, including desktop computers, laptops, tablets, and smartphones.",
    },
    {
      q: "How does streaming server selection work?",
      a: "Lantawon Nato provides multiple streaming mirrors for available titles. You can choose a server manually or use our smart Auto-Pick feature. If a server is slow or unavailable, you can switch mirrors with a single click.",
    },
    {
      q: "How does the Lantawon Solo Pass subscription work?",
      a: (
        <div className="space-y-3">
          <p>
            The Lantawon Solo Pass is an all-inclusive membership at <strong>₱349 / month</strong> that gives you unrestricted access to the entire movie, teleserye, TV series, anime, and documentary catalog in high definition with zero ads.
          </p>
          <p>
            You can stream seamlessly across all your supported devices—including Smart TVs, mobile phones, tablets, laptops, and desktop computers—with <strong>1 active streaming screen</strong> at a time.
          </p>
          <div className="p-3.5 bg-black/60 border border-zinc-800 space-y-1.5 font-mono text-xs text-zinc-300 rounded-xl">
            <p className="font-bold text-white mb-1">Membership Highlights:</p>
            <p>💎 1080p Full HD Streaming Quality (depends on server source)</p>
            <p>⚡ 14 Resilient Multi-CDN Cloud Mirrors with Instant Failover</p>
            <p>🚫 100% Zero Ads and Zero Interruptions</p>
            <p>📱 1 Active Streaming Screen on Any Device</p>
            <p>⭐ Personal Watchlist, Favorites &amp; Watch History</p>
            <p>📅 No long-term lock-in contract — cancel anytime.</p>
          </div>
        </div>
      ),
    },
    {
      q: "Are there ads while watching?",
      a: "Lantawon Nato does not display pop-up ads or interruptions over the player while you are watching. Some third-party streaming providers may embed their own promotional overlays, but we offer multiple mirror options to ensure the cleanest viewing experience.",
    },
  ];

  const goodToKnow = [
    {
      icon: <Globe className="h-5 w-5 text-blue-400" />,
      title: "Online Streaming Only",
      description:
        "Lantawon Nato is designed for online viewing and does not currently support downloading movies for offline playback.",
    },
    {
      icon: <Wifi className="h-5 w-5 text-emerald-400" />,
      title: "Internet Connection Required",
      description:
        "A stable internet connection is needed for smooth playback.",
    },
    {
      icon: <Server className="h-5 w-5 text-purple-400" />,
      title: "Third-Party Streaming Servers",
      description:
        "Some content may be provided through third-party streaming servers. Their availability, speed, quality, and reliability may vary.",
    },
    {
      icon: <RefreshCw className="h-5 w-5 text-amber-400" />,
      title: "Server Availability May Vary",
      description:
        "If a server is unavailable or doesn't load properly, you can switch to another available server.",
    },
    {
      icon: <Tv className="h-5 w-5 text-rose-400" />,
      title: "Streaming Quality May Vary",
      description:
        "Video quality (up to 1080p) and playback performance depend on the selected mirror server and your internet speed.",
    },
    {
      icon: <Crown className="h-5 w-5 text-[#E31937]" />,
      title: "1 Active Screen at a Time",
      description:
        "The Solo Pass includes 1 active concurrent streaming screen across all your logged-in devices.",
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0D0D0D] text-[#FFF8E7] selection:bg-[#E31937] selection:text-[#FFF8E7] overflow-x-hidden">
      {/* ─── HEADER ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#0D0D0D]/95 via-[#0D0D0D]/70 to-transparent backdrop-blur-sm transition-all pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center group shrink-0">
            <BrandLogo size="lg" />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              onClick={() => audioFX.playClick()}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-[#E31937] hover:bg-[#c4122d] text-[#FFF8E7] font-bold text-xs sm:text-sm whitespace-nowrap shrink-0 transition-all shadow-md hover:shadow-[#E31937]/40 cursor-pointer"
            >
              Log In
            </Link>
          </div>
        </div>
      </header>

      {/* ─── 1. HERO BANNER ─── */}
      <section className="relative min-h-[92vh] sm:min-h-[92dvh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-20">
        {/* Background Poster Mosaic with Vignette */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/background.jpg"
            alt="Cinematic Backdrop"
            fill
            priority
            className="object-cover object-center opacity-30 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/75 to-[#0D0D0D]/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0D0D0D]/60 to-[#0D0D0D]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5 sm:space-y-6 py-16">
          {/* Platform Category Badge */}
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#151515]/90 border border-[#262626] text-[#A7A7A7] text-[11px] sm:text-xs md:text-sm font-mono backdrop-blur-md shadow-lg mx-auto whitespace-nowrap">
            <span>A Web-Based Subscription Streaming Platform</span>
          </div>

          {/* Main Hero Headline (Strictly 2 rows across desktop, tablet, and mobile) */}
          <h1 className="font-extrabold text-[#FFF8E7] tracking-tight leading-tight max-w-5xl mx-auto space-y-1 sm:space-y-2">
            <span className="block whitespace-nowrap text-[clamp(1.1rem,5vw,3.75rem)]">
              Movies, TV series, anime, and more
            </span>
            <span className="block whitespace-nowrap text-[#FFF8E7]/90 text-[clamp(1.1rem,5vw,3.75rem)]">
              all in one place.
            </span>
          </h1>

          {/* Subtitle & Pricing */}
          <p className="text-base sm:text-xl text-[#A7A7A7] font-medium max-w-2xl mx-auto">
            Starts at <span className="text-[#E31937] font-bold">₱349</span> / month. Cancel anytime.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 max-w-md mx-auto">
            <button
              type="button"
              onClick={handleWatchAsGuest}
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-[#151515] hover:bg-[#202020] border border-[#262626] text-[#FFF8E7] font-bold text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Watch as Guest</span>
            </button>

            <Link
              href="/signup"
              onClick={() => audioFX.playClick()}
              className="w-full sm:w-1/2 py-3.5 px-6 rounded-2xl bg-[#E31937] hover:bg-[#c4122d] text-[#FFF8E7] font-bold text-sm sm:text-base transition-all shadow-xl shadow-[#E31937]/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Device Compatibility List (1 Row, Flat) */}
          <div className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 text-left max-w-4xl mx-auto">
            <div className="p-3.5 bg-[#151515] border border-[#262626] flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-[#E31937] shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#FFF8E7] block">Mobile phones</span>
                <span className="text-[#A7A7A7]">Chrome, Safari, etc.</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#151515] border border-[#262626] flex items-center gap-3">
              <Laptop className="h-5 w-5 text-blue-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#FFF8E7] block">Laptops</span>
                <span className="text-[#A7A7A7]">Chrome, Safari, Edge, Firefox</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#151515] border border-[#262626] flex items-center gap-3">
              <Monitor className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#FFF8E7] block">Desktop computers</span>
                <span className="text-[#A7A7A7]">Chrome, Edge, Firefox, etc.</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#151515] border border-[#262626] flex items-center gap-3">
              <Tv className="h-5 w-5 text-purple-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-[#FFF8E7] block">Smart TVs</span>
                <span className="text-[#A7A7A7]">Supported web browsers</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-[#0D0D0D] border-b border-[#E31937]/30" />
      </section>

      {/* ─── 2. TRENDING NOW (TOP 1 TO 10 SCROLLABLE CAROUSEL - FLAT) ─── */}
      {trendingItems && trendingItems.length > 0 && (
        <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            {/* Header info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 bg-[#E31937]/20 border border-[#E31937]/30 flex items-center justify-center text-[#E31937] shadow-lg shadow-[#E31937]/20">
                  <Flame className="h-4 w-4 fill-current" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight text-[#FFF8E7]">
                  Trending Now
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#A7A7A7]">
                Top 10 most popular and frequently watched movies &amp; shows
              </p>
            </div>

            {/* See All button */}
            <Link
              href="/trending"
              onClick={() => audioFX.playClick()}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-zinc-300 hover:text-white transition-all bg-[#181818] hover:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-700/80 shadow-sm shrink-0"
            >
              <span>See All</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#E31937]" />
            </Link>
          </div>

          {/* Horizontal Scrollable Carousel (Flat Cards with 6th card peeking half) */}
          <div
            ref={carouselRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-6 pt-2 snap-x snap-mandatory touch-pan-x overscroll-x-contain"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {trendingItems.slice(0, 10).map((item, index) => {
              const poster = item.poster_path
                ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.poster_path}`
                : TMDB_IMAGE_CONFIG.FALLBACK_POSTER;
              const title = item.title || item.name || "Untitled";
              const rank = index + 1;
              const year = (item.release_date || item.first_air_date || "").split("-")[0];

              return (
                <div
                  key={item.id}
                  className="flex-none snap-start group relative w-[56vw] sm:w-[32vw] md:w-[24vw] lg:w-[calc((100%-4*1.25rem)/5.35)] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#E31937]"
                  onClick={() => {
                    audioFX.playClick();
                    setSelectedModalItem(item);
                  }}
                  onKeyDown={(e) => {
                    // Enter/Space activation keeps cards operable on TVs & keyboards
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      audioFX.playClick();
                      setSelectedModalItem(item);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Preview ${title}`}
                >
                  <div className="block bg-[#151515] border border-[#262626] hover:border-[#E31937] transition-all duration-300 shadow-xl hover:-translate-y-1">
                    {/* Poster Viewport (Flat) */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0D0D0D]">
                      <Image
                        src={poster}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 176px, 224px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                      {/* Original Rank Badge (Flat) */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {rank === 1 ? (
                          <div className="px-2.5 py-1 bg-[#FFD106] text-[#0D0D0D] font-black text-xs font-mono flex items-center gap-1 shadow-lg">
                            <span>#1</span>
                          </div>
                        ) : rank <= 3 ? (
                          <div className="px-2 py-1 bg-[#E31937] text-[#FFF8E7] font-black text-xs font-mono flex items-center gap-1 shadow-md">
                            <span>#{rank}</span>
                          </div>
                        ) : (
                          <div className="px-2 py-1 bg-[#0D0D0D]/90 border border-[#262626] text-[#FFF8E7] font-black text-xs font-mono">
                            <span>#{rank}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metadata Card Footer (Flat) */}
                    <div className="p-3.5 space-y-1 bg-[#151515] border-t border-[#262626]">
                      <h4 className="text-sm font-bold text-[#FFF8E7] line-clamp-1 group-hover:text-[#E31937] transition-colors">
                        {title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-[#A7A7A7] font-mono">
                        {item.vote_average && item.vote_average > 0 ? (
                          <span className="flex items-center gap-1 text-[#FFD106] font-bold">
                            ★ {item.vote_average.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[#A7A7A7]/70">Popular</span>
                        )}
                        {year && <span>{year}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── 3. EVERYTHING YOU NEED TO WATCH (FLAT CARDS) ─── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 border-t border-[#1f1f1f]">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-[#FFF8E7] tracking-tight leading-snug">
            Everything You Need to Watch
          </h2>
          <p className="text-[#A7A7A7] text-xs sm:text-base">
            All the tools you need for effortless, high-quality streaming.
          </p>
        </div>

        {/* 8 Flat Cards Grid (No Corner Radius) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Discover More */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-[#E31937]/10 border border-[#E31937]/30 flex items-center justify-center text-[#E31937]">
              <Film className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-[#E31937] transition-colors">
                Discover More
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Movies, TV series, anime, documentaries, and more—all organized in one place.
              </p>
            </div>
          </div>

          {/* Card 2: Find What You Want */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-blue-400 transition-colors">
                Find What You Want
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Search, filter, and discover something to watch by genre, year, rating, language, and more.
              </p>
            </div>
          </div>

          {/* Card 3: Know Where to Watch */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-emerald-400 transition-colors">
                Know Where to Watch
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Find out where movies and series are legally available across different streaming platforms and regions.
              </p>
            </div>
          </div>

          {/* Card 4: Just Press Play */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-[#FFD106]/10 border border-[#FFD106]/30 flex items-center justify-center text-[#FFD106]">
              <Popcorn className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-[#FFD106] transition-colors">
                Just Press Play
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Enjoy smooth streaming directly on the site with fast player loading and multiple server options.
              </p>
            </div>
          </div>

          {/* Card 5: Your Personal Library */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-purple-400 transition-colors">
                Your Personal Library
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Keep your watchlist, favorites, playlists, and watch history in one place.
              </p>
            </div>
          </div>

          {/* Card 6: Track Your Watching */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-[#FFD106]/10 border border-[#FFD106]/30 flex items-center justify-center text-[#FFD106]">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-[#FFD106] transition-colors">
                Track Your Watching
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                See your watch time, completed movies and episodes, earn XP, and unlock achievements.
              </p>
            </div>
          </div>

          {/* Card 7: Your Account, Your Way */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-cyan-400 transition-colors">
                Your Account, Your Way
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Create multiple profiles and watch simultaneously based on your subscription plan.
              </p>
            </div>
          </div>

          {/* Card 8: Try Before You Sign Up */}
          <div className="p-6 sm:p-7 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-4 group">
            <div className="h-12 w-12 bg-[#E31937]/10 border border-[#E31937]/30 flex items-center justify-center text-[#E31937]">
              <UserCheck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold font-heading text-[#FFF8E7] group-hover:text-[#E31937] transition-colors">
                Try Before You Sign Up
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                Browse Lantawon Nato and try guest viewing before creating an account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. SUBSCRIPTION PACKAGES & PRICING TIER (SINGLE PLAN, ADMIN-DRIVEN) ─── */}
      <section
        id="plans"
        className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10 border-t border-[#1f1f1f] scroll-mt-20"
      >
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          {expiredNotice && (
            <div className="p-4 mb-4 rounded-2xl bg-gradient-to-r from-[#E31937]/20 via-[#151515] to-[#E31937]/20 border border-[#E31937]/50 text-center max-w-xl mx-auto animate-in fade-in zoom-in-95">
              <div className="font-bold text-white text-sm">Guest Trial Ended on this Device</div>
              <p className="text-xs text-zinc-300 mt-1">
                Your 30-minute free trial has completed. Choose a subscription plan below to unlock unlimited streaming!
              </p>
            </div>
          )}
          {promoActive && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold animate-pulse">
              <Crown className="h-3.5 w-3.5" />
              <span>{promoText}{plan?.promo_expires_at ? ` — ENDS ${new Date(plan.promo_expires_at).toLocaleDateString()}` : ""}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E31937]/15 border border-[#E31937]/30 text-[#E31937] text-xs font-mono font-bold">
            <Crown className="h-3.5 w-3.5 text-[#FFD106]" />
            <span>LANTAWON SOLO PASS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-[#FFF8E7] tracking-tight leading-snug">
            Simple, All-Inclusive Membership
          </h2>
          <p className="text-[#A7A7A7] text-xs sm:text-base">
            One single plan with all premium features unlocked. Zero hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Single Premium Featured Solo Plan Card (Compact Netflix Spec Style) */}
        <div className="max-w-md mx-auto rounded-3xl p-3.5 sm:p-4.5 flex flex-col justify-between relative border bg-[#141414]/95 border-[#282828] shadow-[0_0_40px_rgba(227,25,55,0.2)] ring-1 ring-[#E31937]/50 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">

          {/* Top Gradient Header Box (Compact) */}
          <div className="rounded-xl p-3.5 sm:p-4 bg-gradient-to-br from-[#E31937] via-[#9e0c20] to-[#540611] text-white shadow-md relative overflow-hidden flex items-center justify-between border border-white/15">
            <div className="space-y-0.5 relative z-10">
              <h3 className="text-lg sm:text-xl font-black font-heading tracking-tight text-white drop-shadow-md">
                Solo Pass
              </h3>
              <p className="text-[11px] sm:text-xs text-white/85 font-medium">
                1080p Cinema Access
              </p>
            </div>

            <div className="h-7 w-7 rounded-full bg-white text-[#9e0c20] flex items-center justify-center shadow-md relative z-10 shrink-0">
              <Check className="h-4 w-4 stroke-[3]" />
            </div>

            {/* Subtle glow circle overlay in background */}
            <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full blur-lg pointer-events-none" />
          </div>

          {/* Promo badge strip when live */}
          {promoActive && (
            <div className="mx-1.5 sm:mx-2 -mt-1 flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/35 px-3 py-2">
              <span className="text-xs font-black text-emerald-400 tracking-wide uppercase">
                {promoText}
              </span>
              {plan?.promo_expires_at && (
                <span className="text-[10px] font-mono text-emerald-300/80">
                  ends {new Date(plan.promo_expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
          )}

          {/* Clean Segmented Specification Rows (Compact Divided Table Lines) */}
          <div className="space-y-0 text-left px-1.5 sm:px-2">
            {/* Row 1: Monthly Price — reflects the admin-set price + live promo */}
            <div className="py-2 border-b border-zinc-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">Monthly price</span>
              <div className="flex items-baseline gap-2">
                {promoActive && (
                  <span className="text-sm font-bold font-mono text-zinc-500 line-through">₱{planPrice}</span>
                )}
                <div className="text-xl sm:text-2xl font-black font-mono tracking-tight flex items-baseline gap-0.5">
                  <span className={`text-xs font-bold ${promoActive ? "text-emerald-400" : "text-[#E31937]"}`}>₱</span>
                  <span className={promoActive ? "text-emerald-400" : "text-white"}>
                    {promoPrice ?? planPrice}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Video and sound quality */}
            <div className="py-2 border-b border-zinc-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">Video and sound quality</span>
              <span className="text-xs sm:text-[13px] font-bold text-white text-right">
                Great
              </span>
            </div>

            {/* Row 3: Resolution */}
            <div className="py-2 border-b border-zinc-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">Resolution</span>
              <span className="text-xs sm:text-[13px] font-bold text-white text-right">
                1080p (Full HD)
              </span>
            </div>

            {/* Row 4: Supported devices */}
            <div className="py-2 border-b border-zinc-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">Supported devices</span>
              <span className="text-xs sm:text-[13px] font-bold text-white text-right">
                Mobile, Tablet, Desktop, TV
              </span>
            </div>

            {/* Row 5: Devices you can watch at the same time */}
            <div className="py-2 border-b border-zinc-800/80 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">
                Devices you can watch at the same time
              </span>
              <span className="text-xs sm:text-[13px] font-bold text-white text-right">
                1
              </span>
            </div>

            {/* Row 6: Ad Experience */}
            <div className="py-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-zinc-400">Ad experience</span>
              <span className="text-xs sm:text-[13px] font-bold text-emerald-400 text-right">
                100% Ad-free
              </span>
            </div>
          </div>

          {/* Bottom Action Button — price always mirrors the live plan/promo */}
          <Link
            href="/signup"
            onClick={() => audioFX.playClick()}
            className="w-full py-3 rounded-xl bg-[#E31937] hover:bg-[#ff1f3d] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-[#E31937]/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>
              Get Solo Pass{promoActive && promoPrice != null ? ` — ₱${promoPrice} / mo` : ` — ₱${planPrice} / mo`}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ─── 5. FREQUENTLY ASKED QUESTIONS ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10 border-t border-[#1f1f1f]">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-center text-[#FFF8E7] tracking-tight leading-snug">
          Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#151515]/90 border border-[#262626] overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-bold text-base sm:text-lg text-[#FFF8E7] hover:text-[#E31937] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <Minus className="h-5 w-5 text-[#E31937] shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-[#A7A7A7] shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-[#A7A7A7] leading-relaxed border-t border-[#262626] pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── 6. GOOD TO KNOW (FLAT CARDS) ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 border-t border-[#1f1f1f]">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-[#FFF8E7] tracking-tight leading-snug">
            Good to Know
          </h2>
          <p className="text-[#A7A7A7] text-xs sm:text-base">
            A few things to keep in mind when using Lantawon Nato.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {goodToKnow.map((item, idx) => (
            <div
              key={idx}
              className="p-6 bg-[#151515] border border-[#262626] hover:border-[#383838] transition-all space-y-3"
            >
              <div className="h-10 w-10 bg-[#0D0D0D] border border-[#262626] flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="text-base font-bold text-[#FFF8E7] font-heading">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#A7A7A7] leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 7. WHY CHOOSE LANTAWON ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-[#1f1f1f]">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#1c1c1c]/90 via-[#151515] to-[#0D0D0D] border border-[#262626] space-y-4 shadow-2xl relative overflow-hidden">
          <Quote className="h-10 w-10 text-[#E31937]/40 mx-auto" />
          <h3 className="text-xl sm:text-3xl font-black font-heading text-[#FFF8E7] max-w-2xl mx-auto leading-relaxed">
            “Lantawon Nato isn&apos;t just about having more movies. It&apos;s about making it easier to find something worth watching.”
          </h3>
          <div className="pt-2">
            <Link
              href="/signup"
              onClick={() => audioFX.playClick()}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#E31937] hover:bg-[#c4122d] text-[#FFF8E7] font-bold text-sm sm:text-base transition-all shadow-lg hover:shadow-[#E31937]/40 cursor-pointer"
            >
              <span>Sign Up Now</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 8. FOOTER ─── */}
      <footer className="py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))] px-4 sm:px-6 lg:px-8 border-t border-[#1f1f1f] text-[#A7A7A7] text-xs text-center">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
          <span className="text-[#FFF8E7] font-black">LANTAWON NATO</span>
          <span>&copy; 2026. All rights reserved.</span>
        </div>
      </footer>

      {/* ─── TRENDING PREVIEW MODAL ─── */}
      {selectedModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 sm:p-4 sm:backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              audioFX.playClick();
              setSelectedModalItem(null);
            }
          }}
        >
          {/* Modal Container: Fullscreen on Mobile (no outer gap), Centered Card on Desktop */}
          <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-xl bg-[#151515] border-0 sm:border border-[#262626] sm:rounded-3xl overflow-y-auto flex flex-col justify-between shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                audioFX.playClick();
                setSelectedModalItem(null);
              }}
              aria-label="Close modal"
              className="absolute top-4 right-4 z-30 h-10 w-10 rounded-full bg-[#0D0D0D]/80 hover:bg-[#0D0D0D] text-[#FFF8E7] flex items-center justify-center backdrop-blur-md border border-[#FFF8E7]/15 transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              {/* Backdrop / Header Image */}
              <div className="relative aspect-video sm:aspect-[16/9] w-full overflow-hidden bg-[#0D0D0D]">
                <Image
                  src={
                    selectedModalItem.backdrop_path
                      ? `${TMDB_IMAGE_CONFIG.BACKDROP_BASE}${selectedModalItem.backdrop_path}`
                      : selectedModalItem.poster_path
                      ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${selectedModalItem.poster_path}`
                      : TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP
                  }
                  alt={selectedModalItem.title || selectedModalItem.name || "Title"}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-[#151515]/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#151515]/50 via-transparent to-transparent hidden sm:block" />
              </div>

              {/* Modal Content */}
              <div className="p-6 sm:p-8 space-y-4 -mt-6 sm:-mt-10 relative z-10">
                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-black font-heading text-[#FFF8E7] tracking-tight leading-tight">
                  {selectedModalItem.title || selectedModalItem.name || "Untitled"}
                </h3>

                {/* Badges / Metadata */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  {(selectedModalItem.release_date || selectedModalItem.first_air_date) && (
                    <span className="px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#262626] text-[#A7A7A7] font-bold">
                      {(selectedModalItem.release_date || selectedModalItem.first_air_date || "").split("-")[0]}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#262626] text-[#A7A7A7] font-bold">
                    {selectedModalItem.media_type === "tv" || !selectedModalItem.title ? "TV Series" : "Movie"}
                  </span>
                  {selectedModalItem.vote_average && selectedModalItem.vote_average > 0 && (
                    <span className="px-2.5 py-1 rounded-md bg-[#FFD106]/15 border border-[#FFD106]/30 text-[#FFD106] font-bold">
                      ★ {selectedModalItem.vote_average.toFixed(1)}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md bg-[#E31937]/20 border border-[#E31937]/30 text-[#E31937] font-bold">
                    Ultra HD
                  </span>

                  {/* Genres */}
                  {selectedModalItem.genre_ids &&
                    selectedModalItem.genre_ids.slice(0, 3).map((gId) => (
                      <span
                        key={gId}
                        className="px-2.5 py-1 rounded-md bg-[#0D0D0D] border border-[#262626] text-[#A7A7A7] font-sans text-[11px]"
                      >
                        {GENRE_MAP[gId] || "Drama"}
                      </span>
                    ))}
                </div>

                {/* Synopsis Overview */}
                <p className="text-sm sm:text-base text-[#A7A7A7] leading-relaxed pt-1">
                  {selectedModalItem.overview ||
                    "Stream this title and thousands more on Lantawon Nato with high-speed playback, multiple mirrors, and full HD quality."}
                </p>
              </div>
            </div>

            {/* Modal Bottom CTA */}
            <div className="p-6 sm:p-8 pt-0 pb-8 sm:pb-8">
              <Link
                href="/signup"
                onClick={() => {
                  audioFX.playClick();
                  setSelectedModalItem(null);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#E31937] hover:bg-[#c4122d] text-[#FFF8E7] font-bold text-sm sm:text-base transition-all shadow-xl shadow-[#E31937]/40 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                <span>Sign Up to Watch Full Movie</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
