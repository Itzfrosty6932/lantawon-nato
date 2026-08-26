# Media & Player Engine Architecture

**Date**: 2026-08-22  
**Philosophy**: Resilient A/V Synchronization, Strict Content Boundaries, Multi-Source Provider Abstraction

---

## 1. Provider Abstraction Model

```
                     ┌───────────────────────────┐
                     │       MediaProvider       │
                     │       (Abstract Base)     │
                     └─────────────┬─────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│LocalFileProvider │      │OfficialTrailer   │      │AuthorizedRemote  │
│                  │      │Provider          │      │Provider          │
├──────────────────┤      ├──────────────────┤      ├──────────────────┤
│• Native HTML5    │      │• YouTube IFrame  │      │• HLS (Hls.js)    │
│  video element   │      │  No-Cookie API   │      │• Adaptive Bitrate│
│• Object URLs /   │      │• Verified HD     │      │• CMAF Streams    │
│  File Handles    │      │  official keys   │      │• Multi-Audio     │
│• Local subtitles │      │• Trailer popups  │      │• WebVTT Subtitles│
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

---

## 2. CineStream Playback State Machine

```
         ┌─────────┐
         │  IDLE   │
         └────┬────┘
              │ Load Media
              ▼
        ┌───────────┐
        │  LOADING  │
        └─────┬─────┘
              │ CanPlay Event
              ▼
        ┌───────────┐         Pause
        │  PLAYING  │ ◄───────────────────► ┌──────────┐
        └─────┬─────┘                       │  PAUSED  │
              │                             └──────────┘
              ├────────────────────────┐
              ▼ Buffer Depleted        ▼ Visual Frame Stall
        ┌───────────┐            ┌────────────┐
        │ BUFFERING │            │ RECOVERING │
        └─────┬─────┘            └─────┬──────┘
              │ Buffer Built           │ Re-synchronized
              └────────────────────────┘
```

---

## 3. Strict A/V Synchronization & Watchdog Rules

### 3.1 Visual Stall Watchdog
- **Heartbeat**: Evaluates playback health every 250ms.
- **Rule**: If the audio clock advances while `video.currentTime` remains unchanged for 2 consecutive ticks (500ms):
  1. Atomically pause the audio pipeline immediately to eliminate audio-ahead-of-video desync.
  2. Transition to `RECOVERING` state.
  3. Wait for forward buffer to reach $\ge 4.0\text{s}$ before resuming video and audio together.

### 3.2 Realistic Synchronization Metrics
- Avoid false claims of sub-millisecond precision. Practical drift tolerance is set to $\le 150\text{ms}$.
- Live HUD exposes actual frame decoding rates, dropped video frames via `HTMLVideoElement.getVideoPlaybackQuality()`, and forward buffer seconds.
