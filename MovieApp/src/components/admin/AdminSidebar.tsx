"use client";

import React from "react";
import {
  LayoutDashboard,
  Server,
  Users,
  Database,
  CreditCard,
  Package,
  MessageSquare,
  Undo2,
  Trophy,
  ScrollText,
  AlertCircle,
} from "lucide-react";

export type AdminTabId =
  | "overview"
  | "mirrors"
  | "users"
  | "payments"
  | "subscriptions"
  | "refunds"
  | "leaderboards"
  | "support"
  | "changelog"
  | "audits"
  | "bugs";

interface NavItem {
  id: AdminTabId;
  label: string;
  icon: React.ReactNode;
}

/**
 * Grouped in the order the work actually happens:
 * money comes in → members are managed → the platform is configured.
 */
export const NAV_GROUPS: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: "Overview",
    items: [
      { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    heading: "Money",
    items: [
      { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
      { id: "refunds", label: "Refunds", icon: <Undo2 className="h-4 w-4" /> },
      { id: "subscriptions", label: "Plan & Promo", icon: <Package className="h-4 w-4" /> },
    ],
  },
  {
    heading: "Members",
    items: [
      { id: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
      { id: "support", label: "Support", icon: <MessageSquare className="h-4 w-4" /> },
      { id: "leaderboards", label: "Leaderboards", icon: <Trophy className="h-4 w-4" /> },
    ],
  },
  {
    heading: "System",
    items: [
      { id: "mirrors", label: "Streaming", icon: <Server className="h-4 w-4" /> },
      { id: "changelog", label: "Updates", icon: <ScrollText className="h-4 w-4" /> },
      { id: "audits", label: "Audit Log", icon: <Database className="h-4 w-4" /> },
      { id: "bugs", label: "Bug Tracker", icon: <AlertCircle className="h-4 w-4" /> },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function tabLabel(id: AdminTabId): string {
  return ALL_ITEMS.find((i) => i.id === id)?.label ?? "Dashboard";
}

interface AdminSidebarProps {
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  /** Mobile drawer visibility. Desktop ignores this. */
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ activeTab, onSelectTab, open, onClose }: AdminSidebarProps) {
  const nav = (
    <nav className="p-2">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading} className="mb-4 last:mb-0">
          <p className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            {group.heading}
          </p>
          <ul>
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-800 font-medium text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <span className={isActive ? "text-[#E50914]" : "text-zinc-500"}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop: static column */}
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r border-zinc-800 bg-zinc-950 md:block">
        {nav}
      </aside>

      {/* Mobile: slide-over drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="absolute inset-0 h-full w-full bg-black/60"
          />
          <aside className="absolute left-0 top-0 h-full w-64 overflow-y-auto border-r border-zinc-800 bg-zinc-950">
            <div className="flex h-14 items-center border-b border-zinc-800 px-4 text-sm font-semibold text-white">
              Menu
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
