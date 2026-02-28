/**
 * generate-icons.mjs
 *
 * Converts the SVG source icons to PNG files required for full PWA
 * browser compatibility (especially iOS Safari, older Android WebView).
 *
 * Usage:
 *   node scripts/generate-icons.mjs
 *
 * Requirements:
 *   npm install --save-dev sharp
 */

import sharp from "sharp";
import { readFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../public");

const icons = [
  {
    input: `${publicDir}/icons/icon-192x192.svg`,
    output: `${publicDir}/icons/icon-192x192.png`,
    size: 192,
  },
  {
    input: `${publicDir}/icons/icon-512x512.svg`,
    output: `${publicDir}/icons/icon-512x512.png`,
    size: 512,
  },
  {
    input: `${publicDir}/icons/apple-touch-icon.svg`,
    output: `${publicDir}/icons/apple-touch-icon.png`,
    size: 180,
  },
];

// Ensure output directory exists
mkdirSync(`${publicDir}/icons`, { recursive: true });

for (const { input, output, size } of icons) {
  const svg = readFileSync(input);
  await sharp(svg).resize(size, size).png().toFile(output);
  console.log(`✓ Generated ${output}`);
}

console.log("\n✅ All PWA icons generated as PNG.");
console.log(
  "   Update app/manifest.ts and app/layout.tsx to reference .png instead of .svg."
);
