# 31. VIDEO PLAYER

Route:

/watch/[id]

The player should be a SOURCE-AGNOSTIC playback layer.

Architecture:

Player
→ Entitlement Check
→ Source Resolver
→ Source Ranking
→ Health Check
→ Playback Adapter
→ Player

Source Ranking should evaluate:

1. User entitlement
2. Legal authorization
3. Availability
4. Region
5. Resolution
6. Codec compatibility
7. Audio compatibility
8. Subtitle availability
9. Latency
10. Reliability

"Quality over quantity" means:

BEST ELIGIBLE SOURCE

not:

MOST SOURCES

---

# 32. VIDEO SOURCE TABLE

Each source should have:

- id
- content_id
- episode_id
- source_type
- provider_id
- playback_url
- manifest_url
- quality
- codec
- audio_type
- subtitle_support
- region
- authorization_status
- availability_start
- availability_end
- priority
- health_status
- last_health_check

Source types:

- owned
- licensed
- public_domain
- user_local
- provider_link
- external_authorized

Never assume an arbitrary embedded stream is authorized.

---

# 33. PLAYER FEATURES

## Playback

- Play
- Pause
- Seek
- Speed
- Volume
- Fullscreen
- Picture in Picture
- Subtitle
- Audio Track

## Player Information

- Resolution
- Source
- Buffer state
- Playback latency where measurable
- Subtitle track

## Episode Features

- Previous episode
- Next episode
- Season selector
- Episode list
- Auto-play next episode

## User Features

- Resume
- Watch progress
- Mark watched
- Continue watching

---

# 34. LOCAL MEDIA VAULT

Route:

/library/local

This should be separated from online streaming.

Features:

- Scan local folder
- Match filename
- Correct metadata match
- Local poster
- Local watch progress
- Local subtitles
- Offline playback

Architecture:

Local File
→ Filename Parser
→ Metadata Matcher
→ User Confirmation
→ Local Media Record
→ Local Player

Do not upload local files automatically.

---
