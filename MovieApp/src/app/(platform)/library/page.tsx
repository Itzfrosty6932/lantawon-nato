"use client";

import React, { useState, useEffect } from "react";
import {
  Bookmark,
  Heart,
  HardDrive,
  FolderTree,
  Loader2,
  History,
  RotateCcw,
  ListPlus,
  Plus,
} from "lucide-react";
import { db, LantawonDatabase } from "@/lib/db/dexie-db";
import { GUEST_USER_ID } from "@/types/storage";
import { LocalScannerService } from "@/features/library/local-scanner";
import { audioFX } from "@/lib/audio/audio-fx";
import { useToast } from "@/components/ui/Toast";
import { MatchCorrectionModal } from "@/components/library/MatchCorrectionModal";
import { WatchlistGridTab } from "@/components/library/tabs/WatchlistGridTab";
import { PlaylistsTab } from "@/components/library/tabs/PlaylistsTab";
import { HistoryTab } from "@/components/library/tabs/HistoryTab";
import { LocalMediaTab } from "@/components/library/tabs/LocalMediaTab";
import type {
  LibraryItemRecord,
  LocalScannedMediaRecord,
  WatchHistoryRecord,
  PlaylistRecord,
} from "@/types/storage";

export default function LibraryPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<
    "watchlist" | "favorites" | "playlists" | "history" | "local"
  >("watchlist");
  const [watchlist, setWatchlist] = useState<LibraryItemRecord[]>([]);
  const [favorites, setFavorites] = useState<LibraryItemRecord[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRecord[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [historyList, setHistoryList] = useState<WatchHistoryRecord[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalScannedMediaRecord[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCorrectionItem, setSelectedCorrectionItem] =
    useState<LocalScannedMediaRecord | null>(null);

  // New Playlist form state
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const loadData = async () => {
    try {
      await db.migrateFromLocalStorage();
      const allLibrary = await db.libraryItems.toArray();
      setWatchlist(allLibrary.filter((i) => i.inWatchlist));
      setFavorites(allLibrary.filter((i) => i.isFavorite));

      // Load Playlists (ensure default Watch Later exists)
      let plList = await db.playlists.toArray();
      const watchLaterKey = LantawonDatabase.playlistKey(GUEST_USER_ID, "watch_later");
      if (!plList.some((p) => p.id === watchLaterKey)) {
        const defaultWatchLater: PlaylistRecord = {
          id: watchLaterKey,
          userId: GUEST_USER_ID,
          title: "Watch Later",
          description: "Your default queue for saved cinema and television",
          isSystem: true,
          itemCount: 0,
          items: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await db.playlists.put(defaultWatchLater);
        plList = [defaultWatchLater, ...plList];
      }
      setPlaylists(plList);

      const hist = await db.watchHistory.orderBy("lastWatchedAt").reverse().toArray();
      setHistoryList(hist);
      const allLocal = await db.localScannedMedia.toArray();
      setLocalFiles(allLocal);
    } catch {}
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScanLocalFolder = async () => {
    audioFX.playClick();
    setIsScanning(true);
    showToast("Select your local Movies / Series folder...", "info");

    try {
      const results = await LocalScannerService.scanDirectory();
      if (results && results.length > 0) {
        audioFX.playSuccess();
        showToast(`Indexed ${results.length} local media files!`, "success");
        loadData();
      } else {
        showToast("No compatible video files found in folder.", "info");
      }
    } catch (e) {
      console.error(e);
      showToast("Directory scan cancelled.", "info");
    } finally {
      setIsScanning(false);
    }
  };

  const handleRemoveItem = async (id: string, type: "watchlist" | "favorite" | "local") => {
    audioFX.playPop();
    if (type === "local") {
      await db.localScannedMedia.delete(id);
    } else if (type === "watchlist") {
      await db.libraryItems.update(id, { inWatchlist: false });
    } else {
      await db.libraryItems.update(id, { isFavorite: false });
    }
    showToast("Item removed", "info");
    loadData();
  };

  const handleClearAllHistory = async () => {
    if (confirm("Are you sure you want to reset and delete all watch history?")) {
      audioFX.playPop();
      await db.clearAllHistory();
      setHistoryList([]);
      showToast("All watch history has been deleted.", "success");
      loadData();
    }
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

  const handleDeletePlaylist = async (playlistId: string) => {
    if (confirm("Are you sure you want to delete this playlist?")) {
      audioFX.playPop();
      await db.playlists.delete(playlistId);
      if (selectedPlaylistId === playlistId) setSelectedPlaylistId(null);
      showToast("Playlist deleted", "info");
      loadData();
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-xl md:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Bookmark className="h-6 w-6 text-zinc-400" /> Personal Media Library
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage custom playlists, watch history, bookmarks, favorites, and indexed local storage folder.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "playlists" && (
            <button
              onClick={() => {
                audioFX.playClick();
                setShowNewPlaylistModal(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-zinc-950 shadow-md hover:bg-zinc-200 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>New Playlist</span>
            </button>
          )}

          {activeTab === "history" && historyList.length > 0 && (
            <button
              onClick={handleClearAllHistory}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear All History</span>
            </button>
          )}

          <button
            onClick={handleScanLocalFolder}
            disabled={isScanning}
            className="flex items-center gap-2 rounded-xl bg-[#242526] hover:bg-[#3a3b3c] border border-zinc-700/80 px-3.5 py-2 text-xs font-bold text-zinc-200 hover:text-white shadow-md transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <FolderTree className="h-4 w-4 text-zinc-400" />
            )}
            <span>Scan Local Folder</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 pb-1 overflow-x-auto scrollbar-none">
        {[
          { id: "watchlist", label: `Watchlist (${watchlist.length})`, icon: Bookmark },
          { id: "favorites", label: `Favorites (${favorites.length})`, icon: Heart },
          { id: "playlists", label: `Playlists (${playlists.length})`, icon: ListPlus },
          { id: "history", label: `Watch History (${historyList.length})`, icon: History },
          { id: "local", label: `Local Files (${localFiles.length})`, icon: HardDrive },
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
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-300 hover:text-white bg-[#242526] border border-zinc-700/80 hover:bg-[#3a3b3c]"
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

      {/* Favorites View */}
      {activeTab === "favorites" && (
        <WatchlistGridTab
          items={favorites}
          type="favorite"
          emptyMessage="No favorites saved yet."
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

      {/* Local Files View */}
      {activeTab === "local" && (
        <LocalMediaTab
          localFiles={localFiles}
          onScanLocalFolder={handleScanLocalFolder}
          onOpenMatchCorrection={(file) => setSelectedCorrectionItem(file)}
          onRemoveItem={handleRemoveItem}
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

      {/* Match Correction Modal */}
      <MatchCorrectionModal
        item={selectedCorrectionItem}
        onClose={() => setSelectedCorrectionItem(null)}
        onMatchUpdated={loadData}
      />
    </div>
  );
}
