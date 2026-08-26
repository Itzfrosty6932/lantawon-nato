"use client";

import Link from "next/link";
import { ArrowRight, Play, Film } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import type { SubscriptionPackage } from "@/lib/services/subscription-service";

export function HeroCTA() {
  const { user } = useAuth();

  return (
    <>
      <Link
        href="/home"
        onClick={() => audioFX.playClick()}
        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-2xl hover:shadow-[#E50914]/40"
      >
        <Play className="h-5 w-5" />
        Browse Catalog
        <ArrowRight className="h-5 w-5" />
      </Link>
      {!user && (
        <Link
          href="/signup"
          onClick={() => audioFX.playClick()}
          className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-[#E50914]/50 text-white font-bold text-lg transition-colors"
        >
          Sign Up Free
        </Link>
      )}
    </>
  );
}

export function PricingCTA({
  packageData,
  isPopular,
}: {
  packageData: SubscriptionPackage;
  isPopular: boolean;
}) {
  const { user } = useAuth();

  return (
    <Link
      href={user ? "/account/subscription" : "/signup"}
      onClick={() => audioFX.playClick()}
      className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 ${
        isPopular
          ? "bg-[#E50914] hover:bg-[#b80710] text-white shadow-lg"
          : "bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white"
      }`}
    >
      Kunin ang {packageData.name}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

export function FinalCTA() {
  const { user } = useAuth();

  return (
    <>
      <Link
        href={user ? "/home" : "/signup"}
        onClick={() => audioFX.playClick()}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-lg transition-all shadow-2xl hover:shadow-[#E50914]/40"
      >
        <Film className="h-5 w-5" />
        {user ? "Magsimula Manood" : "Libre ang Signup"}
        <ArrowRight className="h-5 w-5" />
      </Link>
      <Link
        href="/home"
        onClick={() => audioFX.playClick()}
        className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-lg transition-colors"
      >
        Tingnan Muna as Guest
      </Link>
    </>
  );
}
