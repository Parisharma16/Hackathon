/**
 * Central API client — every DRF call goes through here.
 *
 * Base URL is set via NEXT_PUBLIC_DRF_API_URL (see .env.local).
 * Defaults to http://127.0.0.1:8000, matching the API_REFERENCE.txt base URL.
 *
 * All DRF responses are wrapped:  { success, message, data }
 * The `unwrap` helper throws on failure and returns `data` on success.
 */

import { getStoredToken, refreshAccessToken, clearTokens } from '@/lib/auth';
import type {
  Event,
  CreateEventPayload,
  MarkAttendanceResponse,
  Submission,
  PendingSubmission,
  PointsData,
  LeaderboardEntry,
  ApiEnvelope,
  User,
  ShopItem,
  Redemption,
  RedeemResult,
} from '@/lib/types';
import {
  MOCK_EVENTS,
  MOCK_LEADERBOARD,
  MOCK_SHOP_ITEMS,
  MOCK_POINTS,
} from '@/lib/mock-data';

export const API_BASE =
  process.env.NEXT_PUBLIC_DRF_API_URL ?? 'http://127.0.0.1:8000';

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Perform an authenticated fetch.
 * Attaches the current JWT access token as a Bearer header.
 * On a 401 response, attempts a single token refresh and retries.
 * If the refresh also fails, clears all auth cookies and returns the 401 response
 * so the caller can propagate the error naturally.
 *
 * Pass any extra headers (e.g. Content-Type) in init.headers; do NOT manually
 * include Authorization — this function handles that.
 */
async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const buildHeaders = (token: string | null): Record<string, string> => ({
    ...(init.headers as Record<string, string> | undefined ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });

  const firstResponse = await fetch(input, { ...init, headers: buildHeaders(getStoredToken()) });

  // Happy path — return immediately for any non-401 status.
  if (firstResponse.status !== 401) return firstResponse;

  // Access token has expired — attempt a refresh and retry once.
  const newToken = await refreshAccessToken();
  if (!newToken) {
    // Refresh token is missing or rejected; wipe stale cookies so the
    // middleware will redirect to /login on the next navigation.
    clearTokens();
    return firstResponse;
  }

  return fetch(input, { ...init, headers: buildHeaders(newToken) });
}

/**
 * Unwrap the DRF envelope { success, message, data }.
 * Throws a descriptive Error on success=false or non-OK HTTP status.
 */
async function unwrap<T>(res: Response): Promise<T> {
  let json: ApiEnvelope<T>;
  try {
    json = await res.json();
  } catch {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  if (!json.success) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json.data;
}

/**
 * Same as unwrap but returns null instead of throwing when the server is
 * unreachable — allows pages to fall back to mock data gracefully.
 */
async function tryUnwrap<T>(res: Response): Promise<T | null> {
  try {
    return await unwrap<T>(res);
  } catch {
    return null;
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/** GET /auth/me/ — fetch the currently logged-in user's profile. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const res = await authorizedFetch(`${API_BASE}/auth/me/`);
    if (!res.ok) return null;
    return await tryUnwrap<User>(res);
  } catch {
    return null;
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

/** GET /events/{id}/ — public, returns a single event or null if not found. */
export async function fetchEvent(id: string): Promise<Event | null> {
  try {
    const res = await fetch(`${API_BASE}/events/${id}/`);
    if (res.ok) return await tryUnwrap<Event>(res);
  } catch { /* fall through */ }
  return MOCK_EVENTS.find((e) => e.id === id) ?? null;
}

/** GET /events/ — public, no auth required. */
export async function fetchEvents(): Promise<Event[]> {
  try {
    const res = await fetch(`${API_BASE}/events/`);
    if (res.ok) {
      const data = await tryUnwrap<Event[]>(res);
      if (data) return data;
    }
  } catch { /* fall through */ }
  return MOCK_EVENTS;
}

/** POST /events/ — organizer/admin only. */
export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  const res = await authorizedFetch(`${API_BASE}/events/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return unwrap<Event>(res);
}

/**
 * POST /events/upload-banner/
 * Uploads an image file to Supabase via the backend and returns the public URL.
 * No database record is created — the returned URL is then passed as banner_url
 * when creating or patching an event.
 * Accepts jpg, jpeg, png, webp up to 5 MB.
 */
export async function uploadEventBanner(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  // Do not set Content-Type — the browser must set the multipart boundary.
  const res = await authorizedFetch(`${API_BASE}/events/upload-banner/`, {
    method: 'POST',
    body: formData,
  });
  const data = await unwrap<{ url: string }>(res);
  return data.url;
}

/**
 * PATCH /events/{id}/ — organizer/admin only.
 * Partial update: only the fields present in payload are changed.
 */
export async function updateEvent(id: string, payload: Partial<CreateEventPayload>): Promise<Event> {
  const res = await authorizedFetch(`${API_BASE}/events/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return unwrap<Event>(res);
}

/**
 * PATCH /events/{id}/winners/
 * Set (or update) the winner list for a completed event.
 */
export async function setEventWinners(
  eventId: string,
  winnersRollNos: string[],
): Promise<Event> {
  const res = await authorizedFetch(`${API_BASE}/events/${eventId}/winners/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winners_roll_nos: winnersRollNos }),
  });
  return unwrap<Event>(res);
}

// ── Attendance ────────────────────────────────────────────────────────────────

/**
 * POST /attendance/mark/
 * Submit the roll numbers collected by the face-recognition microservice.
 * Duplicate entries are silently skipped by the backend.
 */
export async function markAttendance(
  eventId: string,
  rollNumbers: string[],
): Promise<MarkAttendanceResponse> {
  const res = await authorizedFetch(`${API_BASE}/attendance/mark/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_id: eventId, roll_numbers: rollNumbers }),
  });
  return unwrap<MarkAttendanceResponse>(res);
}

// ── Submissions ───────────────────────────────────────────────────────────────

/**
 * POST /submissions/upload/
 * Upload a certificate / CGPA document / paper for admin review.
 * Must be multipart/form-data — do NOT set Content-Type manually (browser sets boundary).
 */
export async function createSubmission(
  submissionType: 'certificate' | 'cgpa' | 'paper',
  file: File,
): Promise<Submission> {
  const formData = new FormData();
  formData.append('submission_type', submissionType);
  formData.append('file', file);

  // Do not include Content-Type here; the browser must set the multipart boundary.
  const res = await authorizedFetch(`${API_BASE}/submissions/upload/`, {
    method: 'POST',
    body: formData,
  });
  return unwrap<Submission>(res);
}

/** GET /submissions/my/ — submissions made by the logged-in user. */
export async function fetchMySubmissions(): Promise<Submission[]> {
  try {
    const res = await authorizedFetch(`${API_BASE}/submissions/my/`);
    if (res.ok) {
      const data = await tryUnwrap<Submission[]>(res);
      if (data) return data;
    }
  } catch { /* fall through */ }
  return [];
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/** GET /admin/submissions/pending/ — admin only. */
export async function fetchPendingSubmissions(): Promise<PendingSubmission[]> {
  try {
    const res = await authorizedFetch(`${API_BASE}/admin/submissions/pending/`);
    if (res.ok) {
      const data = await tryUnwrap<PendingSubmission[]>(res);
      if (data) return data;
    }
  } catch { /* fall through */ }
  return [];
}

// ── Points ────────────────────────────────────────────────────────────────────

/** GET /points/my/ — total points + full ledger history. */
export async function fetchMyPoints(): Promise<PointsData> {
  try {
    const res = await authorizedFetch(`${API_BASE}/points/my/`);
    if (res.ok) {
      const data = await tryUnwrap<PointsData>(res);
      if (data) return data;
    }
  } catch { /* fall through */ }
  return MOCK_POINTS;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

/**
 * GET /points/leaderboard/ — public, no auth required.
 * Year filtering is done client-side (the backend returns all students).
 */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/points/leaderboard/`);
    if (res.ok) {
      const data = await tryUnwrap<LeaderboardEntry[]>(res);
      if (data) return data;
    }
  } catch { /* fall through */ }
  return MOCK_LEADERBOARD;
}

// ── Shop ──────────────────────────────────────────────────────────────────────

/**
 * GET /shop/items/
 * Public endpoint — no auth required.
 * Falls back to mock data when the server is unreachable so local development
 * without a running backend still renders the shop page.
 */
export async function fetchShopItems(): Promise<ShopItem[]> {
  try {
    const res = await fetch(`${API_BASE}/shop/items/`);
    if (res.ok) {
      const data = await tryUnwrap<ShopItem[]>(res);
      if (data) return data;
    }
  } catch { /* fall through to mock */ }
  return MOCK_SHOP_ITEMS;
}

/**
 * POST /shop/items/<id>/redeem/
 * Deducts points from the user's balance, decrements item stock, and returns
 * the unique redemption code along with the updated point balance.
 */
export async function redeemItem(itemId: string): Promise<RedeemResult> {
  const res = await authorizedFetch(`${API_BASE}/shop/items/${itemId}/redeem/`, {
    method: 'POST',
  });
  return unwrap<RedeemResult>(res);
}

/**
 * GET /shop/redemptions/my/
 * Returns all past redemptions for the currently authenticated user.
 * Returns an empty array when the server is unreachable.
 */
export async function fetchMyRedemptions(): Promise<Redemption[]> {
  try {
    const res = await authorizedFetch(`${API_BASE}/shop/redemptions/my/`);
    if (res.ok) {
      const data = await tryUnwrap<Redemption[]>(res);
      if (data) return data;
    }
  } catch { /* fall through */ }
  return [];
}
