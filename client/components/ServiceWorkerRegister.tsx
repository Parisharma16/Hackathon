"use client";

import { useEffect } from "react";

/**
 * Registers the CampusEngage service worker in supported browsers.
 * Rendered once in the root layout as a non-visual component.
 *
 * The registration is deferred until after the page load event to avoid
 * competing with critical resources during the initial page paint.
 *
 * Ref: https://nextjs.org/docs/app/guides/progressive-web-apps
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          if (process.env.NODE_ENV === "development") {
            console.log("[SW] Registered — scope:", registration.scope);
          }

          // Proactively check for SW updates on each navigation
          registration.update().catch(() => {
            /* network may be offline – silently ignore */
          });
        })
        .catch((error) => {
          console.error("[SW] Registration failed:", error);
        });
    };

    // Defer SW registration until after the page has loaded
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  // This component renders nothing — it only handles side effects
  return null;
}
