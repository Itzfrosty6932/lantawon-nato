"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { BrandLogo } from "@/components/brand/BrandLogo";

export function LandingHeader() {
  const { user } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <BrandLogo size="md" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a
            href="#catalog"
            onClick={(e) => {
              e.preventDefault();
              audioFX.playClick();
              document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Catalog
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              audioFX.playClick();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Features
          </a>
          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault();
              audioFX.playClick();
              document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Pricing
          </a>
          {user ? (
            <Link
              href="/account"
              onClick={() => audioFX.playClick()}
              className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#b80710] font-bold transition-colors"
            >
              My Account
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => audioFX.playClick()}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => audioFX.playClick()}
                className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#b80710] font-bold transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
