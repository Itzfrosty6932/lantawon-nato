/**
 * DEVICE-BASED GUEST TRIAL TIMER SERVICE
 *
 * Manages a strict 12-hour (43,200 seconds) trial limit per device. The
 * authoritative state lives SERVER-SIDE in Supabase (`guest_devices` table,
 * keyed by device fingerprint) — see guest-device-service.ts.
 *
 * Key Design Invariants:
 * 1. Timer MUST NOT reset or jump back up to 12:00:00 on page refresh/re-mount.
 * 2. Countdown ONLY decreases while playback is active (`_playbackActive === true`)
 *    and browser tab is focused (`!document.hidden`).
 * 3. Pausing the video, switching tabs, or navigating away immediately pauses the timer.
 * 4. Local consumption is persistently stored and synced to the server via heartbeats.
 * 5. When syncing with server, the lower remaining time always wins (monotonic decrement).
 */

import { lookupGuestDevice, heartbeatGuestDevice } from "@/lib/services/guest-device-service";

const STORAGE_KEY = "lantawon_guest_timer_v1";
const EXPIRED_KEY = "lantawon_guest_timer_expired";
export const GUEST_TRIAL_DURATION_SECONDS = 12 * 60 * 60; // 12 hours (43,200 seconds)

export interface GuestTimerData {
  totalSeconds: number;
  remainingSeconds: number;
  lastUpdated: number;
  isExpired: boolean;
}

export class GuestTimerService {
  private static _lastDeviceId: string | null = null;
  private static _pendingUnreportedSeconds = 0;
  private static _playbackActive = false;
  private static _isSyncing = false;
  private static _timerInterval: ReturnType<typeof setInterval> | null = null;
  private static _heartbeatAccumulator = 0;
  private static _listenersInitialized = false;

  private static _initGlobalListeners() {
    if (this._listenersInitialized || typeof window === "undefined") return;
    this._listenersInitialized = true;

    // Pause ticking when tab loses focus or is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this._stopTimer();
      } else if (this._playbackActive) {
        this._startTimer();
      }
    });

    const handleUnload = () => {
      this.flushHeartbeat();
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
  }

  /**
   * Reads or initializes the device guest session timer from localStorage.
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

        // Seamlessly upgrade legacy 30m timers to 12 hours
        if (parsed.totalSeconds < GUEST_TRIAL_DURATION_SECONDS && !parsed.isExpired) {
          const used = Math.max(0, parsed.totalSeconds - parsed.remainingSeconds);
          parsed.totalSeconds = GUEST_TRIAL_DURATION_SECONDS;
          parsed.remainingSeconds = Math.max(0, GUEST_TRIAL_DURATION_SECONDS - used);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
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

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    } catch {}
    return initialData;
  }

  /**
   * Checks if this device has already exhausted its guest trial.
   */
  static isGuestExpired(): boolean {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(EXPIRED_KEY) === "true") return true;

    const data = this.getTimerData();
    return data.isExpired || data.remainingSeconds <= 0;
  }

  /**
   * Reconcile the local timer with the server's authoritative state.
   * MONOTONIC RULE: Timer never jumps up. If local has drained more than server,
   * local time is preserved and the elapsed delta is flushed to server immediately.
   */
  static async syncWithServer(): Promise<{ isExpired: boolean; remainingSeconds: number } | null> {
    if (this._isSyncing) return null;
    this._isSyncing = true;

    try {
      const server = await lookupGuestDevice();
      if (!server) {
        // Offline / network fallback: trust local timer
        const local = this.getTimerData();
        return { isExpired: local.isExpired, remainingSeconds: local.remainingSeconds };
      }

      this.setDeviceId(server.deviceId);

      if (server.isExpired) {
        this.markExpired();
        return { isExpired: true, remainingSeconds: 0 };
      }

      const local = this.getTimerData();

      // If local already expired or has zero remaining, propagate to server
      if (local.isExpired || local.remainingSeconds <= 0) {
        this.markExpired();
        await this.heartbeat(server.remainingSeconds);
        return { isExpired: true, remainingSeconds: 0 };
      }

      // If local spent MORE time than server currently knows (e.g. page refreshed during playback):
      // Keep local timer and tell server about the difference!
      if (local.remainingSeconds < server.remainingSeconds) {
        const delta = server.remainingSeconds - local.remainingSeconds;
        // Sync delta to server so DB records the spent seconds
        this.heartbeat(delta);
        return { isExpired: false, remainingSeconds: local.remainingSeconds };
      }

      // If server recorded more usage than local (e.g. other tab / previous session):
      // Clamp local timer down to server's lower value
      if (server.remainingSeconds < local.remainingSeconds) {
        this.updateRemainingSeconds(server.remainingSeconds);
        return { isExpired: false, remainingSeconds: server.remainingSeconds };
      }

      return { isExpired: false, remainingSeconds: local.remainingSeconds };
    } finally {
      this._isSyncing = false;
    }
  }

  /**
   * Fire-and-forget heartbeat: reports elapsed seconds to the server and
   * applies any clamp the server returns.
   */
  static async heartbeat(secondsElapsed: number): Promise<void> {
    if (secondsElapsed <= 0) return;
    try {
      if (!this._lastDeviceId) {
        // Queue pending seconds if deviceId is not yet loaded
        this._pendingUnreportedSeconds += secondsElapsed;
        return;
      }

      const toSend = secondsElapsed + this._pendingUnreportedSeconds;
      this._pendingUnreportedSeconds = 0;

      // Send in chunks of max 60s as enforced by DB function clamp
      let remainingToSend = toSend;
      while (remainingToSend > 0) {
        const chunk = Math.min(60, remainingToSend);
        remainingToSend -= chunk;
        const result = await heartbeatGuestDevice(this._lastDeviceId, chunk);
        if (result?.isExpired) {
          this.markExpired();
          break;
        } else if (result && typeof window !== "undefined") {
          const local = this.getTimerData();
          if (result.remainingSeconds < local.remainingSeconds) {
            this.updateRemainingSeconds(result.remainingSeconds);
          }
        }
      }
    } catch {
      // never break playback on network hiccups
    }
  }

  static setDeviceId(id: string | null): void {
    this._lastDeviceId = id;
    if (id && this._pendingUnreportedSeconds > 0) {
      const pending = this._pendingUnreportedSeconds;
      this._pendingUnreportedSeconds = 0;
      this.heartbeat(pending);
    }
  }

  /**
   * Whether a stream is actively playing on screen right now.
   */
  static isPlaybackActive(): boolean {
    return this._playbackActive;
  }

  /**
   * Set playback active state. Ticker only runs when true AND tab is visible.
   */
  static setPlaybackActive(active: boolean): void {
    this._initGlobalListeners();
    if (this._playbackActive === active) return;
    this._playbackActive = active;

    if (active && typeof document !== "undefined" && !document.hidden) {
      this._startTimer();
    } else {
      this._stopTimer();
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("guest_playback_changed", { detail: active })
      );
    }
  }

  private static _startTimer(): void {
    if (this._timerInterval || typeof window === "undefined") return;

    this._timerInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      if (!this._playbackActive) return;

      const current = this.getTimerData().remainingSeconds;
      const next = current - 1;
      this._heartbeatAccumulator += 1;

      if (next <= 0) {
        this._stopTimer();
        this.markExpired();
        return;
      }

      this.updateRemainingSeconds(next);

      // Flush heartbeat every 5s of active playback
      if (this._heartbeatAccumulator >= 5) {
        const toFlush = this._heartbeatAccumulator;
        this._heartbeatAccumulator = 0;
        this.heartbeat(toFlush);
      }
    }, 1000);
  }

  private static _stopTimer(): void {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    this.flushHeartbeat();
  }

  static flushHeartbeat(): void {
    if (this._heartbeatAccumulator > 0) {
      const toFlush = this._heartbeatAccumulator;
      this._heartbeatAccumulator = 0;
      this.heartbeat(toFlush);
    }
  }

  /**
   * Permanently marks this device's guest trial as expired.
   */
  static markExpired(): void {
    if (typeof window === "undefined") return;
    try {
      this._stopTimer();
      localStorage.setItem(EXPIRED_KEY, "true");
      const data: GuestTimerData = {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: 0,
        lastUpdated: Date.now(),
        isExpired: true,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("guest_timer_expired"));
      window.dispatchEvent(new CustomEvent("guest_timer_tick", { detail: 0 }));
    } catch {}
  }

  /**
   * Persists the remaining countdown. Monotonically preserves progress.
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

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent("guest_timer_tick", { detail: seconds }));
    } catch {}
    return data;
  }

  /**
   * Resets the guest trial timer back to 12:00:00 (for testing/admin use).
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

    try {
      this._stopTimer();
      localStorage.removeItem(EXPIRED_KEY);
      const initialData: GuestTimerData = {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: GUEST_TRIAL_DURATION_SECONDS,
        lastUpdated: Date.now(),
        isExpired: false,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      window.dispatchEvent(new CustomEvent("guest_timer_reset"));
      window.dispatchEvent(new CustomEvent("guest_timer_tick", { detail: GUEST_TRIAL_DURATION_SECONDS }));
      return initialData;
    } catch {
      return {
        totalSeconds: GUEST_TRIAL_DURATION_SECONDS,
        remainingSeconds: GUEST_TRIAL_DURATION_SECONDS,
        lastUpdated: Date.now(),
        isExpired: false,
      };
    }
  }

  /**
   * Formats seconds into H:MM:SS or MM:SS display string.
   */
  static formatTime(seconds: number): string {
    const total = Math.max(0, seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
}
