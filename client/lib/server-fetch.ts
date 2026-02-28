/**
 * Server-side authenticated fetch helpers.
 *
 * IMPORTANT: This module imports from 'next/headers' which is only available
 * inside React Server Components and Route Handlers.  Never import this file
 * from a 'use client' component.
 *
 * Rationale: auth tokens (access_token / refresh_token) are stored as browser
 * cookies via document.cookie in lib/auth.ts.  On the server, document is
 * undefined so authorizedFetch in lib/api.ts always falls back to mock data.
 * These helpers read the same cookies via the Next.js server API instead.
 */

import { cookies } from 'next/headers';

import { API_BASE } from '@/lib/api';
import type { ApiEnvelope } from '@/lib/types';

/**
 * Perform a GET request with the access_token cookie attached as a Bearer
 * header.  Returns the raw Response so callers can decide how to parse it.
 * Passes cache: 'no-store' so user-specific data is always fresh.
 */
export async function serverGet(path: string): Promise<Response> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? null;
  return fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
}

/**
 * Perform a server-side GET and unwrap the standard DRF envelope.
 * Returns the `data` field on success, or `null` if the request fails
 * (network error, 401, non-success JSON).  Callers should supply a fallback.
 *
 * @example
 *   const points = await serverUnwrap<PointsData>('/points/my/') ?? FALLBACK;
 */
export async function serverUnwrap<T>(path: string): Promise<T | null> {
  try {
    const res = await serverGet(path);
    if (!res.ok) return null;
    const json: ApiEnvelope<T> = await res.json();
    return json.success ? json.data : null;
  } catch {
    return null;
  }
}
