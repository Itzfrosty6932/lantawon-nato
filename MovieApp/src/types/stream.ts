export type PlaybackState =
  | "IDLE"
  | "LOADING"
  | "STARTING"
  | "PLAYING"
  | "PAUSED"
  | "BUFFERING"
  | "SEEKING"
  | "RECOVERING"
  | "ENDED"
  | "ERROR";

export interface StreamQualityTier {
  quality: string;
  bitrate: string;
  fps: number;
  resolution: string;
}

export interface PlayerMetrics {
  currentTime: number;
  duration: number;
  bufferedSeconds: number;
  bandwidthKbps: number;
  droppedFrames: number;
  decodedFrames: number;
  avDriftMs: number;
  rebufferCount: number;
  rebufferDurationMs: number;
  qoeScore: number;
  server: string;
}
