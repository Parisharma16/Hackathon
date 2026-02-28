import type { NextConfig } from "next";

/**
 * Next.js configuration with PWA-ready HTTP headers.
 *
 * Key additions:
 *  - Service-Worker-Allowed header so the SW can control the full origin scope.
 *  - X-Content-Type-Options / X-Frame-Options for baseline security.
 *  - Cache-Control for manifest & icons so browsers keep them fresh.
 */
const nextConfig: NextConfig = {
  /* ─── Image Domains ────────────────────────────────────────────────────── */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Supabase Storage — covers all project subdomains (*.supabase.co)
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  /* ─── HTTP Headers ─────────────────────────────────────────────────────── */
  async headers() {
    return [
      // Allow the service worker to control the entire origin
      {
        source: "/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            // SW must always be validated by the network — never served stale
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
      // Manifest — revalidate daily
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
      // PWA icons — cache for 7 days
      {
        source: "/icons/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=2592000",
          },
        ],
      },
      // Baseline security headers for all routes
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
