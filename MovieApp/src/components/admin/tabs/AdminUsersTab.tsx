"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Users, Search, Loader2, Ban, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export type AdminUserRole = "user" | "admin";

const ROLES_LIST: AdminUserRole[] = ["user", "admin"];

interface ManagedUser {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  role: string;
  xp_total: number;
  current_level: number;
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
  subscription_status: string | null;
  package_name: string | null;
  period_end: string | null;
  device_count: number;
}

/** Every row comes from the live database via /api/admin/users. No seed data. */
export function AdminUsersTab() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ManagedUser | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/users${search.trim() ? `?query=${encodeURIComponent(search.trim())}` : ""}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { users: ManagedUser[] };
      setUsers(data.users || []);
    } catch (err) {
      console.error("Error loading users:", err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadUsers, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadUsers, search]);

  const patchUser = async (user: ManagedUser, body: Record<string, unknown>) => {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...body }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error || `HTTP ${res.status}`);
    }
  };

  const handleRoleChange = async (user: ManagedUser, newRole: AdminUserRole) => {
    setBusyUserId(user.id);
    try {
      await patchUser(user, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
      showToast(`Role updated to ${newRole}`, "success");
    } catch (err) {
      showToast((err as Error).message, "error");
      loadUsers();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleBan = async (user: ManagedUser) => {
    setBusyUserId(user.id);
    try {
      await patchUser(user, { banned: !user.banned });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, banned: !u.banned } : u))
      );
      showToast(user.banned ? "User unbanned" : "User banned — sessions revoked", "success");
    } catch (err) {
      showToast((err as Error).message, "error");
      loadUsers();
    } finally {
      setBusyUserId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setBusyUserId(confirmDelete.id);
    try {
      const res = await fetch(
        `/api/admin/users?userId=${encodeURIComponent(confirmDelete.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || `HTTP ${res.status}`);
      }
      showToast("User deleted", "success");
      setConfirmDelete(null);
      loadUsers();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBusyUserId(null);
    }
  };

  const nameOf = (u: ManagedUser) =>
    u.display_name || u.username || u.email?.split("@")[0] || u.id.slice(0, 8);

  const SubscriptionBadge = ({ u }: { u: ManagedUser }) => {
    if (u.subscription_status === "active") {
      return (
        <div>
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-xs font-medium text-emerald-400">
            Active
          </span>
          {u.period_end && (
            <p className="mt-0.5 text-xs text-zinc-500">
              until {new Date(u.period_end).toLocaleDateString()}
            </p>
          )}
        </div>
      );
    }
    if (u.subscription_status === "pending_payment") {
      return (
        <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-400">
          Pending
        </span>
      );
    }
    return <span className="text-xs text-zinc-500">Free</span>;
  };

  const RoleSelect = ({ u }: { u: ManagedUser }) => {
    // All users are regular users (admin accounts are hidden from this list)
    // No role dropdown needed — display as text only
    return <span className="text-sm text-gray-400 font-medium">user</span>;
  };

  const RowActions = ({ u }: { u: ManagedUser }) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleToggleBan(u)}
        disabled={busyUserId === u.id}
        title={u.banned ? "Unban user" : "Ban user"}
        className={`rounded p-1.5 hover:bg-zinc-800 disabled:opacity-50 ${
          u.banned ? "text-emerald-400" : "text-zinc-400 hover:text-amber-400"
        }`}
      >
        {u.banned ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
      </button>
      <button
        onClick={() => setConfirmDelete(u)}
        disabled={busyUserId === u.id}
        title="Delete user"
        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-white">Users</h1>
        <p className="text-sm text-zinc-400">
          {users.length} account{users.length === 1 ? "" : "s"} · changes apply immediately
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or username"
          className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
        />
      </div>

      {loading && users.length === 0 ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : error ? (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-6 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-rose-400" />
          <p className="text-sm font-medium text-rose-300">Failed to load users</p>
          <p className="mt-1 text-xs text-rose-400/70">{error}</p>
          <button
            onClick={loadUsers}
            className="mt-3 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-md border border-zinc-800 py-12 text-center">
          <Users className="mx-auto mb-2 h-6 w-6 text-zinc-600" />
          <p className="text-sm text-zinc-400">No users found</p>
        </div>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-2 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {u.avatar_emoji && <span className="mr-1">{u.avatar_emoji}</span>}
                      {nameOf(u)}
                      {u.banned && (
                        <span className="ml-1.5 rounded bg-rose-500/20 px-1 text-xs text-rose-400">
                          banned
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-zinc-500">{u.email ?? "no email"}</p>
                  </div>
                  <RowActions u={u} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <RoleSelect u={u} />
                  <SubscriptionBadge u={u} />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-md border border-zinc-800 md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Subscription</th>
                  <th className="px-4 py-2.5 font-medium">Joined</th>
                  <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {u.avatar_emoji && <span>{u.avatar_emoji}</span>}
                        <span className="font-medium text-white">{nameOf(u)}</span>
                        {u.banned && (
                          <span className="rounded bg-rose-500/20 px-1 text-xs text-rose-400">
                            banned
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{u.email ?? "no email"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <RoleSelect u={u} />
                    </td>
                    <td className="px-4 py-3">
                      <SubscriptionBadge u={u} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <RowActions u={u} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <h2 className="text-base font-semibold text-white">Delete user?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              <span className="text-white">{nameOf(confirmDelete)}</span> and all their data will
              be permanently removed. This cannot be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDelete}
                disabled={busyUserId === confirmDelete.id}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-rose-600 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {busyUserId === confirmDelete.id && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-md border border-zinc-700 py-2 text-sm text-white hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
