"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Play,
  Zap,
  Trophy,
  CheckCircle2,
  Info,
  X,
  Trash2,
  Sparkles,
  Crown,
  MessageSquare,
  DollarSign,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { audioFX } from "@/lib/audio/audio-fx";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType =
  | "welcome"
  | "subscription"
  | "support_reply"
  | "refund_update"
  | "payment_update"
  | "admin_alert"
  | "milestone"
  | "data_guard"
  | "continue_watching"
  | "system"
  | "achievement";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  actionUrl?: string;
}

const ICON_MAP: Record<NotifType, React.ReactNode> = {
  welcome: <Sparkles className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />,
  subscription: <Crown className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />,
  support_reply: <MessageSquare className="h-3.5 w-3.5 text-blue-400" />,
  refund_update: <DollarSign className="h-3.5 w-3.5 text-emerald-400" />,
  payment_update: <CreditCard className="h-3.5 w-3.5 text-purple-400" />,
  admin_alert: <AlertCircle className="h-3.5 w-3.5 text-rose-400" />,
  milestone: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  data_guard: <Zap className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />,
  continue_watching: <Play className="h-3.5 w-3.5 text-[#E50914] fill-[#E50914]" />,
  system: <Info className="h-3.5 w-3.5 text-blue-400" />,
  achievement: <Trophy className="h-3.5 w-3.5 text-yellow-400" />,
};

const BG_MAP: Record<NotifType, string> = {
  welcome: "bg-amber-500/10 border-amber-500/25",
  subscription: "bg-yellow-500/10 border-yellow-500/25",
  support_reply: "bg-blue-500/10 border-blue-500/25",
  refund_update: "bg-emerald-500/10 border-emerald-500/25",
  payment_update: "bg-purple-500/10 border-purple-500/25",
  admin_alert: "bg-rose-500/10 border-rose-500/25",
  milestone: "bg-emerald-500/10 border-emerald-500/25",
  data_guard: "bg-cyan-500/10 border-cyan-500/25",
  continue_watching: "bg-[#E50914]/10 border-[#E50914]/25",
  system: "bg-blue-500/10 border-blue-500/25",
  achievement: "bg-yellow-500/10 border-yellow-500/25",
};

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STORAGE_PREFIX = "lantawon_user_notifs_v4_";
const INIT_PREFIX = "lantawon_user_notifs_init_v4_";
const DISMISSED_PREFIX = "lantawon_dismissed_notifs_v4_";

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationsDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}

export function NotificationsDropdown({
  isOpen,
  onClose,
  dropdownRef,
}: NotificationsDropdownProps) {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const userId = user?.id || "guest_session";
  const userStorageKey = `${STORAGE_PREFIX}${userId}`;
  const userInitKey = `${INIT_PREFIX}${userId}`;
  const userDismissedKey = `${DISMISSED_PREFIX}${userId}`;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  const getDismissedSet = (): Set<string> => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(userDismissedKey);
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set();
  };

  const addDismissedId = (id: string) => {
    if (typeof window === "undefined") return;
    try {
      const set = getDismissedSet();
      set.add(id);
      localStorage.setItem(userDismissedKey, JSON.stringify(Array.from(set)));
    } catch {}
  };

  // Helper to persist list to localStorage
  const persistNotifications = (items: Notification[]) => {
    setNotifications(items);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(userStorageKey, JSON.stringify(items));
      } catch {}
    }
  };

  // Load and build live dynamic communications notifications
  useEffect(() => {
    if (!isOpen) return;

    const loadNotifications = async () => {
      let currentItems: Notification[] = [];
      const dismissed = getDismissedSet();
      const isInitialized = typeof window !== "undefined" ? localStorage.getItem(userInitKey) : null;

      try {
        const stored = localStorage.getItem(userStorageKey);
        if (stored) {
          currentItems = JSON.parse(stored);
        }
      } catch {}

      // ── 1. Welcome & Initial VIP Notice ──────────────────────────────────
      if (!isInitialized) {
        const initialList: Notification[] = [];
        const displayName = profile?.displayName || user?.email?.split("@")[0] || "User";

        const welcomeId = `welcome_${userId}`;
        if (!dismissed.has(welcomeId)) {
          initialList.push({
            id: welcomeId,
            type: "welcome",
            title: "Welcome to Lantawon Lang! 🍿",
            body: `Hi ${displayName}! Your account is active. Explore 10,000+ movies & series in HD.`,
            timestamp: Date.now() - 1000 * 60 * 2,
            isRead: false,
            actionUrl: "/home",
          });
        }

        if (user?.tier === "solo" || profile?.tier === "solo") {
          const subId = `sub_${userId}`;
          if (!dismissed.has(subId)) {
            initialList.push({
              id: subId,
              type: "subscription",
              title: "VIP Solo Pass Active 👑",
              body: "Your subscription is active with zero limits and priority mirror access.",
              timestamp: Date.now() - 1000 * 60 * 1,
              isRead: false,
              actionUrl: "/account",
            });
          }
        }

        currentItems = [...initialList, ...currentItems];
        if (typeof window !== "undefined") {
          localStorage.setItem(userInitKey, "true");
        }
      }

      // ── 2. Live Supabase Communications (Support, Refunds, Payments) ────────
      if (user?.isLoggedIn && user.id && supabase) {
        try {
          if (!isAdmin) {
            // USER VIEW: Support Replies
            const { data: userTickets } = await supabase
              .from("support_tickets")
              .select("id, ticket_number, subject, status, updated_at")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(5);

            if (userTickets && userTickets.length > 0) {
              const ticketIds = userTickets.map((t) => t.id);
              const { data: adminReplies } = await supabase
                .from("support_messages")
                .select("id, ticket_id, message, created_at, sender_user_id")
                .in("ticket_id", ticketIds)
                .neq("sender_user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(5);

              if (adminReplies) {
                for (const reply of adminReplies) {
                  const notifId = `reply_${reply.id}`;
                  if (!dismissed.has(notifId) && !currentItems.some((n) => n.id === notifId)) {
                    const ticket = userTickets.find((t) => t.id === reply.ticket_id);
                    currentItems.unshift({
                      id: notifId,
                      type: "support_reply",
                      title: "Support Reply Received 💬",
                      body: `${ticket?.subject || "Ticket"}: "${reply.message.slice(0, 80)}"`,
                      timestamp: new Date(reply.created_at).getTime(),
                      isRead: false,
                      actionUrl: "/account/support",
                    });
                  }
                }
              }
            }

            // USER VIEW: Refund Request Updates
            const { data: refundReqs } = await supabase
              .from("refund_requests")
              .select("id, status, reason, admin_notes, updated_at")
              .eq("user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(3);

            if (refundReqs) {
              for (const req of refundReqs) {
                const notifId = `refund_${req.id}_${req.status}`;
                if (req.status !== "pending" && !dismissed.has(notifId) && !currentItems.some((n) => n.id === notifId)) {
                  currentItems.unshift({
                    id: notifId,
                    type: "refund_update",
                    title: req.status === "approved" ? "Refund Request Approved 💰" : "Refund Request Update ℹ️",
                    body: `Your refund request is ${req.status}. ${req.admin_notes || ""}`,
                    timestamp: new Date(req.updated_at || Date.now()).getTime(),
                    isRead: false,
                    actionUrl: "/account",
                  });
                }
              }
            }

            // USER VIEW: Payment Submissions Verification Updates
            const { data: payments } = await supabase
              .from("payment_submissions")
              .select("id, status, rejection_reason, updated_at")
              .eq("submitted_by_user_id", user.id)
              .order("updated_at", { ascending: false })
              .limit(3);

            if (payments) {
              for (const p of payments) {
                const notifId = `pay_${p.id}_${p.status}`;
                if (p.status !== "pending" && !dismissed.has(notifId) && !currentItems.some((n) => n.id === notifId)) {
                  currentItems.unshift({
                    id: notifId,
                    type: "payment_update",
                    title: p.status === "approved" ? "Payment Approved ✅" : "Payment Update ⚠️",
                    body: p.status === "approved"
                      ? "Your subscription payment was verified and approved!"
                      : `Payment requires review: ${p.rejection_reason || "Check reference details."}`,
                    timestamp: new Date(p.updated_at || Date.now()).getTime(),
                    isRead: false,
                    actionUrl: "/account",
                  });
                }
              }
            }
          } else {
            // ADMIN VIEW: New Tickets, Pending Payments & Refunds
            const { data: pendingTickets } = await supabase
              .from("support_tickets")
              .select("id, ticket_number, subject, created_at")
              .eq("status", "open")
              .order("created_at", { ascending: false })
              .limit(3);

            if (pendingTickets) {
              for (const t of pendingTickets) {
                const notifId = `admin_ticket_${t.id}`;
                if (!dismissed.has(notifId) && !currentItems.some((n) => n.id === notifId)) {
                  currentItems.unshift({
                    id: notifId,
                    type: "admin_alert",
                    title: "New Support Ticket 🎫",
                    body: `#${t.ticket_number}: ${t.subject}`,
                    timestamp: new Date(t.created_at).getTime(),
                    isRead: false,
                    actionUrl: "/admin",
                  });
                }
              }
            }

            const { data: pendingPayments } = await supabase
              .from("payment_submissions")
              .select("id, amount_php, created_at")
              .eq("status", "pending")
              .order("created_at", { ascending: false })
              .limit(3);

            if (pendingPayments) {
              for (const p of pendingPayments) {
                const notifId = `admin_pay_${p.id}`;
                if (!dismissed.has(notifId) && !currentItems.some((n) => n.id === notifId)) {
                  currentItems.unshift({
                    id: notifId,
                    type: "admin_alert",
                    title: "New Payment For Review 💳",
                    body: `Submitted payment of ₱${p.amount_php} awaiting review`,
                    timestamp: new Date(p.created_at).getTime(),
                    isRead: false,
                    actionUrl: "/admin",
                  });
                }
              }
            }
          }
        } catch {}
      }

      // Check for dynamic continue watching triggers
      try {
        const history = await db.watchHistory
          .orderBy("lastWatchedAt")
          .reverse()
          .limit(2)
          .toArray();

        for (const h of history) {
          const notifId = `continue_${h.id}`;
          if (!dismissed.has(notifId) && !currentItems.some((n) => n.id === notifId)) {
            if ((h.percentage ?? 0) > 5 && (h.percentage ?? 0) < 90) {
              currentItems.unshift({
                id: notifId,
                type: "continue_watching",
                title: "Resume Watching",
                body: `Resume "${h.title}" — ${h.percentage ?? 0}% completed`,
                timestamp: new Date(h.lastWatchedAt).getTime(),
                isRead: false,
                actionUrl: `/watch/${h.mediaId}?type=${h.mediaType}&season=${h.season || 1}&episode=${h.episode || 1}`,
              });
            }
          }
        }
      } catch {}

      // Filter out any dismissed IDs and sort desc
      const filtered = currentItems
        .filter((item) => !dismissed.has(item.id))
        .sort((a, b) => b.timestamp - a.timestamp);

      persistNotifications(filtered);
      setIsLoaded(true);

      // Auto-mark all as read after viewing
      setTimeout(() => {
        setNotifications((prev) => {
          const updated = prev.map((n) => ({ ...n, isRead: true }));
          try {
            localStorage.setItem(userStorageKey, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }, 1500);
    };

    loadNotifications();
  }, [isOpen, userId, isAdmin, profile?.displayName, user?.tier, profile?.tier]);

  const handleNotifClick = (notif: Notification) => {
    audioFX.playClick();
    if (notif.actionUrl) {
      onClose();
      router.push(notif.actionUrl);
    }
  };

  // Remove a single specific notification by ID with X
  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    audioFX.playPop();
    addDismissedId(id);
    const nextList = notifications.filter((n) => n.id !== id);
    persistNotifications(nextList);
  };

  // Clear all notifications permanently
  const handleClearAll = () => {
    audioFX.playPop();
    notifications.forEach((n) => addDismissedId(n.id));
    persistNotifications([]);
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#141414] border border-zinc-800 shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#161616]">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-300" />
          <span className="text-sm font-bold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] font-bold font-mono">
              {unreadCount}
            </span>
          )}
        </div>

        {notifications.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-[11px] font-semibold text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-zinc-800/60">
        {!isLoaded ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Bell className="h-8 w-8 text-zinc-700 mx-auto" />
            <div className="text-xs font-medium text-zinc-500">No notifications</div>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`relative flex gap-3 px-4 py-3.5 transition-colors group ${
                notif.actionUrl ? "cursor-pointer hover:bg-zinc-900" : "cursor-default"
              } ${!notif.isRead ? "bg-white/[0.03]" : ""}`}
            >
              {/* Icon bubble */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${BG_MAP[notif.type] || "bg-zinc-800 border-zinc-700"}`}
              >
                {ICON_MAP[notif.type] || <Info className="h-3.5 w-3.5 text-zinc-400" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5 pr-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-white leading-tight truncate">
                    {notif.title}
                  </span>
                  {!notif.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E50914] shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                  {notif.body}
                </p>
                <span className="text-[10px] text-zinc-500 font-mono inline-block pt-0.5">
                  {timeAgo(notif.timestamp)}
                </span>
              </div>

              {/* Remove item button (X) */}
              <button
                type="button"
                onClick={(e) => handleDismiss(notif.id, e)}
                title="Remove notification"
                aria-label="Remove notification"
                className="absolute top-3 right-3 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 opacity-70 group-hover:opacity-100 transition-all cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-500 text-center bg-[#111]">
        Notifications are live and synchronized with your account
      </div>
    </div>
  );
}

// ─── Bell Button Trigger ──────────────────────────────────────────────────────

export function NotificationsBell({
  onOpenLibrary: _onOpenLibrary,
}: {
  onOpenLibrary?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const userId = user?.id || "guest_session";
  const userStorageKey = `${STORAGE_PREFIX}${userId}`;

  // Check unread state from storage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(userStorageKey);
        if (stored) {
          const list: Notification[] = JSON.parse(stored);
          setHasUnread(list.some((n) => !n.isRead));
        } else {
          setHasUnread(true);
        }
      } catch {}
    }
  }, [userStorageKey]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    audioFX.playPop();
    setIsOpen((p) => !p);
    if (!isOpen) setHasUnread(false);
  };

  return (
    <div ref={buttonRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#242526] hover:bg-[#3a3b3c] flex items-center justify-center text-zinc-300 hover:text-white transition-all relative cursor-pointer border border-zinc-700/80 shrink-0"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#E50914] rounded-full ring-2 ring-[#141414] animate-pulse" />
        )}
      </button>

      <NotificationsDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        dropdownRef={dropdownRef}
      />
    </div>
  );
}
