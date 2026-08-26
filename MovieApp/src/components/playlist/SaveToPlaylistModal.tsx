"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Check, ListPlus, Trash2, FolderPlus, Clock, Lock, Globe } from "lucide-react";
import { db, LantawonDatabase } from "@/lib/db/dexie-db";
import { useToast } from "@/components/ui/Toast";
import { audioFX } from "@/lib/audio/audio-fx";
import type { PlaylistRecord, PlaylistItem } from "@/types/storage";
import { GUEST_USER_ID } from "@/types/storage";

interface SaveToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string | number;
    title: string;
    mediaType?: "movie" | "tv" | "anime";
    posterPath?: string | null;
    year?: string;
    rating?: number;
  };
}

export function SaveToPlaylistModal({ isOpen, onClose, item }: SaveToPlaylistModalProps) {
  const { showToast } = useToast();
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const mediaId = String(item.id);
  const mediaType = item.mediaType || "movie";
  const title = item.title || "Untitled";
  const posterPath = item.posterPath || "";

  // Load playlists from Dexie DB
  const loadPlaylists = async () => {
    try {
      let list = await db.playlists.toArray();
      // Ensure default "Watch Later" exists
      const watchLaterKey = LantawonDatabase.playlistKey(GUEST_USER_ID, "watch_later");
      const watchLaterExists = list.some((p) => p.id === watchLaterKey);
      if (!watchLaterExists) {
        const defaultWatchLater: PlaylistRecord = {
          id: watchLaterKey,
          userId: GUEST_USER_ID,
          title: "Watch Later",
          description: "Default queue for saved movies & series",
          isSystem: true,
          itemCount: 0,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.playlists.put(defaultWatchLater);
        list = [defaultWatchLater, ...list];
      }
      setPlaylists(list);
    } catch (err) {
      console.error("Failed to load playlists", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
      setShowNewPlaylistForm(false);
      setNewTitle("");
      setNewDescription("");
    }
  }, [isOpen, mediaId]);

  if (!isOpen) return null;

  // Toggle item in playlist
  const handleTogglePlaylistItem = async (playlist: PlaylistRecord) => {
    audioFX.playClick();
    const exists = playlist.items.some((it) => it.id === mediaId);
    let updatedItems: PlaylistItem[];

    if (exists) {
      updatedItems = playlist.items.filter((it) => it.id !== mediaId);
      showToast(`Removed from "${playlist.title}"`, "info");
    } else {
      const newItem: PlaylistItem = {
        id: mediaId,
        mediaType,
        title,
        posterPath,
        year: item.year,
        rating: item.rating,
        addedAt: new Date().toISOString(),
      };
      updatedItems = [newItem, ...playlist.items];
      showToast(`Added to "${playlist.title}"`, "success");
    }

    const updatedPlaylist: PlaylistRecord = {
      ...playlist,
      items: updatedItems,
      itemCount: updatedItems.length,
      updatedAt: new Date().toISOString(),
    };

    await db.playlists.put(updatedPlaylist);
    setPlaylists((prev) => prev.map((p) => (p.id === playlist.id ? updatedPlaylist : p)));
  };

  // Create new playlist
  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      showToast("Please choose a title for your playlist", "info");
      return;
    }

    audioFX.playSuccess();
    const newId = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const initialItem: PlaylistItem = {
      id: mediaId,
      mediaType,
      title,
      posterPath,
      year: item.year,
      rating: item.rating,
      addedAt: new Date().toISOString(),
    };

    const newPlaylist: PlaylistRecord = {
      id: LantawonDatabase.playlistKey(GUEST_USER_ID, newId),
      userId: GUEST_USER_ID,
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      isSystem: false,
      itemCount: 1,
      items: [initialItem],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.playlists.put(newPlaylist);
    setPlaylists((prev) => [...prev, newPlaylist]);
    setNewTitle("");
    setNewDescription("");
    setShowNewPlaylistForm(false);
    showToast(`Created playlist "${newPlaylist.title}" and added title!`, "success");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-white/10 p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div className="flex items-center gap-2 text-white font-heading text-sm font-bold">
            <ListPlus className="h-4 w-4 text-[#E50914]" />
            <span>Save to Playlist</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Playlists Checkbox List */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {playlists.map((playlist) => {
            const isChecked = playlist.items.some((it) => it.id === mediaId);
            return (
              <label
                key={playlist.id}
                onClick={() => handleTogglePlaylistItem(playlist)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isChecked
                    ? "bg-[#E50914]/15 border-[#E50914]/40 text-white"
                    : "bg-zinc-900/60 border-white/[0.04] text-zinc-300 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className={`h-4 w-4 rounded flex items-center justify-center border transition-colors ${
                      isChecked
                        ? "bg-[#E50914] border-[#E50914] text-white"
                        : "border-zinc-600 bg-transparent"
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold truncate">{playlist.title}</span>
                </div>

                <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                  {playlist.itemCount} items
                </span>
              </label>
            );
          })}
        </div>

        {/* Create New Playlist Toggle */}
        {!showNewPlaylistForm ? (
          <button
            onClick={() => {
              audioFX.playClick();
              setShowNewPlaylistForm(true);
            }}
            className="w-full flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-[#E50914] hover:bg-[#E50914]/10 border border-dashed border-[#E50914]/30 transition-all justify-center"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create new playlist</span>
          </button>
        ) : (
          <form onSubmit={handleCreatePlaylist} className="space-y-2.5 pt-2 border-t border-white/[0.08]">
            <div>
              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                Choose a title
              </label>
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Favorite Marvel Movies, Anime Binge"
                className="w-full rounded-xl bg-zinc-900 border border-white/15 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Brief description..."
                className="w-full rounded-xl bg-zinc-900 border border-white/15 px-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#E50914]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-[#E50914] hover:bg-red-600 text-white font-bold text-xs py-2 transition-colors"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setShowNewPlaylistForm(false)}
                className="px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
