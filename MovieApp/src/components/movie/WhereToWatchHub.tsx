"use client";

import React, { useEffect, useState } from "react";
import {
  Tv,
  ExternalLink,
  Globe,
  Sparkles,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

interface ProviderItem {
  id: number;
  name: string;
  logoUrl: string;
  category: "free" | "flatrate" | "buy" | "rent";
}

interface WhereToWatchProps {
  mediaId: string | number;
  mediaType: "movie" | "tv";
  title?: string;
}

export function WhereToWatchHub({
  mediaId,
  mediaType,
}: WhereToWatchProps) {
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState("US");

  const [freeProviders, setFreeProviders] = useState<ProviderItem[]>([]);
  const [subscriptionProviders, setSubscriptionProviders] = useState<ProviderItem[]>([]);
  const [buyRentProviders, setBuyRentProviders] = useState<ProviderItem[]>([]);
  const [justWatchLink, setJustWatchLink] = useState<string | null>(null);
  const [hasProviders, setHasProviders] = useState(false);

  useEffect(() => {
    let mounted = true;

    const uniqueProviders = (providers: ProviderItem[] = []) => {
      const seen = new Set<string>();

      return providers.filter((provider) => {
        const key = `${provider.id}-${provider.name}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
    };

    const loadProviders = async () => {
      if (!mediaId || String(mediaId).startsWith("local_")) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(
          `/api/providers/title?id=${encodeURIComponent(
            String(mediaId)
          )}&type=${mediaType}&region=${selectedRegion}`
        );

        if (!response.ok) {
          throw new Error(`Provider request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!mounted) return;

        const free = uniqueProviders(
          Array.isArray(data.free) ? data.free : []
        );

        const subscription = uniqueProviders(
          Array.isArray(data.flatrate) ? data.flatrate : []
        );

        const buyRent = uniqueProviders([
          ...(Array.isArray(data.buy) ? data.buy : []),
          ...(Array.isArray(data.rent) ? data.rent : []),
        ]);

        setFreeProviders(free);
        setSubscriptionProviders(subscription);
        setBuyRentProviders(buyRent);

        setJustWatchLink(
          typeof data.justWatchLink === "string"
            ? data.justWatchLink
            : null
        );

        setHasProviders(
          free.length > 0 ||
            subscription.length > 0 ||
            buyRent.length > 0
        );
      } catch (error) {
        console.error("Failed to load streaming providers:", error);

        if (mounted) {
          setFreeProviders([]);
          setSubscriptionProviders([]);
          setBuyRentProviders([]);
          setJustWatchLink(null);
          setHasProviders(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProviders();

    return () => {
      mounted = false;
    };
  }, [mediaId, mediaType, selectedRegion]);

  if (loading) {
    return (
      <section className="rounded-2xl bg-[#18191a] p-4 border border-white/[0.08] animate-pulse space-y-3">
        <div className="h-4 w-48 bg-white/10 rounded" />
        <div className="flex gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/10" />
          <div className="h-12 w-12 rounded-xl bg-white/10" />
          <div className="h-12 w-12 rounded-xl bg-white/10" />
        </div>
      </section>
    );
  }

  if (!hasProviders) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-[#18191a] p-4.5 space-y-3.5 border border-zinc-800/80">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Tv className="h-4 w-4 text-zinc-400" />

          <h3 className="font-heading text-sm font-bold text-white">
            Where to Stream
          </h3>

          {freeProviders.length > 0 && (
            <span className="rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              Free Option Available
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-300 bg-[#242526] border border-zinc-700/80 rounded-xl px-2.5 py-1">
            <Globe className="h-3 w-3 text-zinc-400" />

            <select
              value={selectedRegion}
              onChange={(e) => {
                audioFX.playClick();
                setSelectedRegion(e.target.value);
              }}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              {["US", "PH", "GB", "CA", "AU", "DE", "FR", "JP", "IN"].map(
                (region) => (
                  <option
                    key={region}
                    value={region}
                    className="bg-[#242526] text-white"
                  >
                    {region} Region
                  </option>
                )
              )}
            </select>
          </div>

          {justWatchLink && (
            <a
              href={justWatchLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => audioFX.playClick()}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors px-2 py-1"
              title="View on JustWatch"
            >
              <span>JustWatch</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {freeProviders.length > 0 && (
          <div className="rounded-xl bg-[#242526] border border-zinc-700/80 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Free Streaming (With Ads)
              </span>

              <span className="text-[10px] font-mono text-zinc-400">
                {freeProviders.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {freeProviders.map((provider) => (
                <div
                  key={`free-${provider.id}-${provider.name}`}
                  className="flex items-center gap-2 rounded-lg bg-[#18191a] border border-zinc-700/80 px-2.5 py-1.5 shadow-sm hover:border-zinc-500 transition-all cursor-pointer group"
                  title={`${provider.name} (Free)`}
                >
                  <img
                    src={provider.logoUrl}
                    alt={provider.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="h-5 w-5 rounded object-cover"
                  />

                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {provider.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {subscriptionProviders.length > 0 && (
          <div className="rounded-xl bg-[#242526] border border-zinc-700/80 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-zinc-400" />
                Subscription (SVOD)
              </span>

              <span className="text-[10px] font-mono text-zinc-400">
                {subscriptionProviders.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {subscriptionProviders.map((provider) => (
                <div
                  key={`subscription-${provider.id}-${provider.name}`}
                  className="flex items-center gap-2 rounded-lg bg-[#18191a] border border-zinc-700/80 px-2.5 py-1.5 shadow-sm hover:border-zinc-500 transition-all cursor-pointer group"
                  title={`${provider.name} (Subscription)`}
                >
                  <img
                    src={provider.logoUrl}
                    alt={provider.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="h-5 w-5 rounded object-cover"
                  />

                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {provider.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {buyRentProviders.length > 0 && (
          <div className="rounded-xl bg-[#242526] border border-zinc-700/80 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Tv className="h-3 w-3 text-zinc-400" />
                Purchase &amp; Rental
              </span>

              <span className="text-[10px] font-mono text-zinc-400">
                {buyRentProviders.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {buyRentProviders.slice(0, 6).map((provider) => (
                <div
                  key={`buy-rent-${provider.id}-${provider.name}`}
                  className="flex items-center gap-2 rounded-lg bg-[#18191a] border border-zinc-700/80 px-2.5 py-1.5 shadow-sm hover:border-zinc-500 transition-all cursor-pointer group"
                  title={`${provider.name} (Rent/Buy)`}
                >
                  <img
                    src={provider.logoUrl}
                    alt={provider.name}
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="h-5 w-5 rounded object-cover"
                  />

                  <span className="text-xs font-semibold text-zinc-200 group-hover:text-white">
                    {provider.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}