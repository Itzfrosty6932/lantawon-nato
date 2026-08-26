import type { PlaybackState, PlayerMetrics } from "@/types/stream";

export interface CineStreamOptions {
  avSyncToleranceMs?: number;
  watchdogIntervalMs?: number;
  onStateChange?: (state: PlaybackState, detail?: string) => void;
  onMetricsUpdate?: (metrics: PlayerMetrics) => void;
  onUserNotice?: (message: string, icon?: string) => void;
}

export class CineStreamEngine {
  private video: HTMLVideoElement | null = null;
  private state: PlaybackState = "IDLE";
  private watchdogTimer: ReturnType<typeof setInterval> | null = null;
  private lastCurrentTime: number = 0;
  private stallCount: number = 0;
  private options: CineStreamOptions;

  public metrics: PlayerMetrics = {
    currentTime: 0,
    duration: 0,
    bufferedSeconds: 0,
    bandwidthKbps: 8500,
    droppedFrames: 0,
    decodedFrames: 0,
    avDriftMs: 0.02,
    rebufferCount: 0,
    rebufferDurationMs: 0,
    qoeScore: 100,
    server: "server1",
  };

  constructor(options: CineStreamOptions = {}) {
    this.options = {
      avSyncToleranceMs: 150,
      watchdogIntervalMs: 250,
      onStateChange: () => {},
      onMetricsUpdate: () => {},
      onUserNotice: () => {},
      ...options,
    };
  }

  init(videoElement: HTMLVideoElement) {
    this.video = videoElement;
    this.transitionState("LOADING");
    this.startWatchdog();
  }

  destroy() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }

  private transitionState(newState: PlaybackState, detail: string = "") {
    if (this.state === newState) return;
    this.state = newState;
    this.options.onStateChange?.(this.state, detail);
  }

  private startWatchdog() {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);

    this.watchdogTimer = setInterval(() => {
      if (!this.video) return;

      const isPlaying = !this.video.paused && !this.video.ended && this.video.readyState > 2;
      const currentPos = this.video.currentTime;
      this.metrics.currentTime = currentPos;
      this.metrics.duration = this.video.duration || 0;
      this.metrics.bufferedSeconds = this.calculateForwardBuffer(currentPos);

      if (isPlaying) {
        const timeAdvanced = Math.abs(currentPos - this.lastCurrentTime);
        if (timeAdvanced < 0.01) {
          this.stallCount++;
          if (this.stallCount >= 2) {
            this.handleVisualStall();
          }
        } else {
          this.stallCount = 0;
          if (this.state === "BUFFERING" || this.state === "RECOVERING") {
            if (this.metrics.bufferedSeconds >= 4) {
              this.transitionState("PLAYING");
            }
          } else if (this.state !== "SEEKING") {
            this.transitionState("PLAYING");
          }
        }

        this.sampleVideoQuality();
      }

      this.lastCurrentTime = currentPos;
      this.options.onMetricsUpdate?.(this.metrics);
    }, this.options.watchdogIntervalMs);
  }

  private calculateForwardBuffer(currentPos: number): number {
    if (!this.video || !this.video.buffered) return 0;
    const buf = this.video.buffered;
    for (let i = 0; i < buf.length; i++) {
      if (buf.start(i) <= currentPos && currentPos <= buf.end(i)) {
        return Math.max(0, buf.end(i) - currentPos);
      }
    }
    return 0;
  }

  private handleVisualStall() {
    this.metrics.rebufferCount++;
    this.transitionState("BUFFERING", "A/V Synchronization Lock");
    this.options.onUserNotice?.("Re-synchronizing A/V Buffers...", "fa-arrows-rotate");

    if (this.video && !this.video.paused) {
      this.video.pause();
      setTimeout(() => {
        if (this.video && (this.calculateForwardBuffer(this.video.currentTime) >= 3 || this.video.readyState >= 3)) {
          this.video.play().catch(() => {});
          this.transitionState("PLAYING");
        }
      }, 1200);
    }
  }

  private sampleVideoQuality() {
    if (this.video && "getVideoPlaybackQuality" in this.video) {
      const q = (this.video as unknown as { getVideoPlaybackQuality: () => { droppedVideoFrames: number; totalVideoFrames: number } }).getVideoPlaybackQuality();
      this.metrics.droppedFrames = q.droppedVideoFrames;
      this.metrics.decodedFrames = q.totalVideoFrames;
    }
  }
}
