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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      showToast(`❌ Failed to load packages: ${error.message}`, "error");
    } else {
      setPackages(data || []);
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
        ? // datetime-local expects "YYYY-MM-DDTHH:mm"
          new Date(pkg.promo_expires_at).toISOString().slice(0, 16)
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
      showToast("⚠️ Please fill in all required fields", "error");
      return;
    }
    if (promoPercent && (parseInt(promoPercent) < 1 || parseInt(promoPercent) > 100)) {
      showToast("⚠️ Promo discount must be between 1 and 100 percent", "error");
      return;
    }

    setSubmitting(true);
    audioFX.playClick();

    try {
      // Promo is cleared when the discount field is emptied or expiry passes.
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

      // NOTE: no client-side audit_logs INSERT — migration 14 removed the
      // public INSERT policy; audit rows are written server-side only.

      showToast("✅ Plan updated — landing page reflects it instantly", "success");
      setShowEditorFalse();
      loadPackages();
    } catch (error: any) {
      console.error("Error saving package:", JSON.stringify(error));
      showToast(`❌ ${error.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const setShowEditorFalse = () => {
    setEditingPackage(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Subscription</h2>
          <p className="text-sm text-zinc-400 mt-1">
            The plan your members buy — same one shown on the landing page and /pricing
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm">
          <p className="text-blue-300 font-bold">Single-plan platform</p>
          <p className="text-blue-200/80">
            Lantawon sells ONE subscription (Solo Pass). Editing it here updates the
            landing page hero card, the pricing page, and checkout immediately. Set a
            promo discount with an expiry date to run a sale — when the clock runs out,
            the promo disappears everywhere on its own.
          </p>
        </div>
      </div>

      {/* Packages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-zinc-950 border border-zinc-800">
          <Package className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-bold mb-2">No Plans</h3>
          <p className="text-sm text-zinc-400">Run migrations to seed the Solo Pass plan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => {
            const promoLive = isPromoLive(pkg);
            const promoPrice = promoLive
              ? Math.round(pkg.price_php * (1 - (pkg.promo_percent ?? 0) / 100))
              : null;
            return (
              <div
                key={pkg.id}
                className={`rounded-2xl p-6 border ${
                  pkg.is_active
                    ? "bg-zinc-950 border-zinc-800"
                    : "bg-zinc-950/50 border-zinc-800/50 opacity-60"
                } space-y-4`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                      {!pkg.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold">
                          Inactive
                        </span>
                      )}
                      {promoLive && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {pkg.promo_label || `${pkg.promo_percent}% OFF`} · LIVE
                        </span>
                      )}
                      {pkg.promo_percent != null && !promoLive && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Promo expired
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 font-mono uppercase">Code: {pkg.code}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {promoLive ? (
                    <>
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm text-zinc-500 line-through">
                          ₱{pkg.price_php.toFixed(0)}
                        </span>
                        <span className="text-3xl font-black text-emerald-400">
                          ₱{promoPrice}
                          <span className="text-sm text-zinc-400">/month</span>
                        </span>
                      </div>
                      {pkg.promo_expires_at && (
                        <div className="text-xs text-emerald-300/80 font-mono flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          Ends {new Date(pkg.promo_expires_at).toLocaleString()}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl font-black text-white">
                      ₱{pkg.price_php.toFixed(0)}
                      <span className="text-sm text-zinc-400">/month</span>
                    </div>
                  )}

                  <div className="text-sm text-zinc-400">
                    {pkg.max_concurrent_sessions} concurrent{" "}
                    {pkg.max_concurrent_sessions === 1 ? "session" : "sessions"}
                  </div>

                  {pkg.description && (
                    <p className="text-xs text-zinc-500 leading-relaxed">{pkg.description}</p>
                  )}
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <button
                    onClick={() => openEditor(pkg)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Plan &amp; Promo
                  </button>
                </div>

                <div className="text-xs text-zinc-600">
                  Created {new Date(pkg.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Edit {editingPackage.name}</h3>
              <button
                onClick={setShowEditorFalse}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Solo Pass"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">
                    Price (PHP) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={pricePhp}
                    onChange={(e) => setPricePhp(e.target.value)}
                    placeholder="349"
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">
                    Concurrent Sessions <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={sessions}
                    onChange={(e) => setSessions(e.target.value)}
                    placeholder="1"
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">Status</label>
                  <div className="flex items-center gap-2 h-[42px]">
                    <input
                      type="checkbox"
                      id="active"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="active" className="text-sm cursor-pointer">
                      Active (visible to users)
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shown under the price on the landing page..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none resize-none h-20"
                />
              </div>

              {/* PROMO SECTION */}
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-4">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <Tag className="h-4 w-4" />
                  Promo Discount
                </div>
                <p className="text-xs text-zinc-400 -mt-2">
                  Leave the discount empty for normal pricing. When set, every public
                  surface shows a strikethrough price, the promo badge, and this expiry.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">Discount (%)</label>
                    <input
                      type="number"
                      value={promoPercent}
                      onChange={(e) => setPromoPercent(e.target.value)}
                      placeholder="e.g. 20 = 20% off"
                      min="1"
                      max="100"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold">Expires At</label>
                    <input
                      type="datetime-local"
                      value={promoExpiresAt}
                      onChange={(e) => setPromoExpiresAt(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white [color-scheme:dark] focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">Promo Label</label>
                  <input
                    type="text"
                    value={promoLabel}
                    onChange={(e) => setPromoLabel(e.target.value)}
                    placeholder='e.g. "Launch Promo" (defaults to "20% OFF")'
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Live preview */}
              {promoPercent && parseInt(promoPercent) >= 1 && parseInt(promoPercent) <= 100 && (
                <div className="rounded-xl border border-dashed border-zinc-700 p-4 text-sm space-y-1">
                  <p className="text-xs font-mono uppercase text-zinc-500 mb-2">Preview</p>
                  <div className="flex items-baseline gap-2">
                    <span className="line-through text-zinc-500">₱{pricePhp || "?"}</span>
                    <span className="text-xl font-black text-emerald-400">
                      ₱{(parseFloat(pricePhp) * (1 - parseInt(promoPercent) / 100)).toFixed(0)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black">
                      {promoLabel.trim() || `${promoPercent}% OFF`}
                    </span>
                  </div>
                  {promoExpiresAt && (
                    <p className="text-xs text-zinc-500 font-mono">
                      ends {new Date(promoExpiresAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting || !name || !pricePhp || !sessions}
                className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
