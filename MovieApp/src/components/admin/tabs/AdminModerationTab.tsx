"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";

interface ModerationTicket {
  id: string;
  title: string;
  category: "broken_stream" | "missing_subtitles" | "wrong_metadata" | "advisory_dispute";
  reportedBy: string;
  createdAt: string;
  status: "open" | "resolved";
  details: string;
}

const INITIAL_TICKETS: ModerationTicket[] = [
  {
    id: "rep_1",
    title: "Dune: Part Two",
    category: "broken_stream",
    reportedBy: "User_841",
    createdAt: "22m ago",
    status: "open",
    details: "Mirror #6 returned 502 Bad Gateway during 1080p stream playback.",
  },
  {
    id: "rep_2",
    title: "Jujutsu Kaisen: Season 2",
    category: "missing_subtitles",
    reportedBy: "User_190",
    createdAt: "1h ago",
    status: "open",
    details: "English subtitle track is out of sync by 2.4 seconds on Episode 14.",
  },
  {
    id: "rep_3",
    title: "The Batman",
    category: "wrong_metadata",
    reportedBy: "Editor_Elena",
    createdAt: "3h ago",
    status: "resolved",
    details: "Director tag was missing Matt Reeves in credit graph → resolved.",
  },
];

export function AdminModerationTab() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<ModerationTicket[]>(INITIAL_TICKETS);

  const handleResolve = (id: string) => {
    audioFX.playPop();
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "resolved" } : t))
    );
    showToast("Ticket marked as Resolved", "success");
  };

  const handleDelete = (id: string) => {
    audioFX.playPop();
    setTickets((prev) => prev.filter((t) => t.id !== id));
    showToast("Ticket deleted", "info");
  };

  const openCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white font-heading">
            Content Moderation &amp; User Incident Reports
          </h3>
          <p className="text-xs text-zinc-400">
            Review user-reported playback issues, missing subtitle tracks, and advisory disputes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
            {openCount} Open Tickets
          </span>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {tickets.map((t) => {
          const isOpen = t.status === "open";
          return (
            <div
              key={t.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                isOpen
                  ? "bg-zinc-900/90 border-zinc-800/80"
                  : "bg-zinc-950/60 border-zinc-900 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-white">{t.title}</h4>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-300">
                      {t.category.replace("_", " ").toUpperCase()}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        isOpen
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">{t.details}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isOpen && (
                    <button
                      onClick={() => handleResolve(t.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Resolve</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete ticket"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-800/60">
                <span>Reported by: {t.reportedBy}</span>
                <span>{t.createdAt}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
