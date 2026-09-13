import { createClient } from "@/lib/supabase/client";

export interface UserDevice {
  id: string;
  device_name: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  country?: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
}

const DEVICE_STORAGE_KEY = "lantawon_device_fp";

/**
 * Generate a device fingerprint (browser + OS + UA hash)
 */
export function generateDeviceFingerprint(): string {
  if (typeof window === "undefined") return "";

  const ua = navigator.userAgent;
  const platform = navigator.platform || "";
  const language = navigator.language || "";

  // Simple hash of browser info
  const combined = `${ua}|${platform}|${language}`;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Store in localStorage for consistency
  let stored = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (!stored) {
    stored = `device_${Math.random().toString(36).slice(2, 11)}_${hash.toString(36)}`;
    localStorage.setItem(DEVICE_STORAGE_KEY, stored);
  }

  return stored;
}

/**
 * Parse device info from user agent
 */
export function parseDeviceInfo(): {
  name: string;
  browser: string;
  os: string;
} {
  if (typeof window === "undefined")
    return { name: "Unknown", browser: "", os: "" };

  const ua = navigator.userAgent;

  // Simple browser detection
  let browser = "Unknown";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edge")) browser = "Edge";

  // Simple OS detection
  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("iPhone")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";

  return {
    name: `${browser} on ${os}`,
    browser,
    os,
  };
}

/**
 * Register device on login (call this after successful auth)
 */
export async function registerDevice(): Promise<{
  deviceId: string;
  isNewDevice: boolean;
  otherDeviceIds: string[];
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No authenticated user");
  }

  const fingerprint = generateDeviceFingerprint();
  const { name, browser, os } = parseDeviceInfo();

  // Get IP address (best effort - may be blocked)
  let ipAddress = "Unknown";
  try {
    const ipRes = await fetch("https://api.ipify.org?format=json");
    if (ipRes.ok) {
      const data = await ipRes.json();
      ipAddress = data.ip;
    }
  } catch {
    // IP fetch failed, use fallback
  }

  const { data, error } = await supabase.rpc("register_device", {
    p_user_id: user.id,
    p_device_fingerprint: fingerprint,
    p_device_name: name,
    p_browser: browser,
    p_os: os,
    p_ip_address: ipAddress,
  });

  if (error) {
    console.warn("[registerDevice] RPC failed:", {
      message: error.message || "(no message)",
      code: (error as any).code,
      details: (error as any).details,
      hint: (error as any).hint,
    });
    return { deviceId: "", isNewDevice: false, otherDeviceIds: [] };
  }

  // ─── STRICT SINGLE-DEVICE CONCURRENCY ───
  // Deactivate all other registered devices for this user so only current device remains active
  try {
    await supabase
      .from("user_devices")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .neq("device_fingerprint", fingerprint);
  } catch (deactivateErr) {
    console.warn("[registerDevice] Other devices deactivation note:", deactivateErr);
  }

  return {
    deviceId: data?.[0]?.device_id,
    isNewDevice: data?.[0]?.is_new_device ?? false,
    otherDeviceIds: data?.[0]?.other_device_ids ?? [],
  };
}

/**
 * Check if the current device session is still active and valid
 * Returns false if user was logged in from another device
 */
export async function checkCurrentDeviceActive(): Promise<{
  isActive: boolean;
  reason?: string;
}> {
  if (typeof window === "undefined") return { isActive: true };

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { isActive: true };

    const fingerprint = generateDeviceFingerprint();

    const { data, error } = await supabase
      .from("user_devices")
      .select("is_active, blocked_at")
      .eq("user_id", user.id)
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    if (error) {
      // Don't log out user on temporary network glitch
      return { isActive: true };
    }

    if (data && (data.is_active === false || data.blocked_at !== null)) {
      return { isActive: false, reason: "device_superseded" };
    }

    return { isActive: true };
  } catch {
    return { isActive: true };
  }
}

/**
 * Get all devices for current user
 */
export async function getUserDevices(): Promise<UserDevice[]> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase.rpc("get_user_devices", {
    p_user_id: user.id,
  });

  if (error) {
    console.error("[getUserDevices]", error);
    return [];
  }

  return data ?? [];
}

/**
 * Revoke/block a device
 */
export async function revokeDevice(deviceId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("revoke_device", {
    p_device_id: deviceId,
  });

  if (error) {
    console.error("[revokeDevice]", error);
    return false;
  }

  return data === true;
}
