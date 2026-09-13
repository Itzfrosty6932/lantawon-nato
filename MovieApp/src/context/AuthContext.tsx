"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { UserSessionState, EntitlementEngine, FeatureResource, EntitlementResult } from "@/lib/auth/entitlement-engine";
import { audioFX } from "@/lib/audio/audio-fx";
import { sessionService } from "@/lib/services/session-service";
import { subscriptionService } from "@/lib/services/subscription-service";
import { registerDevice, checkCurrentDeviceActive } from "@/lib/services/device-service";
import { GuestTimerService } from "@/lib/services/guest-timer-service";

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  tier: "free" | "solo";
  role: "guest" | "user" | "moderator" | "editor" | "analyst" | "admin" | "super_admin";
  createdAt: string;
}

interface AuthContextType {
  user: UserSessionState;
  profile: UserProfile;
  isLoading: boolean;
  signIn: (
    email: string,
    pass: string
  ) => Promise<{ success: boolean; error?: string; role?: UserProfile["role"] }>;
  signUp: (name: string, email: string, pass: string, tier?: "free" | "solo") => Promise<{ success: boolean; error?: string; userId?: string }>;
  signOut: () => Promise<void>;
  loginAsGuest: () => void;
  checkAccess: (resource: FeatureResource) => EntitlementResult;
}

const DEFAULT_GUEST: UserSessionState = {
  id: "guest_session",
  role: "guest",
  tier: "free",
  isLoggedIn: false,
};

const DEFAULT_PROFILE: UserProfile = {
  id: "guest_session",
  displayName: "Guest User",
  email: "",
  avatarUrl: "",
  tier: "free",
  role: "guest",
  createdAt: "2026-01-01",
};

const AuthContext = createContext<AuthContextType>({
  user: DEFAULT_GUEST,
  profile: DEFAULT_PROFILE,
  isLoading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  loginAsGuest: () => {},
  checkAccess: () => "allowed",
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSessionState>(DEFAULT_GUEST);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from Supabase + server-resolved profile.
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
          setIsLoading(false);
          return;
        }

        const { data } = await supabase.auth.getUser();
        if (!data?.user) return;

        const sbUser = data.user;

        // Fetch authoritative profile from the server (profiles table).
        let resolvedRole: UserProfile["role"] = "user";
        let resolvedTier: UserProfile["tier"] = "free";
        let displayName =
          sbUser.email?.split("@")[0] || "Lantawon User";
        let avatarUrl = "";

        try {
          const res = await fetch("/api/auth/profile", { cache: "no-store" });
          if (res.ok) {
            const serverProfile = await res.json();
            resolvedRole = serverProfile.role ?? "user";
            displayName = serverProfile.display_name || displayName;
            avatarUrl = serverProfile.avatar_url || "";
            resolvedTier = serverProfile.tier === "solo" ? "solo" : "free";
          }
        } catch {
          // Fail closed: without server confirmation, stay plain user on free.
        }

        const liveProfile: UserProfile = {
          id: sbUser.id,
          displayName,
          email: sbUser.email || "",
          avatarUrl,
          tier: resolvedTier,
          role: resolvedRole,
          createdAt: sbUser.created_at,
        };
        setProfile(liveProfile);
        setUser({
          id: liveProfile.id,
          email: liveProfile.email,
          role: liveProfile.role,
          tier: liveProfile.tier,
          isLoggedIn: true,
        });

        // Register / heartbeat this device first so an inactive previous device doesn't lock out this active session
        await registerDevice();

        // Check single device status (only fails if another device is genuinely active in the last 90s)
        const deviceStatus = await checkCurrentDeviceActive();
        if (!deviceStatus.isActive && deviceStatus.reason === "device_superseded") {
          console.warn("[Auth] Device was superseded by another active streaming device.");
          audioFX.playWarning();
          if (supabase) await supabase.auth.signOut().catch(() => {});
          localStorage.removeItem("lantawon_auth_session");
          setUser(DEFAULT_GUEST);
          setProfile(DEFAULT_PROFILE);
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.href = "/login?reason=device_superseded";
          }
          return;
        }
      } catch (e) {
        console.warn("[AuthContext Init Warning]", e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Real-time Single Device Concurrency Watcher
  useEffect(() => {
    if (!user.isLoggedIn || user.role === "guest") return;

    let isMounted = true;

    const verifyActiveSession = async () => {
      // Only verify and heartbeat when the tab is currently visible/active to prevent background tabs fighting
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

      const { isActive, reason } = await checkCurrentDeviceActive();
      if (!isMounted) return;

      if (!isActive && reason === "device_superseded") {
        console.warn("[Auth] Current device has been superseded by a newer active login.");
        audioFX.playWarning();
        await signOut();
        if (typeof window !== "undefined") {
          window.location.href = "/login?reason=device_superseded";
        }
      }
    };

    // Periodic heartbeat check every 15 seconds while visible
    const interval = setInterval(verifyActiveSession, 15000);

    // Immediate check & claim when tab gains focus
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        await verifyActiveSession();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [user.isLoggedIn, user.role]);

  const saveLocalSession = (newProfile: UserProfile) => {
    setProfile(newProfile);
    setUser({
      id: newProfile.id,
      email: newProfile.email,
      role: newProfile.role,
      tier: newProfile.tier,
      isLoggedIn: true,
    });
    // SECURITY (audit C4): cache only cosmetic display fields. Role/tier
    // are deliberately excluded — they must never be restored from
    // localStorage on init (spoofable via devtools).
    try {
      localStorage.setItem(
        "lantawon_auth_session",
        JSON.stringify({
          profile: {
            id: newProfile.id,
            displayName: newProfile.displayName,
            email: newProfile.email,
            avatarUrl: newProfile.avatarUrl,
            createdAt: newProfile.createdAt,
          },
        })
      );
    } catch {
      // Storage unavailable (private mode etc.) — session still works.
    }
  };

  const signIn = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; role?: UserProfile["role"] }> => {
    try {
      // Supabase Auth is the only credential verification path.
      // No local fallback: wrong credentials must never produce a session.
      if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
        return {
          success: false,
          error: "Authentication service is not configured. Please try again later.",
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error || !data?.user) {
        // Supabase returns the same "Invalid login credentials" for a wrong
        // password AND for an unconfirmed account — surface the real cause.
        const isInvalidCreds = error?.message === "Invalid login credentials";
        let message = isInvalidCreds
          ? "Incorrect email or password. Please try again."
          : error?.message || "Failed to sign in";
        if (isInvalidCreds && typeof email === "string" && email.includes("@")) {
          try {
            const res = await fetch(
              `/api/auth/check-confirmation?email=${encodeURIComponent(email)}`,
              { cache: "no-store" }
            );
            if (res.ok) {
              const info = await res.json();
              if (info.exists && !info.confirmed) {
                message =
                  "This account hasn't been verified yet. Check your inbox for the confirmation email, then sign in again.";
              }
            }
          } catch {}
        }
        return { success: false, error: message };
      }

      const sbProfile: UserProfile = {
        id: data.user.id,
        displayName: data.user.user_metadata?.full_name || email.split("@")[0],
        email: data.user.email || email,
        avatarUrl: data.user.user_metadata?.avatar_url || "",
        // SECURITY (audit C4): role/tier resolved from server below, never
        // from user_metadata (client-editable at signup).
        tier: "free",
        role: "user",
        createdAt: data.user.created_at || new Date().toISOString(),
      };

      // Resolve authoritative role/display from the profiles table.
      try {
        const res = await fetch("/api/auth/profile", { cache: "no-store" });
        if (res.ok) {
          const serverProfile = await res.json();
          sbProfile.role = serverProfile.role ?? "user";
          if (serverProfile.display_name) sbProfile.displayName = serverProfile.display_name;
          if (serverProfile.avatar_url) sbProfile.avatarUrl = serverProfile.avatar_url;
          // Guard the tier union — any unknown package code falls back to
          // "free" so future packages don't crash the type.
          sbProfile.tier = serverProfile.tier === "solo" ? "solo" : "free";
        }
      } catch {
        // Fail closed as plain user.
      }

      saveLocalSession(sbProfile);

      // Register device on login
      try {
        const deviceResult = await registerDevice();
        if (deviceResult.isNewDevice && deviceResult.otherDeviceIds.length > 0) {
          // New device detected! Other devices should be notified/logged out
          console.log("[Auth] New device login detected, other devices should logout");
          // In production: send notification to user + other devices
        }
      } catch (deviceErr) {
        console.warn("[Auth] Device registration warning:", deviceErr);
        // Don't fail login if device tracking fails
      }

      // Create session for concurrent access control
      try {
        const account = await subscriptionService.getUserAccount(data.user.id);
        const deviceInfo = sessionService.getDeviceInfo();
        await sessionService.createOrUpdateSession(
          data.user.id,
          account?.id || null,
          deviceInfo
        );
        // Start heartbeat to keep session alive
        sessionService.startHeartbeat();
      } catch (sessionErr) {
        console.warn("Session creation warning:", sessionErr);
        // Don't fail login if session creation fails
      }

      // Role is returned so callers can route immediately without racing
      // React's state commit (the context `user` is stale inside closures).
      return { success: true, role: sbProfile.role };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign in" };
    }
  };

  const signUp = async (
    name: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string; userId?: string }> => {
    try {
      if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        // Create the account SERVER-SIDE with the admin API so the email is
        // confirmed immediately. The old browser-side signUp() left users
        // unconfirmed (auto-confirm raced the session cookie), so their very
        // first login was rejected with "Invalid login credentials".
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            username: name,
            password: pass,
            displayName: name,
          }),
        });
        const regData = await regRes.json().catch(() => ({}));
        if (!regRes.ok) {
          return {
            success: false,
            error: regData.error || "Failed to register",
          };
        }

        // Establish a real browser session now that the user exists and is
        // confirmed — this also sets the auth cookie the payment-submit route
        // needs, with no timing race.
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password: pass });
        if (signInError || !signInData?.user) {
          return {
            success: false,
            error:
              "Account created but sign-in failed. Please log in with your new credentials.",
          };
        }

        const userId = signInData.user.id;
        const newProfile: UserProfile = {
          id: userId,
          displayName: name,
          email: email,
          avatarUrl: "",
          tier: "free",
          role: "user",
          createdAt: new Date().toISOString(),
        };

        // Register device on signup
        try {
          await registerDevice();
        } catch (deviceErr) {
          console.warn("[Auth] Device registration warning:", deviceErr);
          // Don't fail signup if device tracking fails
        }

        saveLocalSession(newProfile);
        return { success: true, userId };
      }

      return {
        success: false,
        error: "Registration service is not configured. Please try again later.",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to register" };
    }
  };

  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut().catch(() => {});
      }
      // Stop session heartbeat and clear stored session identifier
      sessionService.stopHeartbeat();
      localStorage.removeItem("lantawon_auth_session");
      setUser(DEFAULT_GUEST);
      setProfile(DEFAULT_PROFILE);
      audioFX.playPop();
    } catch (e) {
      console.error(e);
    }
  };

  // NOTE: No client-side demo/admin login or self-service tier upgrade.
  // Roles and tiers must come from the server (Supabase user_metadata /
  // profiles table) — anything settable in the browser is spoofable.

  const loginAsGuest = () => {
    try {
      // Stop any authenticated session heartbeat before entering guest mode
      sessionService.stopHeartbeat();
      localStorage.removeItem("lantawon_auth_session");
      if (supabase) {
        supabase.auth.signOut().catch(() => {});
      }
    } catch {}
    setUser(DEFAULT_GUEST);
    setProfile(DEFAULT_PROFILE);
    audioFX.playPop();
  };

  const checkAccess = (resource: FeatureResource): EntitlementResult => {
    return EntitlementEngine.checkEntitlement(user, resource);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        loginAsGuest,
        checkAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
