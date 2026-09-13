import { createClient } from "@/lib/supabase/client";

export interface UserDevice {
  id: string;
  device_fingerprint?: string;
  device_name: string;
  browser?: string;
  os?: string;
  ip_address?: string;
  country?: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  blocked_at?: string | null;
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
 * Register device on login or session init (authoritative server-side single device concurrency)
 */
export async function registerDevice(): Promise<{
  deviceId: string;
  isNewDevice: boolean;
  otherDeviceIds: string[];
}> {
  if (typeof window === "undefined") {
    return { deviceId: "", isNewDevice: false, otherDeviceIds: [] };
  }

  const fingerprint = generateDeviceFingerprint();
  const { name, browser, os } = parseDeviceInfo();

  try {
    const res = await fetch("/api/auth/device", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fingerprint,
        deviceName: name,
        browser,
        os,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[registerDevice] Server responded with status:", res.status);
      return { deviceId: "", isNewDevice: false, otherDeviceIds: [] };
    }

    const data = await res.json();
    return {
      deviceId: data.deviceId || "",
      isNewDevice: Boolean(data.supersededDevicesCount && data.supersededDevicesCount > 0),
      otherDeviceIds: [],
    };
  } catch (err) {
    console.warn("[registerDevice] network error:", err);
    return { deviceId: "", isNewDevice: false, otherDeviceIds: [] };
  }
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
    const fingerprint = generateDeviceFingerprint();
    if (!fingerprint) return { isActive: true };

    const res = await fetch(`/api/auth/device?fp=${encodeURIComponent(fingerprint)}`, {
      method: "GET",
      cache: "no-store",
    });

    if (res.status === 401) {
      return { isActive: false, reason: "unauthenticated" };
    }

    if (!res.ok) {
      return { isActive: true };
    }

    const data = await res.json();
    if (data.isActive === false) {
      return { isActive: false, reason: data.reason || "device_superseded" };
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
  try {
    const res = await fetch("/api/auth/device", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[getUserDevices] Server responded with status:", res.status);
      return [];
    }

    const data = await res.json();
    return data.devices || [];
  } catch (err) {
    console.error("[getUserDevices]", err);
    return [];
  }
}

/**
 * Revoke/block a device
 */
export async function revokeDevice(deviceId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/auth/device?id=${encodeURIComponent(deviceId)}`, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[revokeDevice] Server responded with status:", res.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[revokeDevice]", err);
    return false;
  }
}

/**
 * Revoke all devices except the current one
 */
export async function revokeAllOtherDevices(): Promise<boolean> {
  try {
    const currentFp = generateDeviceFingerprint();
    const res = await fetch(
      `/api/auth/device?revoke_others=true&current_fp=${encodeURIComponent(currentFp)}`,
      {
        method: "DELETE",
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.warn("[revokeAllOtherDevices] Server responded with status:", res.status);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[revokeAllOtherDevices]", err);
    return false;
  }
}
