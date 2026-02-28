import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import InstallPromptBanner from "@/components/InstallPromptBanner";

/* ─── Viewport (theme-color, safe-area) ──────────────────────────────────── */

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover", // support for iPhone notch / Dynamic Island
};

/* ─── App Metadata ───────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  // Core
  title: {
    default: "CampusEngage",
    template: "%s | CampusEngage",
  },
  description:
    "Track and gamify your complete campus journey beyond academics. Get recognised for participation in technical societies, cultural clubs, sports, and leadership activities.",

  // PWA / manifest
  manifest: "/manifest.webmanifest",
  applicationName: "CampusEngage",

  // Apple-specific PWA meta tags
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CampusEngage",
    startupImage: [],
  },

  // Icons
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
  },

  // Open Graph (share previews)
  openGraph: {
    type: "website",
    siteName: "CampusEngage",
    title: "CampusEngage",
    description:
      "Track and gamify your complete campus journey beyond academics.",
  },

  // Make the app installable on mobile without a browser UI
  formatDetection: {
    telephone: false,
  },
};

/* ─── Root Layout ────────────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        {/* Registers the service worker after the page load — no render output */}
        <ServiceWorkerRegister />
        {/* Shows install banner on Chrome/Edge/Android; manual tip on iOS */}
        <InstallPromptBanner />
      </body>
    </html>
  );
}
