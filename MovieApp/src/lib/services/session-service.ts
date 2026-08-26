import { createClient } from "@/lib/supabase/client";

export interface MemberSession {
  id: string;
  user_id: string;
  account_id: string | null;
  session_identifier: string;
  device_name: string | null;
  device_type: string | null;
  platform: string | null;
  browser: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  status: string;
}

export class SessionService {
  private supabase = createClient();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  /**
   * Create or update session on login.
   * SECURITY (migration 14/19): clients can no longer INSERT into
   * member_sessions directly — RLS blocks it. The register_member_session
   * SECURITY DEFINER RPC is the sanctioned path; it also enforces the
   * concurrent-session cap from the account's subscription package and
   * evicts the oldest device when the limit is exceeded.
   */
  async createOrUpdateSession(
    _userId: string,
    _accountId: string | null,
    deviceInfo: {
      name: string;
      type: string;
      platform: string;
      browser: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Identity is taken from the caller's auth.uid() inside the RPC —
      // the client-supplied userId/accountId params are ignored by design.
      const { data, error } = await this.supabase.rpc("register_member_session", {
        p_device_name: deviceInfo.name,
        p_device_type: deviceInfo.type,
        p_platform: deviceInfo.platform,
        p_browser: deviceInfo.browser,
      });

      if (error) throw error;

      // Store session identifier in localStorage for heartbeat
      const identifier = (data as { session_identifier?: string } | null)?.session_identifier;
      if (typeof window !== "undefined" && identifier) {
        localStorage.setItem("session_id", identifier);
      }

      return { success: true };
    } catch (error: any) {
      console.error("Session creation error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update session heartbeat (keep-alive) via the caller-scoped RPC
   */
  async updateHeartbeat(sessionIdentifier: string): Promise<void> {
    await this.supabase.rpc("heartbeat_member_session", {
      p_session_identifier: sessionIdentifier,
    });
  }

  /**
   * Get user's active sessions
   */
  async getUserSessions(userId: string): Promise<MemberSession[]> {
    const { data, error } = await this.supabase
      .from("member_sessions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "expired"])
      .order("last_seen_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("member_sessions")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Revoke all sessions (password change, security)
   */
  async revokeAllSessions(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from("member_sessions")
        .update({
          status: "revoked",
          revoked_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("status", "active");

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get device info from browser
   */
  getDeviceInfo(): {
    name: string;
    type: string;
    platform: string;
    browser: string;
  } {
    if (typeof window === "undefined") {
      return {
        name: "Unknown",
        type: "Unknown",
        platform: "Unknown",
        browser: "Unknown",
      };
    }

    const ua = window.navigator.userAgent;
    const platform = window.navigator.platform;

    // Detect browser
    let browser = "Unknown";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";

    // Detect device type
    let deviceType = "Desktop";
    if (/Mobile|Android|iPhone/.test(ua)) deviceType = "Mobile";
    else if (/iPad|Tablet/.test(ua)) deviceType = "Tablet";

    // Detect platform
    let platformName = platform || "Unknown";
    if (ua.includes("Win")) platformName = "Windows";
    else if (ua.includes("Mac")) platformName = "macOS";
    else if (ua.includes("Linux")) platformName = "Linux";
    else if (ua.includes("Android")) platformName = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) platformName = "iOS";

    const deviceName = `${browser} on ${platformName}`;

    return {
      name: deviceName,
      type: deviceType,
      platform: platformName,
      browser: browser,
    };
  }

  /**
   * Generate unique session identifier
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start heartbeat interval (call every 5 minutes)
   */
  startHeartbeat(): NodeJS.Timeout | null {
    if (typeof window === "undefined") return null;

    // Avoid stacking duplicate heartbeat intervals across re-logins
    this.stopHeartbeat();

    const sessionId = localStorage.getItem("session_id");
    if (!sessionId) return null;

    this.heartbeatInterval = setInterval(() => {
      this.updateHeartbeat(sessionId);
    }, 5 * 60 * 1000); // Every 5 minutes

    return this.heartbeatInterval;
  }

  /**
   * Stop the active heartbeat interval (call on logout / guest mode)
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("session_id");
    }
  }

  /**
   * Check if session is still valid
   */
  async validateSession(sessionIdentifier: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("member_sessions")
      .select("status, expires_at")
      .eq("session_identifier", sessionIdentifier)
      .single();

    if (!data || data.status !== "active") return false;

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Mark as expired
      await this.supabase
        .from("member_sessions")
        .update({ status: "expired" })
        .eq("session_identifier", sessionIdentifier);
      return false;
    }

    return true;
  }
}

export const sessionService = new SessionService();
