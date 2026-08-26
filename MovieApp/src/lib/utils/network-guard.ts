/**
 * LANTAWON LANG — NETWORK INFORMATION & CELLULAR DATA GUARD
 * 
 * Detects cellular connections, manages Data Saver state, and computes real-time stream data usage.
 */

export interface NetworkStatus {
  isCellular: boolean;
  isDataSaver: boolean;
  effectiveType: "2g" | "3g" | "4g" | "wifi-fast" | "unknown";
  estimatedKbps: number;
}

export class NetworkGuard {
  private static DATA_SAVER_KEY = "data_saver_mode";
  private static DATA_LIMIT_MB_KEY = "streaming_data_limit_mb";

  /**
   * Retrieves active network telemetry from browser.
   */
  static getNetworkStatus(): NetworkStatus {
    if (typeof window === "undefined") {
      return {
        isCellular: false,
        isDataSaver: false,
        effectiveType: "unknown",
        estimatedKbps: 10000,
      };
    }

    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

    const isExplicitDataSaver = localStorage.getItem(this.DATA_SAVER_KEY) === "true";
    const isSaveDataActive = conn?.saveData === true || isExplicitDataSaver;
    const isCellular =
      conn?.type === "cellular" ||
      conn?.effectiveType === "2g" ||
      conn?.effectiveType === "3g" ||
      conn?.effectiveType === "4g";

    let estimatedKbps = 10000;
    if (conn?.downlink) {
      estimatedKbps = Math.round(conn.downlink * 1000);
    } else if (conn?.effectiveType === "2g") {
      estimatedKbps = 250;
    } else if (conn?.effectiveType === "3g") {
      estimatedKbps = 1500;
    }

    return {
      isCellular: Boolean(isCellular),
      isDataSaver: Boolean(isSaveDataActive),
      effectiveType: (conn?.effectiveType as any) || (isCellular ? "4g" : "wifi-fast"),
      estimatedKbps,
    };
  }

  /**
   * Sets manual Data Saver mode.
   */
  static setDataSaver(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.DATA_SAVER_KEY, String(enabled));
    window.dispatchEvent(new CustomEvent("data_saver_changed", { detail: enabled }));
  }

  /**
   * Gets user-configured streaming data limit alert threshold (in Megabytes).
   * Default: 1000 MB (1 GB).
   */
  static getDataLimitMb(): number {
    if (typeof window === "undefined") return 1000;
    const saved = localStorage.getItem(this.DATA_LIMIT_MB_KEY);
    return saved ? parseInt(saved, 10) || 1000 : 1000;
  }

  /**
   * Sets user streaming data limit alert threshold (in Megabytes).
   */
  static setDataLimitMb(limitMb: number): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.DATA_LIMIT_MB_KEY, String(limitMb));
  }

  /**
   * Calculates live megabytes consumed based on stream quality and playback seconds.
   */
  static calculateDataUsedMb(
    durationSeconds: number,
    resolution: "360p" | "480p" | "720p" | "1080p" | "4K" = "720p",
    isDataSaver = false
  ): number {
    if (durationSeconds <= 0) return 0;

    // Bitrate estimates in Kilobits per second (Kbps)
    let kbps = 2500; // default 720p

    if (isDataSaver || resolution === "360p") {
      kbps = 600; // ~270 MB / hour
    } else if (resolution === "480p") {
      kbps = 1000; // ~450 MB / hour
    } else if (resolution === "720p") {
      kbps = 2500; // ~1.1 GB / hour
    } else if (resolution === "1080p") {
      kbps = 4500; // ~2.0 GB / hour
    } else if (resolution === "4K") {
      kbps = 15000; // ~6.7 GB / hour
    }

    // (Kbps * seconds) / (8 * 1024) = MB
    const totalMb = (kbps * durationSeconds) / 8192;
    return Math.round(totalMb * 10) / 10;
  }
}
