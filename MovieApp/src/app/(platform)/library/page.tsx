"use client";

import React, { useState, useEffect } from "react";
import {
  Bookmark,
  Heart,
  History,
  RotateCcw,
  ListPlus,
  Plus,
  Trash2,
} from "lucide-react";
import { db, LantawonDatabase } from "@/lib/db/dexie-db";
import { GUEST_USER_ID } from "@/types/storage";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { WatchlistGridTab } from "@/components/library/tabs/WatchlistGridTab";
import { PlaylistsTab } from "@/components/library/tabs/PlaylistsTab";
import { HistoryTab } from "@/components/library/tabs/HistoryTab";
import type {
  LibraryItemRecord,
  WatchHistoryRecord,
  PlaylistRecord,
} from "@/types/storage";

export default function LibraryPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "history" | "watchlist" | "playlists"
  >("history");
  const [watchlist, setWatchlist] = useState<LibraryItemRecord[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<WatchHistoryRecord[]>([]);
  // New Playlist form state
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Confirmation Modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const loadData = async () => {
    try {
      await db.migrateFromLocalStorage();
      const allLibrary = await db.libraryItems.toArray();
      // Unify Watchlist (includes any legacy favorited items)
      const unifiedWatchlist = allLibrary.filter((i) => i.inWatchlist || i.isFavorite);
      setWatchlist(unifiedWatchlist);

      // Load Playlists with automated deduplication
      const plList = await db.getUnifiedPlaylists(GUEST_USER_ID);
      setPlaylists(plList);

      const hist = await db.watchHistory.orderBy("lastWatchedAt").reverse().toArray();
      // Strictly deduplicate by mediaId (keep most recently watched instance)
      const seenMedia = new Set<string>();
      const uniqueHist: WatchHistoryRecord[] = [];
      for (const h of hist) {
        const key = String(h.mediaId);
        if (!seenMedia.has(key)) {
          seenMedia.add(key);
          uniqueHist.push(h);
        }
      }
      setHistoryList(uniqueHist);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveItem = async (id: string, type: "watchlist" | "favorite" | "local") => {
    audioFX.playPop();
    await db.libraryItems.update(id, { inWatchlist: false, isFavorite: false });
    showToast("Item removed from watchlist", "info");
    loadData();
  };

  const handleClearAllHistory = () => {
    audioFX.playClick();
    setConfirmDialog({
      isOpen: true,
      title: "Clear Watch History?",
      description: "This will remove all recorded playback history and saved progress from your device.",
      confirmLabel: "Clear All History",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await db.clearAllHistory();
        setHistoryList([]);
        showToast("All watch history has been cleared.", "success");
        loadData();
      },
    });
  };

  const handleClearAllWatchlist = () => {
    audioFX.playClick();
    setConfirmDialog({
      isOpen: true,
      title: "Clear Watchlist?",
      description: "This will remove all saved movies and TV shows from your watchlist.",
      confirmLabel: "Clear Watchlist",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await db.libraryItems.filter((i) => i.inWatchlist || i.isFavorite).modify({ inWatchlist: false, isFavorite: false });
        setWatchlist([]);
        showToast("Watchlist has been cleared.", "success");
        loadData();
      },
    });
  };

  const handleClearAllPlaylists = () => {
    audioFX.playClick();
    setConfirmDialog({
      isOpen: true,
      title: "Clear All Playlists?",
      description: "This will delete all custom playlists and empty the Watch Later queue.",
      confirmLabel: "Clear Playlists",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        const customPlaylists = playlists.filter((p) => !p.isSystem);
        for (const pl of customPlaylists) {
          await db.playlists.delete(pl.id);
        }
        const watchLaterKey = LantawonDatabase.playlistKey(GUEST_USER_ID, "watch_later");
        await db.playlists.update(watchLaterKey, { items: [], itemCount: 0 });
        setSelectedPlaylistId(null);
        showToast("Playlists have been cleared.", "success");
        loadData();
      },
    });
  };

  const handleRemoveHistoryItem = async (historyId: string) => {
    audioFX.playPop();
    await db.watchHistory.delete(historyId);
    setHistoryList((prev) => prev.filter((h) => h.id !== historyId));
    showToast("History entry deleted", "info");
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    audioFX.playSuccess();
    const playlistId = LantawonDatabase.playlistKey(
      GUEST_USER_ID,
      newTitle.trim().toLowerCase().replace(/\s+/g, "_")
    );
    const newRecord: PlaylistRecord = {
      id: playlistId,
      userId: GUEST_USER_ID,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      isSystem: false,
      itemCount: 0,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.playlists.put(newRecord);
    setNewTitle("");
    setNewDesc("");
    setShowNewPlaylistModal(false);
    showToast(`Created playlist "${newRecord.title}"`, "success");
    loadData();
  };

  const handleDeletePlaylist = (playlistId: string) => {
    audioFX.playClick();
    const pl = playlists.find((p) => p.id === playlistId);
    setConfirmDialog({
      isOpen: true,
      title: `Delete "${pl?.title || "Playlist"}"?`,
      description: "Are you sure you want to delete this custom playlist? This action cannot be undone.",
      confirmLabel: "Delete Playlist",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        await db.playlists.delete(playlistId);
        if (selectedPlaylistId === playlistId) setSelectedPlaylistId(null);
        showToast("Playlist deleted", "info");
        loadData();
      },
    });
  };

  const handleRemoveFromPlaylist = async (playlistId: string, itemId: number | string) => {
    audioFX.playPop();
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    const nextItems = pl.items.filter((i) => i.id !== itemId);
    await db.playlists.update(playlistId, {
      items: nextItems,
      itemCount: nextItems.length,
      updatedAt: new Date().toISOString(),
    });
    showToast("Removed from playlist", "info");
    loadData();
  };

  return (
    <div className="space-y-6 pt-2 pb-24 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Bookmark className="h-6 w-6 text-zinc-400" /> Personal Media Library
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your custom playlists, watch history, and bookmarked watchlist.
          </p>
        </div>

        {/* Action buttons aligned to the right side (Icon-only with tooltips) */}
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "playlists" && (
            <>
              <button
                onClick={() => {
                  audioFX.playClick();
                  setShowNewPlaylistModal(true);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-zinc-950 shadow-md hover:bg-zinc-200 transition-all cursor-pointer"
                title="New Playlist"
                aria-label="New Playlist"
              >
                <Plus className="h-4 w-4" />
              </button>

              {playlists.length > 0 && (
                <button
                  onClick={handleClearAllPlaylists}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                  title="Clear All Playlists"
                  aria-label="Clear All Playlists"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </>
          )}

          {activeTab === "watchlist" && watchlist.length > 0 && (
            <button
              onClick={handleClearAllWatchlist}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Clear All Watchlist"
              aria-label="Clear All Watchlist"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          {activeTab === "history" && historyList.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Clear All History"
              aria-label="Clear All History"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: "history", label: `Watch History (${historyList.length})`, icon: History },
          { id: "watchlist", label: `Watchlist (${watchlist.length})`, icon: Bookmark },
          { id: "playlists", label: `Playlists (${playlists.length})`, icon: ListPlus },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                audioFX.playClick();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-300 hover:text-white bg-white/10 border border-white/10 hover:bg-white/20"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Watchlist View */}
      {activeTab === "watchlist" && (
        <WatchlistGridTab
          items={watchlist}
          type="watchlist"
          emptyMessage="Your watchlist is empty. Bookmark titles while browsing to save them here."
          onRemoveItem={handleRemoveItem}
        />
      )}

      {/* Playlists Tab */}
      {activeTab === "playlists" && (
        <PlaylistsTab
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={setSelectedPlaylistId}
          onDeletePlaylist={handleDeletePlaylist}
          onRemoveFromPlaylist={handleRemoveFromPlaylist}
          onOpenNewPlaylistModal={() => setShowNewPlaylistModal(true)}
        />
      )}

      {/* Watch History View */}
      {activeTab === "history" && (
        <HistoryTab
          historyList={historyList}
          onRemoveHistoryItem={handleRemoveHistoryItem}
        />
      )}

      {/* New Playlist Modal */}
      {showNewPlaylistModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setShowNewPlaylistModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#18191a] border border-zinc-700/80 p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-heading text-sm font-bold text-white flex items-center gap-2">
              <ListPlus className="h-4 w-4 text-zinc-400" /> Create New Playlist
            </h3>

            <form onSubmit={handleCreatePlaylist} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                  Choose a title
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Favorite Sci-Fi, Must Watch Anime"
                  className="w-full rounded-xl bg-[#242526] border border-zinc-700/80 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="e.g. Weekend movie night lineup"
                  className="w-full rounded-xl bg-[#242526] border border-zinc-700/80 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs py-2 transition-colors shadow-sm cursor-pointer"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewPlaylistModal(false)}
                  className="px-4 rounded-xl bg-[#242526] hover:bg-[#3a3b3c] text-zinc-300 text-xs py-2 transition-colors border border-zinc-700/80 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Dialog (Replaces native browser confirm) */}
      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
      />
    </div>
  );
}
