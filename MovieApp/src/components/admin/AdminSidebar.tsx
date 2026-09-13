"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Database,
  CreditCard,
  Package,
  MessageSquare,
  Undo2,
} from "lucide-react";

export type AdminTabId =
  | "overview"
  | "users"
  | "payments"
  | "subscriptions"
  | "refunds"
  | "support"
  | "audits";

interface NavItem {
  id: AdminTabId;
  label: string;
  icon: React.ReactNode;
}

export const NAV_GROUPS: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: "Overview",
    items: [
      { id: "overview", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    heading: "Finance & Billing",
    items: [
      { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
      { id: "refunds", label: "Refunds", icon: <Undo2 className="h-4 w-4" /> },
      { id: "subscriptions", label: "Plans & Promos", icon: <Package className="h-4 w-4" /> },
    ],
  },
  {
    heading: "Members",
    items: [
      { id: "users", label: "Users & Accounts", icon: <Users className="h-4 w-4" /> },
      { id: "support", label: "Support Tickets", icon: <MessageSquare className="h-4 w-4" /> },
    ],
  },
  {
    heading: "System",
    items: [
      { id: "audits", label: "Audit Logs", icon: <Database className="h-4 w-4" /> },
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
  open: boolean;
  onClose: () => void;
}

export function AdminSidebar({ activeTab, onSelectTab, open, onClose }: AdminSidebarProps) {
  const nav = (
    <nav className="p-3 select-none">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading} className="mb-5 last:mb-0">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {group.heading}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      onClose();
                    }}
                    className={`flex w-full items-center gap-3 rounded-full px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-white text-zinc-950 font-bold shadow-md"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className={isActive ? "text-zinc-950" : "text-zinc-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
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
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#121316]/90 backdrop-blur-xl lg:block overflow-y-auto">
        {nav}
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex lg:hidden animate-in fade-in duration-150"
        >
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-[#141518] border-r border-white/10 pt-4 pb-4 overflow-y-auto">
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
