"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Edit3,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";
import { SOLO_PASS_PRICE_PHP, withCanonicalPrice } from "@/lib/constants/pricing";

interface SubscriptionPackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_php: number;
  currency: string;
  billing_interval: string;
  max_concurrent_sessions: number;
  display_order: number;
  is_active: boolean;
  promo_percent: number | null;
  promo_label: string | null;
  promo_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const isPromoLive = (pkg: Pick<SubscriptionPackage, "promo_percent" | "promo_expires_at">) =>
  pkg.promo_percent != null &&
  (!pkg.promo_expires_at || new Date(pkg.promo_expires_at) > new Date());

export function AdminPackagesTab() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pricePhp, setPricePhp] = useState("");
  const [sessions, setSessions] = useState("");
  const [isActive, setIsActive] = useState(true);
  // Promo
  const [promoPercent, setPromoPercent] = useState("");
  const [promoLabel, setPromoLabel] = useState("");
  const [promoExpiresAt, setPromoExpiresAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("subscription_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error loading packages:", JSON.stringify(error));
      showToast(`Failed to load packages: ${error.message}`, "error");
    } else {
      setPackages((data || []).map(withCanonicalPrice));
    }

    setLoading(false);
  };

  const openEditor = (pkg: SubscriptionPackage) => {
    setEditingPackage(pkg);
    setName(pkg.name);
    setDescription(pkg.description || "");
    setPricePhp(pkg.price_php.toString());
    setSessions(pkg.max_concurrent_sessions.toString());
    setIsActive(pkg.is_active);
    setPromoPercent(pkg.promo_percent != null ? pkg.promo_percent.toString() : "");
    setPromoLabel(
      isPromoLive(pkg) && pkg.promo_label ? pkg.promo_label : ""
    );
    setPromoExpiresAt(
      isPromoLive(pkg) && pkg.promo_expires_at
        ? new Date(pkg.promo_expires_at).toISOString().slice(0, 16)
        : ""
    );
    audioFX.playClick();
  };

  const resetForm = () => {
    setEditingPackage(null);
    setName("");
    setDescription("");
    setPricePhp("");
    setSessions("");
    setIsActive(true);
    setPromoPercent("");
    setPromoLabel("");
    setPromoExpiresAt("");
  };

  const handleSubmit = async () => {
    if (!editingPackage || !name || !pricePhp || !sessions) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    if (promoPercent && (parseInt(promoPercent) < 1 || parseInt(promoPercent) > 100)) {
      showToast("Promo discount must be between 1 and 100 percent", "error");
      return;
    }

    setSubmitting(true);
    audioFX.playClick();

    try {
      const hasPromo = !!promoPercent;
      const packageData: Partial<SubscriptionPackage> = {
        name: name.trim(),
        description: description.trim() || null,
        price_php: parseFloat(pricePhp),
        currency: "PHP",
        billing_interval: "monthly",
        max_concurrent_sessions: parseInt(sessions),
        is_active: isActive,
        promo_percent: hasPromo ? parseInt(promoPercent) : null,
        promo_label: hasPromo && promoLabel.trim() ? promoLabel.trim() : null,
        promo_expires_at:
          hasPromo && promoExpiresAt ? new Date(promoExpiresAt).toISOString() : null,
      };

      const { error } = await supabase
        .from("subscription_packages")
        .update(packageData)
        .eq("id", editingPackage.id);

      if (error) throw error;

      audioFX.playSuccess();
      showToast("Plan & promo configuration updated live!", "success");
      resetForm();
      loadPackages();
    } catch (err: any) {
      showToast(err.message || "Failed to update package", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Package className="h-5 w-5 text-[#E50914]" />
          <span>Plans &amp; Live Promos</span>
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure subscription pricing and promotional discounts. Changes immediately sync across the Landing Page, Signup, and Checkout flows.
        </p>
      </div>

      {/* ── Package List Cards ── */}
      {loading ? (
        <div className="p-12 text-center text-zinc-400 flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
          <span className="text-xs font-semibold">Loading package configuration...</span>
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 text-xs">
          No active subscription packages found in database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => {
            const promoLive = isPromoLive(pkg);
            const promoPrice = promoLive && pkg.promo_percent
              ? (pkg.price_php * (1 - pkg.promo_percent / 100)).toFixed(0)
              : null;

            return (
              <div
                key={pkg.id}
                className="p-5 rounded-3xl bg-[#141518]/90 border border-white/10 shadow-xl space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{pkg.name}</span>
                      <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-white/5">
                        {pkg.code}
                      </span>
                    </h3>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {pkg.max_concurrent_sessions} active screen ({pkg.billing_interval})
                    </div>
                  </div>

                  {promoLive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                      <Sparkles className="h-3 w-3" />
                      {pkg.promo_label || `${pkg.promo_percent}% OFF`}
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="space-y-1">
                  {promoLive ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-zinc-500 line-through">₱{pkg.price_php}</span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">₱{promoPrice}</span>
                      <span className="text-xs text-zinc-400">/ month</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-white font-mono">₱{pkg.price_php}</span>
                      <span className="text-xs text-zinc-400">/ month</span>
                    </div>
                  )}

                  {promoLive && pkg.promo_expires_at && (
                    <div className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expires: {new Date(pkg.promo_expires_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {pkg.description && (
                  <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                    {pkg.description}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => openEditor(pkg)}
                  className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Configure Plan &amp; Promo</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingPackage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#141518] border border-white/15 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <Package className="h-5 w-5 text-[#E50914]" />
                <h3 className="text-base font-bold text-white">Configure {editingPackage.name}</h3>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="p-1 rounded-full text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">Plan Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-base sm:text-xs outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">Base Price (PHP)</label>
                  <input
                    type="number"
                    value={pricePhp}
                    onChange={(e) => setPricePhp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-base sm:text-xs outline-none focus:border-[#E50914]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">Max Screens</label>
                  <input
                    type="number"
                    value={sessions}
                    onChange={(e) => setSessions(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-base sm:text-xs outline-none focus:border-[#E50914]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-zinc-300">Visibility</label>
                  <div className="flex items-center gap-2 h-[38px]">
                    <input
                      type="checkbox"
                      id="pkg-active"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded accent-[#E50914]"
                    />
                    <label htmlFor="pkg-active" className="text-zinc-300 cursor-pointer">
                      Active for checkout
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-zinc-300">Plan Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-base sm:text-xs outline-none focus:border-[#E50914] resize-none"
                />
              </div>

              {/* Promo Section */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Tag className="h-4 w-4" />
                  <span>Promotional Discount</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Discount %</label>
                    <input
                      type="number"
                      value={promoPercent}
                      onChange={(e) => setPromoPercent(e.target.value)}
                      placeholder="e.g. 20"
                      min="1"
                      max="100"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-base sm:text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase">Promo Label</label>
                    <input
                      type="text"
                      value={promoLabel}
                      onChange={(e) => setPromoLabel(e.target.value)}
                      placeholder="e.g. 80% Launch Promo"
                      className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-base sm:text-xs outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase">Promo Expiration (Optional)</label>
                  <input
                    type="datetime-local"
                    value={promoExpiresAt}
                    onChange={(e) => setPromoExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/60 border border-white/10 text-white [color-scheme:dark] text-base sm:text-xs outline-none focus:border-emerald-400"
                  />
                </div>

                {promoPercent && parseInt(promoPercent) >= 1 && (
                  <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                    <span className="text-zinc-400">Effective Landing Price:</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      ₱{Math.round(parseFloat(pricePhp || "99") * (1 - parseInt(promoPercent) / 100))} PHP / month
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>{submitting ? "Saving..." : "Save Live Configuration"}</span>
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 font-semibold text-xs transition-colors"
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
