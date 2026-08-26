/**
 * DEVICE-BASED GUEST TRIAL TIMER SERVICE
 *
 * Manages a strict 30-minute (1800 seconds) trial limit per device. The
 * authoritative state lives SERVER-SIDE in Supabase (`guest_devices` table,
 * keyed by device fingerprint) — see guest-device-service.ts. The localStorage
 * timer below is a display/offline cache: it drains on wall-clock time and is
 * reconciled against the server whenever the app loads or the sticky timer
 * mounts. Once the server marks a device expired, no client action can reset it.
 */

import { lookupGuestDevice, heartbeatGuestDevice } from "@/lib/services/guest-device-service";

const STORAGE_KEY = "lantawon_guest_timer_v1";
const EXPIRED_KEY = "lantawon_guest_timer_expired";
export const GUEST_TRIAL_DURATION_SECONDS = 30 * 60; // 30 minutes (1800 seconds)

export interface GuestTimerData {
  totalSeconds: number;
  remainingSeconds: number;
  lastUpdated: number;
  isExpired: boolean;
}

export class GuestTimerService {
  /**
   * Reads or initializes the device guest session timer.
   */
  static getTimerData(): GuestTimerData {
    if (typeof window === "undefined") {
      return {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: GUEST_TRIAL_DURATION_SECONDS,
        lastUpdated: Date.now(),
        isExpired: false,
      };
    }

    // Check if explicitly marked expired
    if (localStorage.getItem(EXPIRED_KEY) === "true") {
      return {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: 0,
        lastUpdated: Date.now(),
        isExpired: true,
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: GuestTimerData = JSON.parse(stored);
        if (parsed.isExpired || parsed.remainingSeconds <= 0) {
          this.markExpired();
          return {
            totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
            remainingSeconds: 0,
            lastUpdated: Date.now(),
            isExpired: true,
          };
        }
        return parsed;
      }
    } catch {}

    // First time initialization on this device
    const initialData: GuestTimerData = {
      totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
      remainingSeconds: GUEST_TRIAL_DURATION_SECONDS,
      lastUpdated: Date.now(),
      isExpired: false,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }

  /**
   * Checks if this device has already exhausted its 30-minute guest trial.
   */
  static isGuestExpired(): boolean {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(EXPIRED_KEY) === "true") return true;

    const data = this.getTimerData();
    return data.isExpired || data.remainingSeconds <= 0;
  }

  /**
   * Reconcile the local timer with the server's authoritative state.
   * Call on app load / sticky-timer mount. Server always wins:
   * - server expired → local marked expired (no reset possible)
   * - server remaining < local → local clamped down
   * - offline/unreachable → local timer keeps draining as fallback
   */
  static async syncWithServer(): Promise<{ isExpired: boolean; remainingSeconds: number } | null> {
    const server = await lookupGuestDevice();
    if (!server) return null; // offline: keep local accounting

    this.setDeviceId(server.deviceId);

    if (server.isExpired) {
      this.markExpired();
      return { isExpired: true, remainingSeconds: 0 };
    }

    // Server is authoritative: if server says NOT expired (e.g. database rows reset), clear local expired marker
    if (typeof window !== "undefined") {
      localStorage.removeItem(EXPIRED_KEY);
    }
    this.updateRemainingSeconds(server.remainingSeconds);

    return { isExpired: false, remainingSeconds: server.remainingSeconds };
  }

  /**
   * Fire-and-forget heartbeat: reports elapsed seconds to the server and
   * applies any clamp the server returns. Called periodically by the UI timer.
   */
  static async heartbeat(secondsElapsed: number): Promise<void> {
    try {
      // deviceId comes from the last syncWithServer() lookup
      if (!this._lastDeviceId) return;

      const result = await heartbeatGuestDevice(this._lastDeviceId, secondsElapsed);
      if (result?.isExpired) {
        this.markExpired();
      } else if (result && typeof window !== "undefined") {
        const local = this.getTimerData();
        if (result.remainingSeconds < local.remainingSeconds) {
          this.updateRemainingSeconds(result.remainingSeconds);
        }
      }
    } catch {
      // never break playback on heartbeat failure
    }
  }

  private static _lastDeviceId: string | null = null;
  static setDeviceId(id: string | null): void {
    this._lastDeviceId = id;
  }

  /**
   * Permanently marks this device's guest trial as expired.
   */
  static markExpired(): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(EXPIRED_KEY, "true");
    const data = {
      totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
      remainingSeconds: 0,
      lastUpdated: Date.now(),
      isExpired: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("guest_timer_expired"));
  }

  /**
   * Persists the remaining countdown. `lastUpdated` is refreshed on every
   * write so getTimerData() can account for wall-clock time elapsed between
   * writes (closed tabs, sleeping device, multiple open tabs).
   */
  static updateRemainingSeconds(seconds: number): GuestTimerData {
    if (typeof window === "undefined") {
      return {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: seconds,
        lastUpdated: Date.now(),
        isExpired: seconds <= 0,
      };
    }

    if (seconds <= 0) {
      this.markExpired();
      return {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: 0,
        lastUpdated: Date.now(),
        isExpired: true,
      };
    }

    const data: GuestTimerData = {
      totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
      remainingSeconds: seconds,
      lastUpdated: Date.now(),
      isExpired: false,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  /**
   * Resets the guest trial timer back to 30:00 (for dev mode or user re-entry).
   */
  static resetGuestTimer(): GuestTimerData {
    if (typeof window === "undefined") {
      return {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: GUEST_TRIAL_DURATION_SECONDS,
        lastUpdated: Date.now(),
        isExpired: false,
      };
    }

    localStorage.removeItem(EXPIRED_KEY);
    const initialData: GuestTimerData = {
      totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
      remainingSeconds: GUEST_TRIAL_DURATION_SECONDS,
      lastUpdated: Date.now(),
      isExpired: false,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    window.dispatchEvent(new CustomEvent("guest_timer_reset"));
    return initialData;
  }

  /**
   * Formats seconds into MM:SS display string.
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}
