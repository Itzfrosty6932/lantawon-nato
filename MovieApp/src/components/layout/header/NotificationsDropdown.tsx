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
} from "lucide-react";
import { db } from "@/lib/db/dexie-db";
import { audioFX } from "@/lib/audio/audio-fx";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type NotifType = "milestone" | "data_guard" | "continue_watching" | "system" | "achievement";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
  actionUrl?: string;
  meta?: Record<string, string | number>;
}

// ─── Static fallback notifications (generated from local DB state) ────────────

const SYSTEM_NOTIFS: Notification[] = [
  {
    id: "sys_offline_ready",
    type: "system",
    title: "Offline Cache Ready",
    body: "Lantawon is ready for offline browsing. Your catalog is cached locally.",
    timestamp: Date.now() - 1000 * 60 * 15,
    isRead: false,
  },
  {
    id: "sys_data_guard",
    type: "data_guard",
    title: "Data Saver Auto-Enabled",
    body: "Cellular network detected. Stream Data Saver was activated to save bandwidth.",
    timestamp: Date.now() - 1000 * 60 * 45,
    isRead: false,
  },
  {
    id: "ach_first_watch",
    type: "achievement",
    title: "Achievement Unlocked 🏆",
    body: "First Screening — You watched your first title on Lantawon!",
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    isRead: true,
    actionUrl: "/achievements",
  },
];

const ICON_MAP: Record<NotifType, React.ReactNode> = {
  milestone: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  data_guard: <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />,
  continue_watching: <Play className="h-3.5 w-3.5 text-[#E50914] fill-[#E50914]" />,
  system: <Info className="h-3.5 w-3.5 text-blue-400" />,
  achievement: <Trophy className="h-3.5 w-3.5 text-yellow-400" />,
};

const BG_MAP: Record<NotifType, string> = {
  milestone: "bg-emerald-500/10 border-emerald-500/20",
  data_guard: "bg-amber-500/10 border-amber-500/20",
  continue_watching: "bg-[#E50914]/10 border-[#E50914]/20",
  system: "bg-blue-500/10 border-blue-500/20",
  achievement: "bg-yellow-500/10 border-yellow-500/20",
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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Build dynamic notifications from IndexedDB on open
  useEffect(() => {
    if (!isOpen) return;

    const buildNotifications = async () => {
      const dynamic: Notification[] = [];

      try {
        // Continue watching
        const history = await db.watchHistory
          .orderBy("lastWatchedAt")
          .reverse()
          .limit(2)
          .toArray();

        for (const h of history) {
          if ((h.percentage ?? 0) > 5 && (h.percentage ?? 0) < 95) {
            dynamic.push({
              id: `continue_${h.id}`,
              type: "continue_watching",
              title: "Continue Watching",
              body: `Resume "${h.title}" — ${h.percentage ?? 0}% watched`,
              timestamp: new Date(h.lastWatchedAt).getTime(),
              isRead: false,
              actionUrl: `/watch/${h.mediaId}?type=${h.mediaType}&season=${h.season || 1}&episode=${h.episode || 1}`,
            });
          }
        }

        // Watch milestone
        const total = await db.watchHistory.count();
        const milestones = [10, 25, 50, 100, 200, 500];
        const hit = milestones.find((m) => total >= m && total < m + 5);
        if (hit) {
          dynamic.push({
            id: `milestone_${hit}`,
            type: "milestone",
            title: "Watch Milestone 🎉",
            body: `You've watched ${hit}+ titles on Lantawon! Keep going!`,
            timestamp: Date.now() - 1000 * 60 * 30,
            isRead: false,
            actionUrl: "/statistics",
          });
        }
      } catch {}

      // Merge dynamic + static, sort by timestamp desc
      const all = [...dynamic, ...SYSTEM_NOTIFS].sort(
        (a, b) => b.timestamp - a.timestamp
      );

      setNotifications(all);
      setIsLoaded(true);

      // Mark all as read after 2s
      setTimeout(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
          localStorage.setItem("lantawon_notif_last_read", String(Date.now()));
        } catch {}
      }, 2000);
    };

    buildNotifications();
  }, [isOpen]);

  const handleNotifClick = (notif: Notification) => {
    audioFX.playClick();
    if (notif.actionUrl) {
      onClose();
      router.push(notif.actionUrl);
    }
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    audioFX.playPop();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    audioFX.playPop();
    setNotifications([]);
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-3 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#141414] border border-zinc-800 shadow-2xl z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-zinc-300" />
          <span className="text-sm font-bold text-white">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#E50914] text-white text-[10px] font-bold font-mono">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={handleClearAll}
          className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" /> Clear all
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-800/60">
        {!isLoaded ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Bell className="h-8 w-8 text-zinc-700 mx-auto" />
            <div className="text-xs text-zinc-500">No notifications</div>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotifClick(notif)}
              className={`relative flex gap-3 px-4 py-3 transition-colors group ${
                notif.actionUrl ? "cursor-pointer hover:bg-zinc-900" : "cursor-default"
              } ${!notif.isRead ? "bg-white/[0.02]" : ""}`}
            >
              {/* Icon bubble */}
              <div
                className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${BG_MAP[notif.type]}`}
              >
                {ICON_MAP[notif.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-white leading-tight">
                    {notif.title}
                  </span>
                  {!notif.isRead && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E50914] shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                  {notif.body}
                </p>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {timeAgo(notif.timestamp)}
                </span>
              </div>

              {/* Dismiss */}
              <button
                onClick={(e) => handleDismiss(notif.id, e)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-600 hover:text-zinc-300 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-zinc-800 text-[10px] text-zinc-600 text-center">
        Notifications are local-first and private to your device
      </div>
    </div>
  );
}

// ─── Bell Button (self-contained trigger wrapper) ─────────────────────────────

export function NotificationsBell({
  onOpenLibrary: _onOpenLibrary,
}: {
  onOpenLibrary?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

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
