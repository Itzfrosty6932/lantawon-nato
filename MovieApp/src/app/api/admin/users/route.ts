import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * /api/admin/users   (ADMIN ONLY, service-role)
 *
 * Real user management for the admin portal. Reads/writes go through the
 * service-role client because:
 *   - profiles UPDATE policy is owner-only under RLS (an admin changing
 *     someone else's role would be silently filtered out), and
 *   - auth.users (email, ban, delete) is not exposed via PostgREST at all.
 *
 * GET    ?query=&page=  -> users + subscription tier + device counts + email
 * PATCH  { userId, role?, banned? } -> change role / ban / unban
 * DELETE ?userId=       -> delete auth user + cascading profile data
 */

export const dynamic = "force-dynamic";

const VALID_ROLES = ["user", "admin"] as const;

type AdminRole = (typeof VALID_ROLES)[number];

interface AdminUserRow {
  id: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  avatar_emoji: string | null;
  role: string;
  is_premium: boolean;
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

async function writeAudit(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  actorId: string,
  action: string,
  entityId: string,
  newData: Record<string, unknown>
) {
  await admin.from("audit_logs").insert({
    actor_user_id: actorId,
    action,
    entity_type: "profile",
    entity_id: entityId,
    new_data: newData,
  });
}

// ── GET: list users with real entitlement + device data ────────────────────
export async function GET(req: NextRequest) {
  try {
    const identity = await requireAdmin();
    const admin = createAdminSupabaseClient();

    const query = req.nextUrl.searchParams.get("query")?.trim() ?? "";
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10) || 100,
      500
    );

    // 1) Profiles (the canonical account list) — EXCLUDE ADMINS from list.
    // Admins are hidden from the Users tab to prevent attackers from
    // discovering and targeting the admin account.
    let profileQuery = admin
      .from("profiles")
      .select("*")
      .neq("role", "admin")  // Hide all admin accounts
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) {
      profileQuery = profileQuery.or(
        `username.ilike.%${query}%,display_name.ilike.%${query}%`
      );
    }

    const { data: profiles, error: profilesError } = await profileQuery;
    if (profilesError) throw profilesError;

    const ids = (profiles || []).map((p: { id: string }) => p.id);
    const idSet = new Set(ids);

    // 2) Emails + last sign-in from auth.users via the admin API.
    const { data: usersList } = await admin.auth.admin.listUsers({
      perPage: 500,
    });
    const authById = new Map(
      (usersList?.users || [])
        .filter((u) => idSet.has(u.id))
        .map((u) => [
          u.id,
          {
            email: u.email ?? null,
            lastSignIn: u.last_sign_in_at ?? null,
            // banned_at only exists on the BanDuration variant of the
            // supabase-js User type — read it defensively.
            banned:
              "banned_at" in u && typeof (u as { banned_at?: unknown }).banned_at === "string"
                ? !!(u as { banned_at: string }).banned_at
                : false,
          },
        ])
    );

    // 3) Subscriptions: owner comes from accounts (account_id FK), package
    //    comes from subscription_packages via the current_package_id FK on
    //    subscriptions itself — NOT through accounts (there is no
    //    accounts→packages relationship, which is why the nested embed 500'd).
    const { data: subRowData, error: subError } = await admin
      .from("subscriptions")
      .select(
        `status, current_period_end, account:accounts(owner_user_id), package:subscription_packages!current_package_id(name)`
      )
      .in("status", ["active", "pending_payment"]);
    if (subError) throw subError;

    const subByOwner = new Map<
      string,
      { status: string; packageName: string | null; periodEnd: string | null }
    >();
    for (const row of (subRowData ?? []) as unknown as Array<{
      status: string;
      current_period_end: string | null;
      account: { owner_user_id: string }[] | { owner_user_id: string } | null;
      package: { name: string }[] | { name: string } | null;
    }>) {
      // PostgREST returns to-one embeds as arrays; normalize both shapes.
      const acct = Array.isArray(row.account) ? row.account[0] : row.account;
      if (!acct || !idSet.has(acct.owner_user_id)) continue;
      if (!subByOwner.has(acct.owner_user_id)) {
        const pkg = Array.isArray(row.package) ? row.package[0] : row.package;
        subByOwner.set(acct.owner_user_id, {
          status: row.status,
          packageName: pkg?.name ?? null,
          periodEnd: row.current_period_end ?? null,
        });
      }
    }

    // 4) Device counts from member_sessions.
    const { data: sessionRows } = await admin
      .from("member_sessions")
      .select("user_id");
    const deviceCounts = new Map<string, number>();
    for (const s of sessionRows || []) {
      deviceCounts.set(s.user_id, (deviceCounts.get(s.user_id) ?? 0) + 1);
    }

    const rows: AdminUserRow[] = (profiles || []).map(
      (p: Record<string, unknown>) => {
        const pid = p.id as string;
        const auth = authById.get(pid);
        const sub = subByOwner.get(pid);
        return {
          id: pid,
          email: auth?.email ?? null,
          username: (p.username as string) ?? null,
          display_name: (p.display_name as string) ?? null,
          avatar_emoji: (p.avatar_emoji as string) ?? null,
          role: p.role as string,
          is_premium: !!p.is_premium,
          xp_total: (p.xp_total as number) ?? 0,
          current_level: (p.current_level as number) ?? 1,
          created_at: p.created_at as string,
          last_sign_in_at: auth?.lastSignIn ?? null,
          banned: auth?.banned ?? false,
          subscription_status: sub?.status ?? null,
          package_name: sub?.packageName ?? null,
          period_end: sub?.periodEnd ?? null,
          device_count: deviceCounts.get(pid) ?? 0,
        };
      }
    );

    return NextResponse.json({ users: rows, total: rows.length });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: err.message.includes("Authentication") ? 401 : 403,
        }
      );
    }
    console.error("[admin/users GET] unexpected error:", JSON.stringify(err));
    return NextResponse.json(
      { error: "Failed to load users." },
      { status: 500 }
    );
  }
}

// ── PATCH: change role or ban/unban ────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const identity = await requireAdmin();
    const admin = createAdminSupabaseClient();

    const body = (await req.json()) as {
      userId?: string;
      role?: AdminRole;
      banned?: boolean;
    };

    if (!body.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (
      body.role !== undefined &&
      !VALID_ROLES.includes(body.role)
    ) {
      return NextResponse.json(
        { error: `Invalid role. Valid roles: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      );
    }

    // Self-demote guard: an admin cannot strip their own admin rights —
    // otherwise one misclick permanently locks everybody out of the portal.
    if (body.userId === identity.userId && body.role && body.role !== "admin") {
      return NextResponse.json(
        { error: "You cannot demote your own admin account." },
        { status: 400 }
      );
    }

    // Prevent demoting ANY admin account (not just self).
    // Only the system should manage admin accounts.
    if (body.role && body.role !== "admin") {
      const { data: targetProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", body.userId)
        .single();

      if (targetProfile?.role === "admin") {
        return NextResponse.json(
          { error: "Cannot demote admin accounts. Only system can manage admin roles." },
          { status: 403 }
        );
      }
    }

    const updates: Record<string, unknown> = {};
    let auditAction: string | null = null;

    if (body.role !== undefined) {
      updates.role = body.role;
      auditAction = "admin.user_role_changed";
    }
    if (body.banned !== undefined) {
      updates.banned = body.banned;
      auditAction = auditAction
        ? "admin.user_role_and_ban_changed"
        : body.banned
          ? "admin.user_banned"
          : "admin.user_unbanned";
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update — provide role and/or banned." },
        { status: 400 }
      );
    }

    // Role changes live on profiles; ban lives on the auth user.
    if (body.role !== undefined) {
      const { error } = await admin
        .from("profiles")
        .update({ role: body.role })
        .eq("id", body.userId);
      if (error) throw error;
    }

    if (body.banned !== undefined) {
      const { error } = await admin.auth.admin.updateUserById(body.userId, {
        ban_duration: body.banned ? "876000h" : "none", // ~100 years ≈ permanent
      });
      if (error) throw error;

      // Kicking a banned user out everywhere: revoke their active sessions.
      if (body.banned) {
        await admin
          .from("member_sessions")
          .update({ revoked_at: new Date().toISOString() })
          .eq("user_id", body.userId)
          .is("revoked_at", null);
      }
    }

    await writeAudit(admin, identity.userId, auditAction!, body.userId, updates);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: err.message.includes("Authentication") ? 401 : 403,
        }
      );
    }
    console.error("[admin/users PATCH] unexpected error:", JSON.stringify(err));
    return NextResponse.json(
      { error: "Failed to update user." },
      { status: 500 }
    );
  }
}

// ── DELETE: remove a user entirely ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const identity = await requireAdmin();
    const admin = createAdminSupabaseClient();

    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    if (userId === identity.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    // Clean up related data before deleting auth user
    // Get all accounts owned by this user
    const { data: accounts } = await admin
      .from("accounts")
      .select("id")
      .eq("owner_user_id", userId);

    // Delete subscriptions for those accounts
    for (const acc of accounts || []) {
      await admin.from("subscriptions").delete().eq("account_id", acc.id);
      await admin.from("accounts").delete().eq("id", acc.id);
    }

    // Delete payment submissions
    await admin.from("payment_submissions").delete().eq("submitted_by_user_id", userId);

    // Delete devices
    await admin.from("user_devices").delete().eq("user_id", userId);

    // Finally, delete the auth user (cascades to profiles)
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    await writeAudit(admin, identity.userId, "admin.user_deleted", userId, {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json(
        { error: err.message },
        {
          status: err.message.includes("Authentication") ? 401 : 403,
        }
      );
    }
    console.error("[admin/users DELETE] unexpected error:", JSON.stringify(err));
    return NextResponse.json(
      { error: "Failed to delete user." },
      { status: 500 }
    );
  }
}
