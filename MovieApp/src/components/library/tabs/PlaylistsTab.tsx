"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Trash2,
  ListPlus,
  Play,
  Plus,
} from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";
import { audioFX } from "@/lib/audio/audio-fx";
import { LibraryCardActionsMenu } from "@/components/library/LibraryCardActionsMenu";
import type { PlaylistRecord, PlaylistItem } from "@/types/storage";

interface PlaylistsTabProps {
  playlists: PlaylistRecord[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveFromPlaylist: (playlistId: string, itemId: number | string) => void;
  onOpenNewPlaylistModal: () => void;
}

export function PlaylistsTab({
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onDeletePlaylist,
  onRemoveFromPlaylist,
  onOpenNewPlaylistModal,
}: PlaylistsTabProps) {
  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  return (
    <div className="space-y-4">
      {selectedPlaylistId && activePlaylist ? (
        /* Playlist Detail View */
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-zinc-800">
            <button
              onClick={() => {
                audioFX.playClick();
                onSelectPlaylist(null);
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to all playlists</span>
            </button>

            <div className="flex items-center gap-2">
              {!activePlaylist.isSystem && (
                <button
                  onClick={() => onDeletePlaylist(activePlaylist.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Delete Playlist"
                  aria-label="Delete Playlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#18191a] border border-zinc-800/80">
            <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
              <ListPlus className="h-5 w-5 text-zinc-400" /> {activePlaylist.title}
            </h2>
            {activePlaylist.description && (
              <p className="text-xs text-zinc-400 mt-1">{activePlaylist.description}</p>
            )}
            <div className="text-[11px] font-mono text-zinc-500 mt-1">
              {activePlaylist.itemCount} titles in this playlist
            </div>
          </div>

          {activePlaylist.items.length === 0 ? (
            <div className="rounded-2xl bg-[#18191a]/40 p-12 text-center text-zinc-500 text-xs border border-zinc-800/80">
              This playlist is empty. Click the &ldquo;Save to List&rdquo; button while watching or
              browsing titles to add them here.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {activePlaylist.items.map((item: PlaylistItem, idx: number) => (
                <div
                  key={`pl_item_${item.id}_${idx}`}
                  className="relative rounded-xl overflow-visible bg-[#18191a] group flex flex-col justify-between border border-zinc-800/80 hover:border-zinc-600 transition-all shadow-sm"
                >
                  <div className="aspect-[2/3] w-full bg-zinc-950 rounded-t-xl overflow-hidden relative">
                    <Link
                      href={`/watch/${item.id}?type=${item.mediaType}`}
                      onClick={() => audioFX.playClick()}
                      className="block h-full w-full relative"
                    >
                      <SmartImage
                        src={
                          item.posterPath
                            ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${item.posterPath.startsWith("/") ? "" : "/"}${item.posterPath}`
                            : TMDB_IMAGE_CONFIG.FALLBACK_POSTER
                        }
                        alt={item.title}
                        fallbackType="poster"
                        containerClassName="h-full w-full"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Desktop Hover Quick Play Button */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center pointer-events-none z-10">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-zinc-950 font-bold shadow-lg transform group-hover:scale-105 transition-transform">
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </Link>

                    {/* 3-Dots Mobile & Tablet Menu (Always Accessible) */}
                    <div className="absolute top-2 right-2 z-20">
                      <LibraryCardActionsMenu
                        item={{
                          id: item.id,
                          title: item.title,
                          mediaType: item.mediaType as any,
                          posterPath: item.posterPath,
                          year: item.year,
                        }}
                        onRemove={() => onRemoveFromPlaylist(activePlaylist.id, item.id)}
                        removeLabel="Remove from Playlist"
                      />
                    </div>
                  </div>

                  <Link
                    href={`/watch/${item.id}?type=${item.mediaType}`}
                    onClick={() => audioFX.playClick()}
                    className="p-2.5 block hover:text-white"
                  >
                    <div className="font-heading text-xs font-bold text-white truncate">
                      {item.title}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                      <span className="capitalize text-zinc-300 font-medium">
                        {item.mediaType}
                      </span>
                      {item.year && <span>{item.year}</span>}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* All Playlists Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {playlists.map((pl, idx: number) => {
            const cover = pl.items[0]?.posterPath
              ? `${TMDB_IMAGE_CONFIG.POSTER_BASE}${pl.items[0].posterPath.startsWith("/") ? "" : "/"}${pl.items[0].posterPath}`
              : null;
            return (
              <div
                key={`pl_${pl.id}_${idx}`}
                onClick={() => {
                  audioFX.playClick();
                  onSelectPlaylist(pl.id);
                }}
                className="p-3.5 rounded-2xl bg-[#18191a] cursor-pointer group border border-zinc-800/80 hover:border-zinc-500 transition-all space-y-3"
              >
                <div className="aspect-video w-full rounded-xl bg-zinc-950 overflow-hidden relative border border-zinc-700/80 flex items-center justify-center">
                  {cover ? (
                    <SmartImage
                      src={cover}
                      alt={pl.title}
                      fallbackType="poster"
                      containerClassName="h-full w-full"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ListPlus className="h-8 w-8 text-zinc-700" />
                  )}
                  <div className="absolute top-2 right-2 rounded-lg bg-zinc-950/85 px-2 py-0.5 text-[10px] font-mono font-bold text-zinc-300 border border-zinc-700/80 z-10">
                    {pl.itemCount} titles
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors truncate">
                      {pl.title}
                    </h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                      {pl.description || (pl.isSystem ? "Default queue" : "Custom playlist")}
                    </p>
                  </div>

                  {!pl.isSystem && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePlaylist(pl.id);
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Playlist"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
