import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminRouteGuard } from "@/components/admin/AdminRouteGuard";
import { getServerIdentity } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Admin Operations Console — Lantawon Nato",
  description: "Internal operations, telemetry, playback mirror health, and catalog management console.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * SERVER-SIDE ADMIN GATE.
 * This layout runs on the server for every /admin/** request. Role is
 * resolved from the profiles table — never from client state. A user who
 * tampers with localStorage or the client JS bundle still hits this wall:
 * they are redirected before any admin component ever renders.
 *
 * AdminRouteGuard below remains only as UX (avoids flashing children
 * while auth state hydrates); it confers no security.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const identity = await getServerIdentity();

  if (!identity.isAuthenticated) {
    redirect("/login?next=/admin");
  }

  if (identity.role !== "admin" && identity.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-black text-white antialiased flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
          <h1 className="text-lg font-semibold">403 — Forbidden</h1>
          <p className="text-sm text-zinc-400 max-w-sm">
            This console is restricted to Lantawon administrators. If you
            believe you should have access, contact the system owner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased flex flex-col">
      <AdminRouteGuard>{children}</AdminRouteGuard>
    </div>
  );
}
