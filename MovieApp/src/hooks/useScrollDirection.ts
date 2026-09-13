"use client";

import { useState, useEffect, useRef } from "react";

interface UseScrollDirectionOptions {
  threshold?: number;
  topThreshold?: number;
}

export function useScrollDirection({
  threshold = 8,
  topThreshold = 30,
}: UseScrollDirectionOptions = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    lastScrollY.current = window.scrollY;

    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;

      // Always show when close to the top
      if (currentScrollY <= topThreshold) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        ticking.current = false;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // Check if scroll delta exceeds threshold
      if (Math.abs(diff) >= threshold) {
        if (diff > 0) {
          // Scrolling down -> Hide
          setIsVisible(false);
        } else {
          // Scrolling up -> Show
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }

      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [threshold, topThreshold]);

  return isVisible;
}
