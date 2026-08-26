"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  CreditCard,
  Shield,
  Monitor,
  MessageSquare,
  BarChart2,
  Trophy,
  Settings,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

const ACCOUNT_NAV = [
  { href: "/account", label: "Overview", icon: User, exact: true },
  { href: "/account/subscription", label: "Subscription", icon: CreditCard },
  { href: "/account/devices", label: "Devices", icon: Monitor },
  { href: "/account/support", label: "Support", icon: MessageSquare },
  { href: "/account/statistics", label: "Statistics", icon: BarChart2 },
  { href: "/account/achievements", label: "Achievements", icon: Trophy },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Account Header */}
      <div className="border-b border-zinc-900 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-heading">
              My Account
            </h1>
            <p className="text-sm text-zinc-400">
              Manage your subscription, devices, and settings
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-zinc-900 bg-zinc-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            {ACCOUNT_NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => audioFX.playClick()}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                    active
                      ? "text-white border-[#E50914]"
                      : "text-zinc-400 border-transparent hover:text-white hover:border-zinc-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">{children}</div>
    </div>
  );
}
