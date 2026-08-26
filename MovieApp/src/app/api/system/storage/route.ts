import { NextResponse } from "next/server";
import fs from "fs/promises";
import os from "os";
import { UnauthorizedError, requireAdmin } from "@/lib/server/auth";

/**
 * GET /api/system/storage — admin-only host telemetry (audit M21).
 * Previously unauthenticated: leaked os.platform(), hostname, disk usage
 * to anyone. Now requires a server-verified admin session.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }

  try {
    let totalDiskBytes = 500 * 1024 * 1024 * 1024; // 500 GB fallback
    let freeDiskBytes = 250 * 1024 * 1024 * 1024;  // 250 GB fallback
    let usedDiskBytes = 250 * 1024 * 1024 * 1024;

    try {
      // In Node.js 18.15.0+, fs.statfs is available
      const rootPath = os.platform() === "win32" ? "C:\\" : "/";
      const stats = await fs.statfs(rootPath);
      totalDiskBytes = stats.bsize * stats.blocks;
      freeDiskBytes = stats.bsize * stats.bfree;
      usedDiskBytes = totalDiskBytes - freeDiskBytes;
    } catch {
      // Fallback based on totalmem
      const totalMem = os.totalmem();
      totalDiskBytes = totalMem * 16;
      freeDiskBytes = totalMem * 8;
      usedDiskBytes = totalDiskBytes - freeDiskBytes;
    }

    const formatGB = (bytes: number) => (bytes / (1024 * 1024 * 1024)).toFixed(1);

    // Note: hostname deliberately omitted from the response (audit M21) —
    // internal infrastructure names must not reach any client.
    return NextResponse.json({
      success: true,
      device: {
        totalBytes: totalDiskBytes,
        freeBytes: freeDiskBytes,
        usedBytes: usedDiskBytes,
        totalGB: Number(formatGB(totalDiskBytes)),
        freeGB: Number(formatGB(freeDiskBytes)),
        usedGB: Number(formatGB(usedDiskBytes)),
        percentUsed: Math.round((usedDiskBytes / totalDiskBytes) * 100),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to detect system device storage." },
      { status: 500 }
    );
  }
}
