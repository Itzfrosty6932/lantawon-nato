"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ScrollText,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";

interface ChangelogEntry {
  id: string;
  version: string;
  title: string;
  body_md: string;
  category: "feature" | "fix" | "improvement" | "security" | "content";
  severity: "minor" | "major" | "critical";
  published_at: string;
  is_published: boolean;
}

const CATEGORIES: ChangelogEntry["category"][] = [
  "feature",
  "fix",
  "improvement",
  "security",
  "content",
];

const CATEGORY_STYLE: Record<ChangelogEntry["category"], string> = {
  feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  fix: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  improvement: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  security: "bg-red-500/15 text-red-400 border-red-500/30",
  content: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

const emptyDraft = {
  version: "",
  title: "",
  body_md: "",
  category: "improvement" as ChangelogEntry["category"],
  severity: "minor" as ChangelogEntry["severity"],
};

export function AdminChangelogTab() {
  const supabase = createClient();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    // RLS: admins see all rows via the manage policy.
    const { data, error } = await supabase
      .from("system_changelog")
      .select("*")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error loading changelog:", error);
      showToast("❌ Failed to load changelog entries", "error");
      setEntries([]);
    } else {
      setEntries((data || []) as unknown as ChangelogEntry[]);
    }
    setLoading(false);
  }, [supabase, showToast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const openCreate = () => {
    audioFX.playClick();
    setEditingId(null);
    setDraft(emptyDraft);
    setShowEditor(true);
  };

  const openEdit = (entry: ChangelogEntry) => {
    audioFX.playClick();
    setEditingId(entry.id);
    setDraft({
      version: entry.version,
      title: entry.title,
      body_md: entry.body_md,
      category: entry.category,
      severity: entry.severity,
    });
    setShowEditor(true);
  };

  const save = async () => {
    if (!draft.version.trim() || !draft.title.trim() || !draft.body_md.trim()) {
      showToast("⚠️ Version, title, and body are required.", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("system_changelog")
          .update({
            version: draft.version.trim(),
            title: draft.title.trim(),
            body_md: draft.body_md,
            category: draft.category,
            severity: draft.severity,
          })
          .eq("id", editingId);
        if (error) throw error;
        showToast("✅ Entry updated.", "success");
      } else {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase.from("system_changelog").insert({
          version: draft.version.trim(),
          title: draft.title.trim(),
          body_md: draft.body_md,
          category: draft.category,
          severity: draft.severity,
          is_published: false,
          published_by: userData.user?.id ?? null,
        });
        if (error) throw error;
        showToast("✅ Entry created as draft. Publish it when ready.", "success");
      }
      setShowEditor(false);
      setEditingId(null);
      setDraft(emptyDraft);
      loadEntries();
    } catch (err: unknown) {
      console.error(err);
      showToast(`❌ ${(err as Error).message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (entry: ChangelogEntry) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("system_changelog")
        .update({
          is_published: !entry.is_published,
          published_at: new Date().toISOString(),
          published_by: userData.user?.id ?? null,
        })
        .eq("id", entry.id);
      if (error) throw error;
      showToast(entry.is_published ? "Entry unpublished." : "🚀 Published to /changelog!", "success");
      audioFX.playSuccess();
      loadEntries();
    } catch (err: unknown) {
      showToast(`❌ ${(err as Error).message}`, "error");
    }
  };

  const remove = async (entry: ChangelogEntry) => {
    if (!window.confirm(`Delete "${entry.title}" permanently?`)) return;
    try {
      const { error } = await supabase.from("system_changelog").delete().eq("id", entry.id);
      if (error) throw error;
      showToast("Entry deleted.", "success");
      loadEntries();
    } catch (err: unknown) {
      showToast(`❌ ${(err as Error).message}`, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">System Updates Editor</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Entries publish to the public changelog page at{" "}
            <span className="font-mono text-zinc-300">/changelog</span>.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white text-sm font-bold transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Update
        </button>
      </div>

      {/* Editor */}
      {showEditor && (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">
              {editingId ? "Edit Update" : "New Update"}
            </h3>
            <button
              onClick={() => {
                setShowEditor(false);
                setEditingId(null);
              }}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={draft.version}
              onChange={(e) => setDraft({ ...draft, version: e.target.value })}
              placeholder="Version (e.g. 2.1.0)"
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
            />
            <select
              value={draft.category}
              onChange={(e) =>
                setDraft({ ...draft, category: e.target.value as ChangelogEntry["category"] })
              }
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#E50914] focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={draft.severity}
              onChange={(e) =>
                setDraft({ ...draft, severity: e.target.value as ChangelogEntry["severity"] })
              }
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm focus:border-[#E50914] focus:outline-none"
            >
              <option value="minor">MINOR</option>
              <option value="major">MAJOR</option>
              <option value="critical">CRITICAL</option>
            </select>
          </div>

          <input
            type="text"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Title — what changed?"
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none"
          />

          <textarea
            value={draft.body_md}
            onChange={(e) => setDraft({ ...draft, body_md: e.target.value })}
            placeholder={"Body (markdown supported):\n\n- Bullet point one\n- Bullet point two"}
            className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm placeholder:text-zinc-600 focus:border-[#E50914] focus:outline-none resize-y min-h-[140px] font-mono"
          />

          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#E50914] hover:bg-[#b80710] disabled:opacity-50 text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            {editingId ? "Save Changes" : "Create Draft"}
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          <ScrollText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No updates yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-xl bg-zinc-950 border p-4 ${
                entry.is_published ? "border-emerald-500/20" : "border-zinc-800"
              }`}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-zinc-300">
                      v{entry.version}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold uppercase ${CATEGORY_STYLE[entry.category]}`}
                    >
                      {entry.category}
                    </span>
                    {entry.severity !== "minor" && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                          entry.severity === "critical"
                            ? "bg-red-600/20 text-red-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`}
                      >
                        {entry.severity}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold font-mono ${
                        entry.is_published ? "text-emerald-400" : "text-zinc-500"
                      }`}
                    >
                      {entry.is_published ? "● PUBLISHED" : "○ DRAFT"}
                    </span>
                  </div>
                  <h4 className="font-bold text-white">{entry.title}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 whitespace-pre-wrap">
                    {entry.body_md}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => togglePublish(entry)}
                    title={entry.is_published ? "Unpublish" : "Publish"}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer border ${
                      entry.is_published
                        ? "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {entry.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(entry)}
                    title="Edit"
                    className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => remove(entry)}
                    title="Delete"
                    className="h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
