"use client";

import React from "react";
import {
  Edit2,
  Check,
  X,
  Sparkles,
  Calendar,
} from "lucide-react";
import { audioFX } from "@/lib/audio/audio-fx";

export interface UserProfile {
  name: string;
  bio: string;
  avatarEmoji: string;
  joinedAt: string;
  favoriteGenres: string[];
  favoriteEra: string;
}

export const AVATAR_EMOJIS = [
  "🎬", "🎥", "🍿", "🎭", "🌙", "⚡", "🔥", "❄️", "🌊", "🦁", "🐉", "🌸", "💀", "👻", "🧠", "🎸", "🚀", "🌌", "🦅", "🎯"
];

export const GENRE_LIST = [
  "Action", "Adventure", "Comedy", "Drama", "Horror", "Sci-Fi",
  "Thriller", "Romance", "Fantasy", "Mystery", "Animation", "Documentary",
  "Crime", "History", "War", "Western", "Music", "Family",
];

interface ProfileHeroCardProps {
  profile: UserProfile;
  persona: { title: string; emoji: string; desc: string };
  editing: boolean;
  editDraft: UserProfile;
  showEmojis: boolean;
  setEditing: (e: boolean) => void;
  setEditDraft: (p: UserProfile | ((prev: UserProfile) => UserProfile)) => void;
  setShowEmojis: (s: boolean | ((prev: boolean) => boolean)) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ProfileHeroCard({
  profile,
  persona,
  editing,
  editDraft,
  showEmojis,
  setEditing,
  setEditDraft,
  setShowEmojis,
  onSave,
  onCancel,
}: ProfileHeroCardProps) {
  const memberSince = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-[#18191a] p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Avatar Emoji */}
          <div className="relative">
            <button
              onClick={() => {
                if (editing) {
                  audioFX.playClick();
                  setShowEmojis((p) => !p);
                }
              }}
              className={`flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-[#242526] border border-zinc-700/80 text-3xl sm:text-4xl shadow-inner select-none transition-all ${
                editing ? "hover:scale-105 border-white cursor-pointer" : ""
              }`}
            >
              {editing ? editDraft.avatarEmoji : profile.avatarEmoji}
            </button>

            {/* Emoji Picker Popup */}
            {editing && showEmojis && (
              <div className="absolute top-full left-0 mt-2 z-50 rounded-2xl border border-zinc-700/80 bg-[#18191a] p-3 shadow-2xl w-64 flex flex-wrap gap-2 animate-in fade-in">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      audioFX.playPop();
                      setEditDraft((p) => ({ ...p, avatarEmoji: emoji }));
                      setShowEmojis(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#242526] hover:bg-[#3a3b3c] text-lg transition-transform hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Name & Bio */}
          <div className="space-y-1">
            {editing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-xl bg-[#242526] border border-zinc-700/80 px-3 py-1 text-sm font-bold text-white focus:outline-none focus:border-zinc-400"
                  placeholder="Your display name"
                />
                <input
                  type="text"
                  value={editDraft.bio}
                  onChange={(e) => setEditDraft((p) => ({ ...p, bio: e.target.value }))}
                  className="rounded-xl bg-[#242526] border border-zinc-700/80 px-3 py-1 text-xs text-zinc-300 w-full focus:outline-none focus:border-zinc-400"
                  placeholder="Short bio"
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-heading text-xl sm:text-2xl font-black text-white">
                    {profile.name}
                  </h1>
                  <span className="rounded-lg bg-[#242526] border border-zinc-700/80 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                    Local User
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-medium">{profile.bio}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono pt-0.5">
                  <Calendar className="h-3 w-3" />
                  <span>Member since {memberSince}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Persona Badge & Edit Action Button */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          {/* Persona Card */}
          <div className="flex items-center gap-2.5 rounded-2xl bg-[#242526] border border-zinc-700/80 px-4 py-2.5 shadow-sm">
            <span className="text-xl">{persona.emoji}</span>
            <div className="space-y-0.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                Watch Persona
              </div>
              <div className="text-xs font-bold text-white">{persona.title}</div>
            </div>
          </div>

          {/* Edit / Save Toggle */}
          {editing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onSave}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold shadow-md hover:bg-zinc-200 transition-colors"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Save</span>
              </button>
              <button
                onClick={onCancel}
                className="p-2 rounded-xl bg-[#242526] text-zinc-400 hover:text-white border border-zinc-700/80 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                audioFX.playClick();
                setEditing(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#242526] hover:bg-[#3a3b3c] border border-zinc-700/80 text-xs font-bold text-zinc-200 hover:text-white shadow-sm transition-all"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
