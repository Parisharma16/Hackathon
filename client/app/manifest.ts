import type { MetadataRoute } from "next";

/**
 * Next.js native Web App Manifest
 * Served at /manifest.webmanifest by the framework automatically.
 * Ref: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CampusEngage",
    short_name: "CampusEngage",
    description:
      "Track and gamify your complete campus journey beyond academics. Get recognised for participation in technical societies, cultural clubs, sports, and leadership activities.",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1a2e",
    theme_color: "#1a1a2e",
    categories: ["education", "productivity", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192x192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: "Leaderboard",
        short_name: "Leaderboard",
        description: "View the campus leaderboard",
        url: "/dashboard/leaderboard",
        icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
      },
      {
        name: "Shop",
        short_name: "Shop",
        description: "Redeem your campus points",
        url: "/dashboard/shop",
        icons: [{ src: "/icons/icon-192x192.svg", sizes: "192x192" }],
      },
    ],
  };
}
