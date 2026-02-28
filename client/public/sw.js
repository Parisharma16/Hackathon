/**
 * CampusEngage Service Worker  — v2
 *
 * Caching strategies:
 *  - Static assets  → Cache-First  (JS, CSS, images, fonts)
 *  - API routes     → Network-First (always try network, fall back to cache)
 *  - Pages / HTML   → Stale-While-Revalidate
 *
 * IMPORTANT: redirected responses are never cached or returned to the browser.
 * Returning a response where response.redirected === true for a request whose
 * redirect mode is not "follow" causes an ERR_FAILED network error in Chrome.
 * This is why "/" (which server-redirects to /dashboard) is NOT pre-cached,
 * and every caching function guards with !response.redirected.
 *
 * Ref: https://web.dev/articles/service-worker-caching-and-http-caching
 */

// Bump CACHE_VERSION whenever the SW logic changes so old caches are purged.
const CACHE_VERSION = "v2";
const CACHE_NAME = `campus-engage-${CACHE_VERSION}`;

/**
 * Only pre-cache URLs that are guaranteed to return real 200 responses
 * (no server-side redirects, no auth-gated routes).
 * "/" redirects to "/dashboard" → omitted.
 * "/dashboard/*" require auth cookies the SW doesn't have at install time → omitted.
 */
const PRECACHE_URLS = ["/offline"];

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch Interception ───────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin requests (analytics, external CDNs, Supabase, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip ALL Next.js internals:
  //   /_next/webpack-hmr  — HMR websocket
  //   /_next/static/      — hashed bundles (handled by Cache-First below)
  //   /_next/image        — image optimisation proxy
  //   /_next/data/        — getServerSideProps / RSC payload
  // We let Next.js's own router handle RSC prefetch requests; intercepting them
  // with a SW that returns a "redirected" response triggers ERR_FAILED.
  if (url.pathname.startsWith("/_next/")) {
    // Exception: static hashed assets are safe to Cache-First
    if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(cacheFirst(request));
    }
    // All other /_next/* — pass through untouched
    return;
  }

  // Skip Next.js RSC / prefetch requests (special headers set by the router).
  // These requests may have redirect: "error" mode internally, so returning
  // a redirected fetch() response from the SW would cause ERR_FAILED.
  if (
    request.headers.get("RSC") === "1" ||
    request.headers.get("Next-Router-Prefetch") === "1" ||
    request.headers.get("Next-Router-State-Tree")
  ) {
    return;
  }

  // Strategy: Network-First → API routes
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Strategy: Cache-First → Static assets (hashed filenames are immutable)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Strategy: Stale-While-Revalidate → Pages & everything else
  event.respondWith(staleWhileRevalidate(request));
});

// ─── Caching Strategies ───────────────────────────────────────────────────────

/**
 * Cache-First: Return cached response immediately; fetch & update in background.
 * Best for versioned/hashed static assets that rarely change.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Guard: never cache redirected or error responses.
    // A redirected response returned to a request with redirect != "follow"
    // causes an ERR_FAILED network error in the browser.
    if (response.ok && !response.redirected) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Asset not available offline.", { status: 503 });
  }
}

/**
 * Network-First: Always try the network; fall back to cache on failure.
 * Best for API routes where freshness matters.
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    // Guard: never cache redirects — they would break replay.
    if (response.ok && !response.redirected) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    return new Response(
      JSON.stringify({ error: "You appear to be offline." }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Stale-While-Revalidate: Return cached version immediately, then update cache.
 * Best for pages — fast load with background freshness.
 *
 * CRITICAL: if the network response is a redirect (response.redirected === true),
 * we do NOT cache it and do NOT return it as the SW response. Instead we fall
 * through to the network so the browser can handle the redirect natively.
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok && !response.redirected) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached ?? offlineFallback());

  // If we have a cached copy, return it immediately and revalidate in background.
  // If there is NO cached copy AND the network fetch returns a redirect, the
  // browser receives that redirect and follows it natively — no ERR_FAILED.
  return cached ?? fetchPromise;
}

/**
 * Returns the offline fallback page stored in the cache.
 */
async function offlineFallback() {
  const cache = await caches.open(CACHE_NAME);
  const fallback = await cache.match("/offline");
  return (
    fallback ??
    new Response("<h1>You are offline</h1>", {
      headers: { "Content-Type": "text/html" },
    })
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns true for file types that benefit from Cache-First strategy. */
function isStaticAsset(pathname) {
  return /\.(?:js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp|avif)$/.test(
    pathname
  );
}
