"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TMDB_IMAGE_CONFIG } from "@/lib/config/tmdb-images";

export interface SmartImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src?: string | null;
  fallbackSrc?: string;
  fallbackType?: "poster" | "backdrop" | "avatar";
  aspectRatio?: string;
  containerClassName?: string;
}

/**
 * Checks if the user's browser or device has Data Saver enabled.
 */
function isDataSaverActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const nav = navigator as any;
    if (
      nav.connection &&
      (nav.connection.saveData ||
        nav.connection.effectiveType === "2g" ||
        nav.connection.effectiveType === "3g")
    ) {
      return true;
    }
    return localStorage.getItem("data_saver_mode") === "true";
  } catch {
    return false;
  }
}

// Candidate widths handed to the browser as a srcSet. Phones and tablets pick
// the small end, desktops the large end, so a poster grid on a phone pulls
// ~15KB per card instead of re-encoding a full-size TMDB original. Previously
// there was no srcSet at all: every device downloaded the same heavy proxy
// request, and on mobile connections enough of them timed out that the error
// cascade landed on the grey SVG placeholder — the "all cards look default on
// mobile but fine on desktop" report.
const PROXY_WIDTHS: Record<"poster" | "backdrop" | "avatar", number[]> = {
  poster: [154, 200, 342, 500],
  backdrop: [320, 480, 780, 1280],
  avatar: [64, 96, 185],
};

// Avatars are deliberately absent: they range from a 24px menu bubble to a
// 192px cast portrait, and TMDB only serves w185 anyway. With no `sizes` the
// browser takes the widest rung, which is exactly today's behaviour.
const DEFAULT_SIZES: Partial<
  Record<"poster" | "backdrop" | "avatar", string>
> = {
  poster: "(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 220px",
  backdrop: "(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 780px",
};

function proxyUrl(clean: string, width: number, quality: number): string {
  return `https://wsrv.nl/?url=${encodeURIComponent(
    clean
  )}&w=${width}&output=webp&q=${quality}`;
}

function buildProxySrcSet(
  clean: string,
  fallbackType: "poster" | "backdrop" | "avatar",
  isDataSaver: boolean
): string {
  const widths = isDataSaver
    ? PROXY_WIDTHS[fallbackType].slice(0, 2)
    : PROXY_WIDTHS[fallbackType];
  const quality = isDataSaver ? 60 : 78;
  return widths.map((w) => `${proxyUrl(clean, w, quality)} ${w}w`).join(", ");
}

/**
 * Builds an array of resilient, highly compressed WebP fallback URLs.
 */
function buildCandidateUrls(
  src: string | null | undefined,
  defaultFallback: string,
  fallbackType: "poster" | "backdrop" | "avatar",
  isDataSaver = false
): string[] {
  if (!src || typeof src !== "string" || src.trim().length === 0) {
    return [defaultFallback];
  }

  let clean = src.trim();

  // If it's already a data URI or SVG fallback, return as-is
  if (clean.startsWith("data:") || clean.startsWith("blob:")) {
    return [clean];
  }

  // Auto-resolve relative TMDB paths (e.g. "/qW4crBrdhOoxwE1F2s5Wc.jpg")
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    // Check if it's a YouTube ID (11 characters alphanumeric)
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      clean = `https://img.youtube.com/vi/${clean}/hqdefault.jpg`;
    } else if (clean.startsWith("/")) {
      const base =
        fallbackType === "backdrop"
          ? TMDB_IMAGE_CONFIG.BACKDROP_BASE
          : fallbackType === "avatar"
          ? TMDB_IMAGE_CONFIG.PROFILE_BASE
          : TMDB_IMAGE_CONFIG.POSTER_BASE;
      clean = `${base}${clean}`;
    }
  }

  // Handle YouTube watch / embed URLs to thumbnails
  if (clean.includes("youtube.com/watch?v=") || clean.includes("youtu.be/")) {
    const ytMatch = clean.match(/(?:watch\?v=|youtu\.be\/)([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      const ytId = ytMatch[1];
      return [
        `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
        defaultFallback,
      ];
    }
  }

  const candidates: string[] = [];

  // If it's a TMDB image URL, build Cloudflare-backed WebP compressed CDN mirrors
  if (clean.includes("image.tmdb.org")) {
    // Direct TMDB original
    candidates.push(clean);

    // Proxy WebP ladder
    const widths = isDataSaver
      ? PROXY_WIDTHS[fallbackType].slice(0, 2)
      : PROXY_WIDTHS[fallbackType];
    candidates.push(
      proxyUrl(clean, widths[widths.length - 1], isDataSaver ? 60 : 78)
    );

    // Lighter TMDB resolution fallback
    if (clean.includes("/w780/") || clean.includes("/w1280/") || clean.includes("/original/")) {
      const lighterUrl = clean.replace(/\/(w780|w1280|original)\//, "/w500/");
      candidates.push(lighterUrl);
    }
  } else {
    candidates.push(clean);
  }

  candidates.push(defaultFallback);
  return candidates;
}

export function SmartImage({
  src,
  fallbackSrc,
  fallbackType = "poster",
  alt = "Media cover",
  className = "",
  containerClassName = "",
  ...rest
}: SmartImageProps) {
  const defaultFallback = useMemo(() => {
    return (
      fallbackSrc ||
      (fallbackType === "backdrop"
        ? TMDB_IMAGE_CONFIG.FALLBACK_BACKDROP
        : fallbackType === "avatar"
        ? TMDB_IMAGE_CONFIG.FALLBACK_AVATAR
        : TMDB_IMAGE_CONFIG.FALLBACK_POSTER)
    );
  }, [fallbackSrc, fallbackType]);

  const [isDataSaver, setIsDataSaver] = useState(false);

  // Sync data saver state on client after mount (prevents SSR hydration mismatch)
  useEffect(() => {
    setIsDataSaver(isDataSaverActive());

    const handleDataSaverChange = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsDataSaver(Boolean(customEvent.detail));
    };

    window.addEventListener("data_saver_changed", handleDataSaverChange);
    return () => window.removeEventListener("data_saver_changed", handleDataSaverChange);
  }, []);

  const candidates = useMemo(
    () => buildCandidateUrls(src, defaultFallback, fallbackType, isDataSaver),
    [src, defaultFallback, fallbackType, isDataSaver]
  );

  const [candidateIndex, setCandidateIndex] = useState(0);

  // Reset candidate index when candidates change
  useEffect(() => {
    setCandidateIndex(0);
  }, [candidates]);

  const currentSrc = candidates[candidateIndex] || defaultFallback;

  // The srcSet only describes the wsrv proxy ladder. Once the cascade has
  // fallen through to a direct TMDB URL or the SVG placeholder it must be
  // dropped, or the browser would keep re-picking the proxy that just failed.
  const srcSet =
    candidateIndex === 0 && src && currentSrc.startsWith("https://wsrv.nl/")
      ? buildProxySrcSet(src.trim(), fallbackType, isDataSaver)
      : undefined;

  const handleError = useCallback(() => {
    setCandidateIndex((prev) => {
      if (prev + 1 < candidates.length) {
        return prev + 1;
      }
      return prev;
    });
  }, [candidates.length]);

  const imgElement = (
    <img
      src={currentSrc}
      srcSet={srcSet}
      sizes={srcSet ? DEFAULT_SIZES[fallbackType] : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={handleError}
      className={className}
      suppressHydrationWarning
      {...rest}
    />
  );

  if (containerClassName && containerClassName.trim().length > 0) {
    const finalContainerClass = containerClassName.includes("overflow-hidden")
      ? containerClassName
      : `${containerClassName} overflow-hidden`;
    return <div className={finalContainerClass}>{imgElement}</div>;
  }

  return imgElement;
}
