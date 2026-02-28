"use client";

/**
 * Client component — needs 'use client' because it uses an onClick handler.
 * Kept separate so the parent offline/page.tsx can remain a Server Component
 * and export `metadata` without errors.
 */
export default function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="rounded-lg bg-[#e2b96f] px-6 py-3 font-semibold text-[#1a1a2e] transition hover:bg-[#c9a050] active:scale-95"
    >
      Try again
    </button>
  );
}
