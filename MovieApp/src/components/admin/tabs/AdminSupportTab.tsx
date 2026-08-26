"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Loader2,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  X,
  Film,
  FileText,
  ImageIcon,
  KeyRound,
  Copy,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";
import {
  resolveAttachmentUrl,
  type TicketAttachment,
} from "@/lib/services/ticket-attachment";

interface SupportTicket {
  id: string;
  ticket_number: string;
  created_by_user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_user_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  attachments?: TicketAttachment[] | null;
}

const STATUSES = ["all", "open", "in_progress", "waiting", "resolved", "closed"];
const CATEGORIES = [
  "forgot_password",
  "account",
  "subscription",
  "payment",
  "playback",
  "technical",
  "bug_report",
  "content",
  "other",
];

export function AdminSupportTab() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selected ticket
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Reply
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isInternal, setIsInternal] = useState(false);

  // Status change
  const [changingStatus, setChangingStatus] = useState(false);

  // Temp password issuance (forgot_password flow)
  const [issuingReset, setIssuingReset] = useState(false);
  // One-time display: { password, email } — cleared when dismissed.
  const [issuedPassword, setIssuedPassword] = useState<{
    password: string;
    email?: string;
  } | null>(null);

  // Resolved signed URLs for attachment paths (admins hold SELECT on the bucket).
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTickets();
  }, [filter]);

  useEffect(() => {
    const paths = messages
      .flatMap((m) => m.attachments ?? [])
      .map((a) => a.path)
      .filter((p) => p && !resolvedUrls[p]);
    if (paths.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const p of paths) {
        const url = await resolveAttachmentUrl(p);
        if (url) next[p] = url;
      }
      if (!cancelled && Object.keys(next).length > 0) {
        setResolvedUrls((prev) => ({ ...prev, ...next }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, resolvedUrls]);

  const loadTickets = async () => {
    setLoading(true);

    let query = supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading tickets:", JSON.stringify(error));
      showToast(`❌ Failed to load tickets: ${error.message}`, "error");
    } else {
      setTickets(data || []);
    }

    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    setLoadingMessages(true);

    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data || []);
    }

    setLoadingMessages(false);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setSending(true);
    audioFX.playClick();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender_user_id: user.id,
        message: replyMessage,
        is_internal: isInternal,
      });

      if (error) throw error;

      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === "open") {
        await supabase
          .from("support_tickets")
          .update({
            status: "in_progress",
            assigned_to: user.id,
          })
          .eq("id", selectedTicket.id);
      }

      setReplyMessage("");
      setIsInternal(false);
      loadMessages(selectedTicket.id);
      loadTickets();
      showToast("✅ Reply sent", "success");
    } catch (error: any) {
      console.error("Error sending reply:", error);
      showToast(`❌ ${error.message}`, "error");
    } finally {
      setSending(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!selectedTicket) return;

    setChangingStatus(true);
    audioFX.playClick();

    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id);

      if (error) throw error;

      // NOTE: no client-side audit_logs INSERT here — migration 14 removed
      // the public INSERT policy; audit rows are written server-side only.

      setSelectedTicket({ ...selectedTicket, status: newStatus });
      loadTickets();
      showToast(`✅ Status updated to ${newStatus}`, "success");
    } catch (error: any) {
      console.error("Error updating status:", error);
      showToast(`❌ ${error.message}`, "error");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleIssueTempPassword = async () => {
    if (!selectedTicket?.created_by_user_id) return;
    if (
      !window.confirm(
        `Issue a temporary password for ${selectedTicket.user_email || "this user"}?\n\n` +
          "Their current password will be replaced. You must send the new one to them via Gmail/chat."
      )
    ) {
      return;
    }

    setIssuingReset(true);
    audioFX.playClick();

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedTicket.created_by_user_id,
          ticketId: selectedTicket.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        showToast(`❌ ${data.error || "Failed to issue temp password."}`, "error");
        return;
      }
      setIssuedPassword({
        password: data.tempPassword,
        email: selectedTicket.user_email,
      });
      loadTickets();
    } catch (error: any) {
      console.error("Error issuing temp password:", error);
      showToast(`❌ ${error.message}`, "error");
    } finally {
      setIssuingReset(false);
    }
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    waiting: tickets.filter((t) => t.status === "waiting").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "waiting":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "closed":
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
      default:
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-white">Support Tickets</h2>
        <p className="text-sm text-zinc-400 mt-1">Manage user support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-bold mb-1">
            <AlertCircle className="h-4 w-4" />
            Open
          </div>
          <div className="text-2xl font-black text-white">{stats.open}</div>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-center gap-2 text-amber-400 text-sm font-bold mb-1">
            <Clock className="h-4 w-4" />
            In Progress
          </div>
          <div className="text-2xl font-black text-white">{stats.in_progress}</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-bold mb-1">
            <User className="h-4 w-4" />
            Waiting
          </div>
          <div className="text-2xl font-black text-white">{stats.waiting}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mb-1">
            <CheckCircle2 className="h-4 w-4" />
            Resolved
          </div>
          <div className="text-2xl font-black text-white">{stats.resolved}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 text-sm focus:border-[#E50914] focus:outline-none"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                audioFX.playClick();
                setFilter(s);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${
                filter === s
                  ? "bg-[#E50914] text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => {
                audioFX.playClick();
                setSelectedTicket(ticket);
                loadMessages(ticket.id);
              }}
              className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-zinc-500">
                      {ticket.ticket_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status.toUpperCase().replace("_", " ")}
                    </span>
                    <span className="text-xs text-zinc-500 capitalize">
                      {ticket.category.replace("_", " ")}
                    </span>
                  </div>

                  <h3 className="font-bold">{ticket.subject}</h3>

                  <div className="text-xs text-zinc-500">
                    {ticket.user_email} • Created{" "}
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>

                <MessageSquare className="h-5 w-5 text-zinc-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-4xl rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-zinc-800">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono text-zinc-500">
                      {selectedTicket.ticket_number}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(
                        selectedTicket.status
                      )}`}
                    >
                      {selectedTicket.status.toUpperCase().replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{selectedTicket.subject}</h3>
                  <p className="text-xs text-zinc-500">
                    {selectedTicket.user_email} •{" "}
                    {selectedTicket.category.replace("_", " ")} •
                    Created {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Issue temp password — forgot_password tickets only */}
                  {selectedTicket.category === "forgot_password" &&
                    !["resolved", "closed"].includes(selectedTicket.status) && (
                      <button
                        onClick={handleIssueTempPassword}
                        disabled={issuingReset}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        title="Generate a temporary password for this user"
                      >
                        {issuingReset ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <KeyRound className="h-3.5 w-3.5" />
                        )}
                        Issue Temp Password
                      </button>
                    )}

                  {/* Status change dropdown */}
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleChangeStatus(e.target.value)}
                    disabled={changingStatus}
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white text-xs font-bold focus:border-[#E50914] focus:outline-none"
                  >
                    {STATUSES.filter((s) => s !== "all").map((status) => (
                      <option key={status} value={status}>
                        {status.toUpperCase().replace("_", " ")}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setMessages([]);
                    }}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">No messages</div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.sender_user_id === selectedTicket.created_by_user_id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          isUser
                            ? "bg-zinc-900 text-zinc-100"
                            : msg.is_internal
                            ? "bg-amber-500/20 border border-amber-500/30 text-amber-100"
                            : "bg-[#E50914] text-white"
                        }`}
                      >
                        {msg.is_internal && (
                          <div className="text-xs text-amber-400 font-bold mb-1">
                            🔒 Internal Note
                          </div>
                        )}
                        {msg.message && (
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        )}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att) => {
                              const url = resolvedUrls[att.path];
                              const isImage = att.mime?.startsWith("image/");
                              const Icon = isImage
                                ? ImageIcon
                                : att.mime?.startsWith("video/")
                                ? Film
                                : FileText;
                              return (
                                <a
                                  key={att.path}
                                  href={url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => {
                                    if (!url) e.preventDefault();
                                  }}
                                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-black/25 hover:bg-black/40 border border-white/10 text-xs font-bold transition-colors max-w-[200px]"
                                  title={att.name}
                                >
                                  {isImage && url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={url}
                                      alt={att.name}
                                      className="h-8 w-8 rounded object-cover shrink-0"
                                    />
                                  ) : (
                                    <Icon className="h-4 w-4 shrink-0" />
                                  )}
                                  <span className="truncate">{att.name}</span>
                                </a>
                              );
                            })}
                          </div>
                        )}
                        <p className="text-xs mt-2 opacity-70">
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply Input */}
            <div className="p-6 border-t border-zinc-800 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="internal"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="internal" className="text-xs text-zinc-400 cursor-pointer">
                  Internal note (not visible to user)
                </label>
              </div>

              <div className="flex gap-3">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none resize-none h-20"
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyMessage.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 text-white font-bold transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      Send
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Temp Password Modal — shown ONCE, never stored */}
      {issuedPassword && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-amber-500/40 p-6 space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <KeyRound className="h-5 w-5" />
                Temporary Password Issued
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Send this to{" "}
                <span className="text-white font-bold">{issuedPassword.email || "the member"}</span>{" "}
                via Gmail/chat. <span className="text-amber-300 font-bold">It is shown only once</span>{" "}
                — copy it now.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-zinc-700 flex items-center justify-between gap-3">
              <code className="text-lg font-mono font-bold text-emerald-400 break-all select-all">
                {issuedPassword.password}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(issuedPassword.password).catch(() => {});
                  showToast("📋 Temp password copied", "success");
                }}
                className="shrink-0 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>

            <button
              onClick={() => setIssuedPassword(null)}
              className="w-full py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm transition-colors"
            >
              Done — I&apos;ve copied it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
