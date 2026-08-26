/**
 * LANTAWON LANG — UNIFIED ENTITLEMENT ENGINE
 * 
 * Centralized entitlement validation service according to Plan Section 52.
 * Never trust raw client flags — evaluates user session, roles, and active subscription.
 */

export type EntitlementResult =
  | "allowed"
  | "requires_login"
  | "requires_subscription"
  | "unavailable_region"
  | "unavailable_source"
  | "unavailable_content";

export type FeatureResource =
  | "catalog_browsing"
  | "basic_search"
  | "local_vault"
  | "standard_streaming"
  | "clean_hd_mirrors"
  | "multi_device_sync"
  | "taste_analytics_ai"
  | "ad_free_experience"
  | "admin_console";

export interface UserSessionState {
  id: string;
  email?: string;
  role: "guest" | "user" | "moderator" | "editor" | "analyst" | "admin" | "super_admin";
  tier: "free" | "solo";
  isLoggedIn: boolean;
  countryCode?: string;
}

export class EntitlementEngine {
  /**
   * Checks whether the current user is entitled to access a specific feature or resource.
   */
  static checkEntitlement(
    user: UserSessionState | null | undefined,
    resource: FeatureResource
  ): EntitlementResult {
    // 1. If user is null or not logged in, evaluate public capabilities
    if (!user || !user.isLoggedIn) {
      if (
        resource === "catalog_browsing" ||
        resource === "basic_search" ||
        resource === "local_vault" ||
        resource === "standard_streaming"
      ) {
        return "allowed";
      }

      if (resource === "admin_console") {
        return "requires_login";
      }

      return "requires_subscription";
    }

    // 2. Super Admin & Admin have blanket access to all system features
    if (user.role === "super_admin" || user.role === "admin") {
      return "allowed";
    }

    // 3. Admin Console Access Check
    if (resource === "admin_console") {
      if (
        user.role === "moderator" ||
        user.role === "editor" ||
        user.role === "analyst"
      ) {
        return "allowed";
      }
      return "requires_subscription";
    }

    // 4. Pro-tier subscriber capabilities
    if (user.tier === "solo") {
      return "allowed";
    }

    // 5. Free-tier capabilities
    if (
      resource === "catalog_browsing" ||
      resource === "basic_search" ||
      resource === "local_vault" ||
      resource === "standard_streaming"
    ) {
      return "allowed";
    }

    // 6. Pro features requested by free user
    if (
      resource === "clean_hd_mirrors" ||
      resource === "multi_device_sync" ||
      resource === "taste_analytics_ai" ||
      resource === "ad_free_experience"
    ) {
      return "requires_subscription";
    }

    return "allowed";
  }

  /**
   * Returns a friendly human explanation for a blocked entitlement.
   */
  static getEntitlementMessage(result: EntitlementResult): string {
    switch (result) {
      case "requires_login":
        return "Please sign in to access this feature.";
      case "requires_subscription":
        return "This feature is unlocked exclusively for Lantawon Pro members.";
      case "unavailable_region":
        return "This title is not currently available in your selected territory.";
      case "unavailable_source":
        return "The requested playback source is currently offline.";
      case "unavailable_content":
        return "Content restrictions prevent loading this title.";
      default:
        return "Access granted.";
    }
  }
}
