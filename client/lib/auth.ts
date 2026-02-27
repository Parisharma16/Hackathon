/**
 * Client-side authentication helpers.
 * Only call these from 'use client' components or browser contexts.
 * All cookies are SameSite=Strict so they can be read by the Next.js server layout.
 */

import type { User } from './types';

const MAX_AGE_ACCESS  = 1800;   // 30 min — matches DRF token expiry
const MAX_AGE_REFRESH = 604800; // 7 days
const MAX_AGE_USER    = 86400;  // 1 day

// ── Token helpers ─────────────────────────────────────────────────────────────

/** Read the JWT access token from cookies (browser only; returns null on the server). */
export function getStoredToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(^| )access_token=([^;]+)/);
  return match ? match[2] : null;
}

/** Persist the JWT pair returned by POST /auth/login/. */
export function storeTokens(access: string, refresh: string): void {
  document.cookie = `access_token=${access}; path=/; max-age=${MAX_AGE_ACCESS}; SameSite=Strict`;
  document.cookie = `refresh_token=${refresh}; path=/; max-age=${MAX_AGE_REFRESH}; SameSite=Strict`;
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
