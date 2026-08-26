# 75. SUBSCRIPTION UI

Create:

/pricing

Plans should describe actual product features.

Example:

## Free

- Catalog browsing
- Search
- Watchlist
- Personal library
- Legal availability links
- Basic statistics

## Premium

- Advanced analytics
- Advanced personalization
- Enhanced library tools
- Additional supported playback features
- Enhanced cross-device sync
- Premium application features

Do NOT market unauthorized movie access as the paid feature.

---

# 76. BILLING FLOW

User
→ Pricing
→ Checkout
→ Payment Provider
→ Webhook
→ Subscription Record
→ Entitlement Engine
→ UI Update

Never trust the browser to say:

"subscription = premium"

The server/database must determine entitlement.

---
