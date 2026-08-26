/**
 * LANTAWON LANG — ENTITLEMENT & PLAYBACK SOURCE CONTRACTS
 * 
 * Source-Agnostic Playback Engine & Centralized Entitlement Model.
 * Corresponds to Sections 31, 32, 51, 52 of the master blueprint.
 */

// ─── Playback Sources & Adapters ─────────────────────────────────────────────

export type PlaybackSourceType =
  | "owned"
  | "licensed"
  | "public_domain"
  | "user_local"
  | "provider_link"
  | "external_authorized";

export type SourceAuthorizationStatus = "authorized" | "pending" | "revoked" | "public";

export type SourceHealthStatus = "healthy" | "degraded" | "unreachable" | "unknown";

export interface PlaybackSource {
  id: string;
  contentId: string;
  episodeId?: string | null;
  sourceType: PlaybackSourceType;
  providerId?: string;
  playbackUrl?: string;
  manifestUrl?: string;      // HLS (.m3u8) / DASH (.mpd)
  quality: "480p" | "720p" | "1080p" | "1440p" | "4K" | "auto";
  videoCodec?: string;
  audioCodec?: string;
  subtitleSupport: string[]; // ISO language codes
  regionAllowed: string[];   // ISO country codes (or ['*'] for global)
  authorizationStatus: SourceAuthorizationStatus;
  priority: number;          // Lower number = higher priority
  healthStatus: SourceHealthStatus;
  lastHealthCheck?: string;
}

// ─── Centralized Entitlement Engine Contract ─────────────────────────────────

export type EntitlementDeniedReason =
  | "requires_login"
  | "requires_subscription"
  | "geo_restricted"
  | "unsupported_device"
  | "source_unhealthy"
  | "content_unavailable";

export type EntitlementResult =
  | {
      allowed: true;
      source: PlaybackSource;
      maxResolution: string;
      watermarkEnabled?: boolean;
    }
  | {
      allowed: false;
      reason: EntitlementDeniedReason;
      message: string;
      upgradePlanId?: string;
    };

// ─── Subscription & Plans Data Model ─────────────────────────────────────────

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "expired";

export interface SubscriptionPlan {
  id: string;
  code: "free" | "supporter" | "premium" | "vip";
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: Record<string, boolean | string | number>;
  active: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  provider: "stripe" | "local_test" | "internal";
  externalSubscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
}
