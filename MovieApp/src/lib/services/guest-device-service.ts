/**
 * SERVER-SIDE GUEST DEVICE REGISTRY CLIENT
 *
 * Option B enforcement: the authoritative 30-minute guest trial lives in
 * Supabase (`guest_devices` table), keyed by a stable device fingerprint.
 * The browser's localStorage timer is only a display cache — the server
 * always wins. Clearing localStorage, using Incognito-with-cookies, or
 * restarting the device no longer grants a fresh trial because the
 * fingerprint resolves to the same server row.
 */

import { supabase } from "@/lib/supabase/client";

const FP_STORAGE_KEY = "lantawon_guest_fp_v1";
// Cookie also holds the fingerprint (set by /api/guest-device) so it
// survives localStorage wipes; JS can't read httpOnly but re-sending it
// happens automatically on fetch to same-origin API routes.

export interface ServerGuestState {
  deviceId: string;
  remainingSeconds: number;
  isExpired: boolean;
}

/**
 * Builds a stable-ish device fingerprint from hardware/display traits plus
 * a persisted random salt. The salt keeps casual users unique; the hardware
 * traits keep Incognito sessions resolvable to the same row.
 */
function computeFingerprint(): string {
  // Existing salt survives normal browsing
  const storedSalt =
    typeof window !== "undefined" ? localStorage.getItem(FP_STORAGE_KEY) : null;
  const salt = storedSalt || crypto.randomUUID();
  if (!storedSalt && typeof window !== "undefined") {
    localStorage.setItem(FP_STORAGE_KEY, salt);
  }

  const traits = [
    typeof screen !== "undefined" ? `${screen.width}x${screen.height}x${screen.colorDepth}` : "no-screen",
    typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 0 : 0,
    typeof navigator !== "undefined" ? navigator.language : "no-lang",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "no-tz",
    new Date().getTimezoneOffset(),
    salt,
  ].join("|");

  // Simple synchronous hash (FNV-1a style) — not cryptographic, just stable
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < traits.length; i++) {
    const c = traits.charCodeAt(i);
    h1 = ((h1 ^ c) * 16777619) >>> 0;
    h2 = ((h2 + c * (i + 7)) * 2654435761) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
}

/** Ask the server for this device's authoritative trial state. */
export async function lookupGuestDevice(): Promise<ServerGuestState | null> {
  try {
    if (!supabase || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;

    const fingerprint = computeFingerprint();

    // Best-effort: persist fingerprint in an httpOnly cookie too, so a
    // localStorage wipe doesn't spawn a new identity.
    fetch("/api/guest-device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
      credentials: "same-origin",
    }).catch(() => {});

    const { data, error } = await supabase.rpc("guest_device_lookup", {
      p_fingerprint: fingerprint,
    });

    if (error || !data || !data[0]) return null;

    return {
      deviceId: data[0].device_id,
      remainingSeconds: data[0].remaining_seconds,
      isExpired: data[0].is_expired,
    };
  } catch {
    // Network failure must never lock guests OUT — fall back to local timer
    return null;
  }
}

/**
 * Report consumed seconds; returns clamped authoritative remaining time.
 */
export async function heartbeatGuestDevice(
  deviceId: string,
  secondsElapsed: number
): Promise<ServerGuestState | null> {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase.rpc("guest_device_heartbeat", {
      p_device_id: deviceId,
      p_seconds_elapsed: Math.max(0, Math.min(Math.round(secondsElapsed), 60)),
    });

    if (error || !data || !data[0]) return null;

    return {
      deviceId,
      remainingSeconds: data[0].remaining_seconds,
      isExpired: data[0].is_expired,
    };
  } catch {
    return null;
  }
}
