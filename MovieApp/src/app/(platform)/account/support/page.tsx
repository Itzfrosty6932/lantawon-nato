"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  X,
  Paperclip,
  ImageIcon,
  Film,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";
import {
  uploadTicketAttachment,
  resolveAttachmentUrl,
  type TicketAttachment,
} from "@/lib/services/ticket-attachment";

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
  is_internal: boolean;
  sender_email?: string;
  attachments?: TicketAttachment[] | null;
}

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-zinc-400" },
  { value: "normal", label: "Normal", color: "text-blue-400" },
  { value: "high", label: "High", color: "text-amber-400" },
  { value: "urgent", label: "Urgent", color: "text-red-400" },
];

const CATEGORIES = [
  { value: "forgot_password", label: "Forgot Password" },
  { value: "account", label: "Account Issue" },
  { value: "subscription", label: "Subscription" },
  { value: "payment", label: "Payment" },
  { value: "playback", label: "Playback Issue" },
  { value: "technical", label: "Technical Problem" },
  { value: "bug_report", label: "Bug Report" },
  { value: "content", label: "Content Information" },
  { value: "other", label: "Other" },
];

export default function SupportPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // New ticket form
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("other");
  const [priority, setPriority] = useState("normal");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [newAttachments, setNewAttachments] = useState<TicketAttachment[]>([]);

  // Reply
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<TicketAttachment[]>([]);

  // Shared attachment upload state + a cache of resolved signed URLs so
  // rendered thumbnails don't re-sign on every render.
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      loadTickets();
    }
  }, [user]);

  const loadTickets = async () => {
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("created_by_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading tickets:", error);
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
      .eq("is_internal", false)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
    } else {
      setMessages(data || []);
    }

    setLoadingMessages(false);
  };

  const handleAttachmentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "new" | "reply"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    audioFX.playClick();
    setUploadingAttachment(true);
    try {
      const uploaded: TicketAttachment[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadTicketAttachment(file, user.id);
        if (res.error) {
          showToast(`⚠️ ${file.name}: ${res.error}`, "error");
          continue;
        }
        if (res.attachment) uploaded.push(res.attachment);
      }
      if (uploaded.length > 0) {
        if (target === "new") setNewAttachments((prev) => [...prev, ...uploaded]);
        else setReplyAttachments((prev) => [...prev, ...uploaded]);
        showToast(`✅ ${uploaded.length} file(s) attached`, "success");
      }
    } finally {
      setUploadingAttachment(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  const removeAttachment = (target: "new" | "reply", path: string) => {
    if (target === "new") setNewAttachments((prev) => prev.filter((a) => a.path !== path));
    else setReplyAttachments((prev) => prev.filter((a) => a.path !== path));
  };

  // Resolve signed URLs for any attachment paths present in loaded messages.
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

  const handleCreateTicket = async () => {
    if (!subject.trim() || !message.trim()) {
      showToast("⚠️ Please fill in all fields", "error");
      return;
    }

    setSubmitting(true);
    audioFX.playClick();

    try {
      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          created_by_user_id: user?.id,
          subject: subject,
          category: category,
          status: "open",
          priority: priority,
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // Create first message (attachments persisted as JSONB storage paths)
      const { error: messageError } = await supabase
        .from("support_messages")
        .insert({
          ticket_id: ticket.id,
          sender_user_id: user?.id,
          message: message,
          is_internal: false,
          attachments: newAttachments, // JSONB NOT NULL DEFAULT '[]' — pass array
        });

      if (messageError) throw messageError;

      showToast("✅ Support ticket created!", "success");
      setShowNewTicket(false);
      setSubject("");
      setCategory("other");
      setPriority("normal");
      setMessage("");
      setNewAttachments([]);
      loadTickets();
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      showToast(`❌ ${error.message}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    if (!replyMessage.trim() && replyAttachments.length === 0) return;

    setSending(true);
    audioFX.playClick();

    try {
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: selectedTicket.id,
        sender_user_id: user?.id,
        message: replyMessage,
        is_internal: false,
        attachments: replyAttachments, // JSONB NOT NULL DEFAULT '[]' — pass array
      });

      if (error) throw error;

      // Update ticket status if closed
      if (selectedTicket.status === "resolved" || selectedTicket.status === "closed") {
        await supabase
          .from("support_tickets")
          .update({ status: "in_progress" })
          .eq("id", selectedTicket.id);
      }

      setReplyMessage("");
      setReplyAttachments([]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-8 px-4 sm:px-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black font-heading">Support</h1>
          <p className="text-sm text-zinc-400">Get help with your account and subscription</p>
        </div>

        <button
          onClick={() => {
            audioFX.playClick();
            setShowNewTicket(true);
          }}
          className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Ticket
        </button>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-zinc-950 border border-zinc-800">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 text-zinc-600" />
          <h3 className="text-lg font-bold mb-2">No Support Tickets</h3>
          <p className="text-sm text-zinc-400 mb-6">
            Create a ticket to get help from our support team
          </p>
          <button
            onClick={() => {
              audioFX.playClick();
              setShowNewTicket(true);
            }}
            className="px-6 py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold transition-colors"
          >
            Create Your First Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
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
                      {ticket.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {CATEGORIES.find((c) => c.value === ticket.category)?.label}
                    </span>
                    {ticket.priority && ticket.priority !== "normal" && (
                      <span
                        className={`text-[10px] font-mono font-bold uppercase ${
                          PRIORITIES.find((p) => p.value === ticket.priority)?.color ??
                          "text-zinc-400"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold">{ticket.subject}</h3>

                  <div className="text-xs text-zinc-500">
                    Created {new Date(ticket.created_at).toLocaleDateString()} •
                    Updated {new Date(ticket.updated_at).toLocaleString()}
                  </div>
                </div>

                <div className="text-zinc-400">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Create Support Ticket</h3>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:border-[#E50914] focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:border-[#E50914] focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please provide details about your issue..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none resize-none h-32"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center justify-between">
                  <span>Attachments (optional)</span>
                  <span className="text-[10px] font-mono text-zinc-500 font-normal">
                    Images ≤10MB • Video ≤25MB
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {newAttachments.map((att) => (
                    <AttachmentChip
                      key={att.path}
                      att={att}
                      onRemove={() => removeAttachment("new", att.path)}
                    />
                  ))}
                  <label
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border-2 border-dashed border-zinc-700 hover:border-[#E50914] cursor-pointer transition-colors text-xs font-bold text-zinc-300 ${
                      uploadingAttachment ? "opacity-60 pointer-events-none" : ""
                    }`}
                  >
                    {uploadingAttachment ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#E50914]" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                    <span>Attach files</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={(e) => handleAttachmentUpload(e, "new")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={handleCreateTicket}
                disabled={submitting || !subject.trim() || !message.trim() || uploadingAttachment}
                className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-5 w-5" />
                    Create Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col max-h-[90vh]">
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
                      {selectedTicket.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold">{selectedTicket.subject}</h3>
                  <p className="text-xs text-zinc-500">
                    {CATEGORIES.find((c) => c.value === selectedTicket.category)?.label} •
                    Created {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
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
                  const isUser = msg.sender_user_id === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          isUser
                            ? "bg-[#E50914] text-white"
                            : "bg-zinc-900 text-zinc-100"
                        }`}
                      >
                        {msg.message && (
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        )}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {msg.attachments.map((att) => {
                              const url = resolvedUrls[att.path];
                              const isImage = att.mime?.startsWith("image/");
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
                                  ) : att.mime?.startsWith("video/") ? (
                                    <Film className="h-4 w-4 shrink-0" />
                                  ) : (
                                    <FileText className="h-4 w-4 shrink-0" />
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
              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {replyAttachments.map((att) => (
                    <AttachmentChip
                      key={att.path}
                      att={att}
                      onRemove={() => removeAttachment("reply", att.path)}
                    />
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                <label
                  className={`shrink-0 h-11 w-11 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#E50914] flex items-center justify-center cursor-pointer transition-colors text-zinc-400 hover:text-white ${
                    uploadingAttachment ? "opacity-60 pointer-events-none" : ""
                  }`}
                  title="Attach image or video"
                >
                  {uploadingAttachment ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#E50914]" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(e) => handleAttachmentUpload(e, "reply")}
                    className="hidden"
                  />
                </label>
                <input
                  type="text"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Type your reply..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
                />
                <button
                  onClick={handleSendReply}
                  disabled={
                    sending ||
                    uploadingAttachment ||
                    (!replyMessage.trim() && replyAttachments.length === 0)
                  }
                  className="px-4 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 text-white font-bold transition-colors flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttachmentChip({
  att,
  onRemove,
}: {
  att: TicketAttachment;
  onRemove: () => void;
}) {
  const Icon = att.mime?.startsWith("image/")
    ? ImageIcon
    : att.mime?.startsWith("video/")
    ? Film
    : FileText;
  const sizeMb = (att.size / (1024 * 1024)).toFixed(1);
  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs max-w-[220px]">
      <Icon className="h-4 w-4 text-zinc-400 shrink-0" />
      <span className="truncate font-bold text-zinc-200" title={att.name}>
        {att.name}
      </span>
      <span className="text-[10px] font-mono text-zinc-500 shrink-0">{sizeMb}MB</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-zinc-500 hover:text-rose-400 shrink-0 cursor-pointer"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
