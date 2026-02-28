"use client";

import { useEffect, useState } from "react";

/**
 * Captures the browser's `beforeinstallprompt` event and renders a
 * bottom-sheet style install banner with Accept / Dismiss actions.
 *
 * Behaviour:
 *  - Hidden until the browser fires `beforeinstallprompt` (Chrome/Edge/Android).
 *  - Dismissed state is persisted in localStorage so the banner doesn't
 *    reappear on every page visit.
 *  - On iOS Safari the browser doesn't fire the event, so we show a
 *    separate manual-instructions prompt instead.
 *
 * Ref: https://web.dev/articles/customize-install
 */

// Extend the standard Event type to include the non-standard prompt() method
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export default function InstallPromptBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show if user already dismissed
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // Detect if already running as installed PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in window.navigator &&
        (window.navigator as { standalone?: boolean }).standalone === true);

    setIsInStandaloneMode(standalone);
    if (standalone) return; // already installed — nothing to show

    // Detect iOS Safari (no beforeinstallprompt support)
    const ios =
      /iphone|ipad|ipod/i.test(navigator.userAgent) &&
      !("MSStream" in window);
    setIsIos(ios);

    if (ios) {
      // Show manual iOS instructions after a short delay
      const t = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(t);
    }

    // Listen for Chrome / Edge / Android install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISSED_KEY, "true");
  };

  if (!visible || isInStandaloneMode) return null;

  /* ─── iOS Manual Instruction Sheet ───────────────────────────────────── */
  if (isIos) {
    return (
      <div
        role="dialog"
        aria-label="Install CampusEngage"
        className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up rounded-t-2xl bg-white shadow-2xl dark:bg-[#1a1a2e]"
      >
        <div className="mx-auto max-w-md px-6 pb-8 pt-5">
          {/* Drag handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-white/20" />

          <div className="flex items-start gap-4">
            {/* App icon */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/apple-touch-icon.svg"
              alt="CampusEngage icon"
              className="h-14 w-14 flex-shrink-0 rounded-2xl border border-gray-100 dark:border-white/10"
            />
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">
                Install CampusEngage
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-white/60">
                Tap{" "}
                <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                  Share&nbsp;
                  <svg
                    className="inline h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l-4 4h3v7h2V6h3L12 2zm-7 13v5h14v-5h-2v3H7v-3H5z" />
                  </svg>
                </span>{" "}
                then{" "}
                <span className="font-medium text-blue-600">
                  Add to Home Screen
                </span>{" "}
                to install this app.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="mt-5 w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            Maybe later
          </button>
        </div>
      </div>
    );
  }

  /* ─── Chrome / Edge / Android Install Banner ──────────────────────────── */
  return (
    <div
      role="dialog"
      aria-label="Install CampusEngage"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-slide-up rounded-2xl bg-[#1a1a2e] p-4 shadow-2xl"
    >
      <div className="flex items-center gap-4">
        {/* App icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192x192.svg"
          alt="CampusEngage icon"
          className="h-12 w-12 flex-shrink-0 rounded-xl"
        />

        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-white">CampusEngage</p>
          <p className="text-xs text-white/60">
            Install for a faster, app-like experience
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        className="mt-3 w-full rounded-xl bg-[#e2b96f] py-2.5 text-sm font-semibold text-[#1a1a2e] transition hover:bg-[#c9a050] active:scale-95"
      >
        Install App
      </button>
    </div>
  );
}
