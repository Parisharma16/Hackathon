/**
 * Offline fallback page — served by the service worker when
 * the user navigates to a page that isn't cached and the network is unavailable.
 */
export const metadata = {
  title: "You're offline",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#1a1a2e] px-6 text-center text-white">
      {/* Icon */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-5xl">
        📡
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">You&apos;re offline</h1>
        <p className="max-w-sm text-white/60">
          It looks like you&apos;ve lost your internet connection. Check your
          network and try again.
        </p>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="rounded-lg bg-[#e2b96f] px-6 py-3 font-semibold text-[#1a1a2e] transition hover:bg-[#c9a050] active:scale-95"
      >
        Try again
      </button>
    </main>
  );
}
