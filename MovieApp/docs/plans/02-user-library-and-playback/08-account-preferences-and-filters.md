# 35. ACCOUNT MENU

Header right side:

## Search

## Notifications

## Subscription

## User Avatar

Dropdown:

- Profile
- My Library
- Statistics
- Achievements
- Preferences
- Playback Settings
- Content Preferences
- Region
- Privacy
- Devices
- Subscription
- Billing
- Security
- Logout

---

# 36. REGION SWITCHER

Header utility.

Example:

🌐 PH

Dropdown:

Country selector.

This should affect:

- Where to Watch
- Provider availability
- Language preferences
- Some content availability
- Regional certification

It must NOT be used to bypass licensing restrictions.

---

# 37. CONTENT PREFERENCES

User can configure:

## Preferred Languages

## Preferred Genres

## Preferred Content Types

## Preferred Quality

## Subtitle Language

## Audio Language

## Content Advisory Preferences

## Auto-play

## Auto-next

## Autoplay trailers

## Reduce motion

## Data saver

---

# 38. PARENTAL / CONTENT FILTER MODEL

Do not implement only:

"hide R"

Use:

profile content policy.

Fields:

- maximum_certification
- allow_mature_content
- hide_violence
- hide_gore
- hide_nudity
- hide_strong_language
- hide_substance_use
- hide_frightening_content

This system should be enforced at query time, not only hidden visually.

---
