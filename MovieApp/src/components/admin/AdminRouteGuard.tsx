"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Client-side gate for the admin console. Renders children only for
 * authenticated admin/super_admin roles; everyone else gets redirected
 * to login. (Server-side enforcement still needed for any real APIs.)
 */
export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isAdmin =
    user.isLoggedIn && (user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/login");
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-black">
        <div className="h-8 w-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-3 text-center px-4">
        <ShieldAlert className="h-10 w-10 text-rose-500" />
        <p className="text-sm text-zinc-400">Redirecting to login…</p>
      </div>
    );
  }

  return <>{children}</>;
}
