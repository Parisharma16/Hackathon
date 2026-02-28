/**
 * Central API client — every DRF call goes through here.
 *
 * Base URL is set via NEXT_PUBLIC_DRF_API_URL (see .env.local).
 * Defaults to http://127.0.0.1:8000, matching the API_REFERENCE.txt base URL.
 *
 * All DRF responses are wrapped:  { success, message, data }
 * The `unwrap` helper throws on failure and returns `data` on success.
 */

import { getStoredToken } from '@/lib/auth';
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
} from '@/lib/types';
import {
  MOCK_EVENTS,
  MOCK_LEADERBOARD,
  MOCK_SHOP_ITEMS,
  MOCK_POINTS,
} from '@/lib/mock-data';
import type { ShopItem } from '@/lib/types';

export const API_BASE =
  process.env.NEXT_PUBLIC_DRF_API_URL ?? 'http://127.0.0.1:8000';

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Build Authorization + optional extra headers. */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getStoredToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
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
    const res = await fetch(`${API_BASE}/auth/me/`, {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return await tryUnwrap<User>(res);
  } catch {
    return null;
  }
}

// ── Events ────────────────────────────────────────────────────────────────────

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

/** GET /events/{id}/ */
export async function fetchEvent(id: string): Promise<Event | null> {
  try {
    const res = await fetch(`${API_BASE}/events/${id}/`);
    if (res.ok) return await tryUnwrap<Event>(res);
  } catch { /* fall through */ }
  return MOCK_EVENTS.find((e) => e.id === id) ?? null;
}

/** POST /events/ — organizer/admin only. */
export async function createEvent(payload: CreateEventPayload): Promise<Event> {
  const res = await fetch(`${API_BASE}/events/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
  const res = await fetch(`${API_BASE}/events/${eventId}/winners/`, {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
  const res = await fetch(`${API_BASE}/attendance/mark/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ event_id: eventId, roll_numbers: rollNumbers }),
  });
  return unwrap<MarkAttendanceResponse>(res);
}

// ── Submissions ───────────────────────────────────────────────────────────────

/**
 * POST /submissions/
 * Upload a certificate / CGPA document / paper for admin review.
 * Must be multipart/form-data — do NOT set Content-Type manually (browser handles boundary).
 */
export async function createSubmission(
  eventId: string,
  submissionType: 'certificate' | 'cgpa' | 'paper',
  file: File,
): Promise<Submission> {
  const formData = new FormData();
  formData.append('event', eventId);
  formData.append('submission_type', submissionType);
  formData.append('file_url', file);   // field name per API spec

  const res = await fetch(`${API_BASE}/submissions/`, {
    method: 'POST',
    headers: authHeaders(), // no Content-Type — browser sets multipart boundary
    body: formData,
  });
  return unwrap<Submission>(res);
}

/** GET /submissions/my/ — submissions made by the logged-in user. */
export async function fetchMySubmissions(): Promise<Submission[]> {
  try {
    const res = await fetch(`${API_BASE}/submissions/my/`, {
      headers: authHeaders(),
    });
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
    const res = await fetch(`${API_BASE}/admin/submissions/pending/`, {
      headers: authHeaders(),
    });
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
    const res = await fetch(`${API_BASE}/points/my/`, {
      headers: authHeaders(),
    });
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

// ── Shop (frontend-only; no backend endpoint) ─────────────────────────────────

export async function fetchShopItems(): Promise<ShopItem[]> {
  return MOCK_SHOP_ITEMS;
}

export async function redeemItem(
  /* itemId — will be used when the backend shop endpoint is implemented */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _itemId: string,
): Promise<{ remainingPoints: number }> {
  // Placeholder until a shop endpoint exists on the backend
  throw new Error('Shop redemption endpoint not yet implemented on the server.');
}
