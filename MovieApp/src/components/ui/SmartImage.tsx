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

  const clean = src.trim();

  // If it's already a data URI or SVG fallback, return as-is
  if (clean.startsWith("data:") || clean.startsWith("blob:")) {
    return [clean];
  }

  const candidates: string[] = [];

  // If it's a TMDB image URL, build Cloudflare-backed WebP compressed CDN mirrors
  if (clean.includes("image.tmdb.org")) {
    if (isDataSaver) {
      // ULTRA DATA SAVER: Request ultra-light WebP thumbnail (~8KB - 15KB)
      const targetWidth = fallbackType === "backdrop" ? 480 : 200;
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(clean)}&w=${targetWidth}&output=webp&q=60`;
      candidates.push(proxyUrl);
    } else {
      // High Quality WebP Mirror
      const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(clean)}&output=webp&q=80`;
      candidates.push(proxyUrl);
    }

    // Direct TMDB fallback
    candidates.push(clean);

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
