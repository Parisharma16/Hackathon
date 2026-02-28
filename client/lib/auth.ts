/**
 * Client-side authentication helpers.
 * Only call these from 'use client' components or browser contexts.
 * All cookies are SameSite=Strict so they can be read by the Next.js server layout.
 */

import type { User } from './types';

const MAX_AGE_ACCESS  = 1800;  // 30 min — matches SIMPLE_JWT ACCESS_TOKEN_LIFETIME
const MAX_AGE_REFRESH = 86400; // 1 day  — matches SIMPLE_JWT REFRESH_TOKEN_LIFETIME
const MAX_AGE_USER    = 86400; // 1 day

// ── Token helpers ─────────────────────────────────────────────────────────────

/** Read the JWT access token from cookies (browser only; returns null on the server). */
export function getStoredToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(^| )access_token=([^;]+)/);
  return match ? match[2] : null;
}

/** Read the JWT refresh token from cookies (browser only; returns null on the server). */
function getStoredRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(^| )refresh_token=([^;]+)/);
  return match ? match[2] : null;
}

/** Persist the JWT pair returned by POST /auth/login/. */
export function storeTokens(access: string, refresh: string): void {
  document.cookie = `access_token=${access}; path=/; max-age=${MAX_AGE_ACCESS}; SameSite=Strict`;
  document.cookie = `refresh_token=${refresh}; path=/; max-age=${MAX_AGE_REFRESH}; SameSite=Strict`;
}

/**
 * Call POST /auth/token/refresh/ with the stored refresh token.
 * On success, stores the new access token cookie and returns the token string.
 * Returns null if the refresh token is missing or the server rejects it.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  const apiBase = process.env.NEXT_PUBLIC_DRF_API_URL ?? 'http://127.0.0.1:8000';
  try {
    const res = await fetch(`${apiBase}/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const newAccess: string | undefined = json.access;
    if (!newAccess) return null;

    // Persist the new access token for the next request.
    document.cookie = `access_token=${newAccess}; path=/; max-age=${MAX_AGE_ACCESS}; SameSite=Strict`;
    return newAccess;
  } catch {
    return null;
  }
}

// ── User-info helpers ─────────────────────────────────────────────────────────

/**
 * Persist the logged-in user's identity so the server-side dashboard layout
 * (and leaderboard year default) can read it from cookies.
 */
export function storeUserInfo(user: User): void {
  document.cookie = `user_role=${user.role}; path=/; max-age=${MAX_AGE_USER}; SameSite=Strict`;
  document.cookie = `user_id=${user.id}; path=/; max-age=${MAX_AGE_USER}; SameSite=Strict`;
  // URI-encode name to safely handle spaces and non-ASCII
  document.cookie = `user_name=${encodeURIComponent(user.name)}; path=/; max-age=${MAX_AGE_USER}; SameSite=Strict`;
  if (user.year !== undefined) {
    document.cookie = `user_year=${user.year}; path=/; max-age=${MAX_AGE_USER}; SameSite=Strict`;
  }
}

/** Clear every auth and user-info cookie (used on logout). */
export function clearTokens(): void {
  const expired = 'path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
  for (const name of ['access_token', 'refresh_token', 'user_role', 'user_id', 'user_name', 'user_year']) {
    document.cookie = `${name}=; ${expired}`;
  }
}
