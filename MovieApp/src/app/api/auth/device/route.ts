import { NextRequest, NextResponse } from "next/server";
import { getServerIdentity } from "@/lib/server/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * /api/auth/device
 *
 * STRICT SINGLE-DEVICE ACCOUNT CONCURRENCY
 * Enforces exactly one active device session per registered user account.
 * When a user logs in or initializes on a new device, any previously active
 * devices are immediately marked is_active = false and blocked_at = now().
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const identity = await getServerIdentity();
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const fingerprint = typeof body.fingerprint === "string" ? body.fingerprint.trim() : "";
    const deviceName = typeof body.deviceName === "string" ? body.deviceName.slice(0, 100) : "Browser";
    const browser = typeof body.browser === "string" ? body.browser.slice(0, 50) : "Unknown";
    const os = typeof body.os === "string" ? body.os.slice(0, 50) : "Unknown";
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "Unknown";

    if (!fingerprint) {
      return NextResponse.json({ error: "Device fingerprint is required" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const nowIso = new Date().toISOString();

    // 1. Check if this device already exists
    const { data: existingDevice } = await admin
      .from("user_devices")
      .select("id")
      .eq("user_id", identity.userId)
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    let deviceId = existingDevice?.id;

    if (existingDevice) {
      // Reactivate current device
      await admin
        .from("user_devices")
        .update({
          is_active: true,
          blocked_at: null,
          last_active_at: nowIso,
          device_name: deviceName,
          browser,
          os,
          ip_address: clientIp,
        })
        .eq("id", existingDevice.id);
    } else {
      // Insert new device
      const { data: newDevice } = await admin
        .from("user_devices")
        .insert({
          user_id: identity.userId,
          device_fingerprint: fingerprint,
          device_name: deviceName,
          browser,
          os,
          ip_address: clientIp,
          is_active: true,
          blocked_at: null,
          last_active_at: nowIso,
        })
        .select("id")
        .single();
      deviceId = newDevice?.id;
    }

    // 2. ── STRICT SINGLE-DEVICE ENFORCEMENT ──
    // Deactivate ALL other devices for this user immediately
    const { count: deactivatedCount } = await admin
      .from("user_devices")
      .update({
        is_active: false,
        blocked_at: nowIso,
      })
      .eq("user_id", identity.userId)
      .neq("device_fingerprint", fingerprint);

    return NextResponse.json({
      success: true,
      deviceId,
      supersededDevicesCount: deactivatedCount ?? 0,
    });
  } catch (err: any) {
    console.error("[/api/auth/device POST error]:", err);
    return NextResponse.json({ error: err.message || "Failed to register device" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const identity = await getServerIdentity();
    if (!identity.isAuthenticated || !identity.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fingerprint = searchParams.get("fp")?.trim();

    if (!fingerprint) {
      return NextResponse.json({ error: "Missing fp parameter" }, { status: 400 });
    }

    const admin = createAdminSupabaseClient();
    const { data: device, error } = await admin
      .from("user_devices")
      .select("id, is_active, blocked_at")
      .eq("user_id", identity.userId)
      .eq("device_fingerprint", fingerprint)
      .maybeSingle();

    if (error) {
      console.warn("[/api/auth/device GET error]:", error);
      return NextResponse.json({ isActive: true });
    }

    // If no record exists yet, device has not been registered
    if (!device) {
      return NextResponse.json({ isActive: true });
    }

    // If superseded by another device login
    if (device.is_active === false || device.blocked_at !== null) {
      return NextResponse.json({
        isActive: false,
        reason: "device_superseded",
      });
    }

    // Touch last_active_at as heartbeat
    await admin
      .from("user_devices")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", device.id);

    return NextResponse.json({ isActive: true });
  } catch (err: any) {
    console.error("[/api/auth/device GET error]:", err);
    return NextResponse.json({ isActive: true });
  }
}
