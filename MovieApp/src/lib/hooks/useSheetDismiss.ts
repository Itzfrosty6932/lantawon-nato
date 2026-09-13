"use client";

import { useEffect, useRef } from "react";

/**
 * Wires a mobile sheet/drawer into the browser history stack so the phone's
 * back gesture closes it.
 *
 * Without this, swiping back on iOS (or pressing Android's back button) while a
 * drawer is open navigates away from the page entirely — the user loses their
 * scroll position and filter state, and there is no way "back" to the list they
 * were looking at. Pushing a synthetic entry on open means the first back lands
 * on `popstate` here and only closes the sheet.
 *
 * Also handles Escape and locks body scroll, since every sheet needs all three
 * and doing it piecemeal is how they drift out of sync.
 */
export function useSheetDismiss(isOpen: boolean, onClose: () => void) {
  // Callers pass inline arrows, so `onClose` is a new function every render.
  // Keeping it in a ref stops the effect from tearing down and re-pushing a
  // history entry on each render — which would otherwise stack up dozens of
  // synthetic entries and make the back gesture need that many presses.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // Marker so popstate can tell our synthetic entry from a real navigation.
    window.history.pushState({ sheet: true }, "");

    const handlePopState = () => onCloseRef.current();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("keydown", handleKeyDown);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;

      // If the sheet was closed by its own button rather than by a back
      // gesture, our synthetic entry is still on the stack — pop it so the
      // user's next back press goes to the real previous page instead of
      // being silently swallowed.
      if (window.history.state?.sheet) {
        window.history.back();
      }
    };
  }, [isOpen]);
}
