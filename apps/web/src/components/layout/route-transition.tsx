"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, ViewTransition, type ReactNode } from "react";
import { isShellRoute, navDirection } from "@/lib/navigation/direction";

/**
 * Page transitions (animated on phones only, see globals.css).
 *
 * React's <ViewTransition> runs route changes through the browser's View
 * Transitions API: snapshots are animated by the compositor, so it stays smooth
 * even on low-end phones, with no animation library. The direction is written to
 * <html data-nav> during the commit, before the browser starts animating, and CSS
 * picks the matching motion.
 */

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

/** Root level: every route that isn't inside the app shell animates as a whole page. */
export function RouteTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const popped = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useLayoutEffect(() => {
    if (previous.current === pathname) return;
    // iOS already animates its swipe-back gesture; a second slide on top would feel broken.
    const direction = popped.current && isIOS() ? "none" : navDirection(previous.current, pathname);
    document.documentElement.dataset.nav = direction;
    previous.current = pathname;
    popped.current = false;
  }, [pathname]);

  // Inside the app shell the shell persists and only its content animates (PageTransition).
  const key = isShellRoute(pathname) ? "app-shell" : pathname;
  return (
    <ViewTransition key={key} enter="page-in" exit="page-out" default="none">
      <div className="min-h-dvh bg-bg">{children}</div>
    </ViewTransition>
  );
}

/** App shell content: slides under a still header and bottom tab bar. */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ViewTransition key={pathname} enter="page-in" exit="page-out" default="none">
      <div className="bg-bg">{children}</div>
    </ViewTransition>
  );
}
