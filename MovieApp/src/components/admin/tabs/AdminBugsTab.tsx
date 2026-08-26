"use client";

import React, { useState, useEffect } from "react";
import {
  Bug,
  Plus,
  Trash2,
  Edit,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface BugRecord {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "wontfix";
  category: string;
  affected_files: string[];
  resolution?: string;
  resolved_at?: string;
  created_at: string;
}

export function AdminBugsTab() {
  const { showToast } = useToast();
  const [bugs, setBugs] = useState<BugRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium" as const,
    status: "open" as const,
    category: "",
    resolution: "",
  });

  useEffect(() => {
    loadBugs();
  }, []);

  const loadBugs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bugs");
      if (res.ok) {
        const data = await res.json();
        setBugs(data.bugs || []);
      }
    } catch (err) {
      console.error("Error loading bugs:", err);
      showToast("Failed to load bugs", "error");
    }
    setLoading(false);
  };

  const handleSaveBug = async () => {
    if (!formData.title || !formData.category) {
      showToast("Title and category required", "error");
      return;
    }

    try {
      const res = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast("Bug created", "success");
        setShowNewForm(false);
        setFormData({
          title: "",
          description: "",
          severity: "medium",
          status: "open",
          category: "",
          resolution: "",
        });
        await loadBugs();
      }
    } catch (err) {
      showToast("Failed to create bug", "error");
    }
  };

  const handleUpdateStatus = async (bugId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bugs?id=${bugId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast("Bug updated", "success");
        await loadBugs();
      }
    } catch (err) {
      showToast("Failed to update bug", "error");
    }
  };

  const handleDeleteBug = async (bugId: string) => {
    if (!confirm("Delete this bug record?")) return;

    try {
      const res = await fetch(`/api/bugs?id=${bugId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Bug deleted", "success");
        await loadBugs();
      }
    } catch (err) {
      showToast("Failed to delete bug", "error");
    }
  };

  const severityColor = {
    low: "text-blue-400",
    medium: "text-yellow-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };

  const statusBgColor = {
    open: "bg-red-500/20",
    in_progress: "bg-yellow-500/20",
    resolved: "bg-green-500/20",
    wontfix: "bg-gray-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bug className="w-6 h-6" />
            Bug Tracker
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Track and manage bugs found during development
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#E50914] hover:bg-red-600 text-white rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          New Bug
        </button>
      </div>

      {/* New Bug Form */}
      {showNewForm && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 space-y-4">
          <input
            type="text"
            placeholder="Bug title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-4 py-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder:text-gray-500"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-4 py-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder:text-gray-500 h-20"
          />
          <div className="grid grid-cols-3 gap-4">
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  severity: e.target.value as any,
                })
              }
              className="px-4 py-2 rounded bg-neutral-800 border border-neutral-700 text-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as any,
                })
              }
              className="px-4 py-2 rounded bg-neutral-800 border border-neutral-700 text-white"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="wontfix">Won't Fix</option>
            </select>
            <input
              type="text"
              placeholder="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="px-4 py-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveBug}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
            >
              Save
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bugs List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#E50914]" />
        </div>
      ) : bugs.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No bugs tracked yet
        </div>
      ) : (
        <div className="space-y-4">
          {bugs.map((bug) => (
            <div
              key={bug.id}
              className={`p-4 rounded-lg border transition ${
                statusBgColor[bug.status]
              } border-gray-700`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{bug.title}</h3>
                    <span
                      className={`text-xs font-bold uppercase ${
                        severityColor[bug.severity]
                      }`}
                    >
                      {bug.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3">
                    {bug.description}
                  </p>
                  {bug.resolution && (
                    <p className="text-sm text-green-300 mb-2">
                      ✓ {bug.resolution}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{bug.category}</span>
                    <span>•</span>
                    <span>{new Date(bug.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    value={bug.status}
                    onChange={(e) => handleUpdateStatus(bug.id, e.target.value)}
                    className="px-3 py-1 bg-neutral-800 border border-neutral-700 text-white text-sm rounded"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="wontfix">Won't Fix</option>
                  </select>
                  <button
                    onClick={() => handleDeleteBug(bug.id)}
                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
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
