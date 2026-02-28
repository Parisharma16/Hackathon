/**
 * TypeScript types that exactly mirror the Django REST Framework API contract.
 * See API_REFERENCE.txt for the authoritative field definitions.
 */

// ── Roles & scalar unions ─────────────────────────────────────────────────────

export type UserRole       = 'student' | 'organizer' | 'admin';
export type EventType      = 'academic' | 'cocurricular' | 'extracurricular';
export type SubmissionType = 'certificate' | 'cgpa' | 'paper';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type PointSource    = 'attendance' | 'winner' | 'certificate' | 'cgpa' | 'paper' | 'redemption';

// ── API envelope ──────────────────────────────────────────────────────────────
// Every DRF response is: { success, message, data }

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id:           string;
  roll_no:      string;
  name:         string;
  email:        string;
  role:         UserRole;
  year?:        number;
  branch?:      string;
  total_points: number;
  /** Supabase public URL set by the client at registration time. Null when not uploaded. */
  profile_pic?: string | null;
  created_at?:  string;
  updated_at?:  string;
}

/** Shape of data returned by POST /auth/login/ */
export interface LoginData {
  access:  string;
  refresh: string;
  user:    User;
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface EventCreator {
  id:      string;
  roll_no: string;
  name:    string;
  email:   string;
  role:    UserRole;
}

export interface Event {
  id:                    string;
  title:                 string;
  type:                  EventType;
  organized_by:          string;
  date:                  string;   // "YYYY-MM-DD"
  /** Optional start time returned as "HH:MM:SS" by the backend. Null when not set. */
  time?:                 string | null;
  location:              string;
  points_per_participant: number;
  winner_points:         number;
  winners_roll_nos:      string[];
  /** Supabase public URL for the event banner image. Null when not uploaded. */
  banner_url?:           string | null;
  created_by:            EventCreator;
  created_at:            string;
}

/** Payload for POST /events/ and PATCH /events/{id}/ */
export interface CreateEventPayload {
  title:                 string;
  type:                  EventType;
  organized_by:          string;
  date:                  string;   // "YYYY-MM-DD"
  /** Optional start time in "HH:MM" format (from <input type="time">). */
  time?:                 string;
  location:              string;
  points_per_participant: number;
  winner_points:         number;
  /** Optional Supabase public URL — set automatically after banner upload. */
  banner_url?:           string;
}

// ── Attendance ────────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id:          string;
  event:       string;
  event_title: string;
  event_date:  string;
  event_type:  EventType;
  marked_at:   string;
}

export interface MarkAttendanceResponse {
  marked_count:         number;
  skipped_roll_numbers: string[];
}

// ── Submissions ───────────────────────────────────────────────────────────────

export interface Submission {
  id:              string;
  /**
   * Present in the admin pending-submissions response.
   * Not included in GET /submissions/my/ (the student-facing endpoint).
   */
  event?:          string;
  event_title?:    string;
  submission_type: SubmissionType;
  file_url:        string;
  status:          SubmissionStatus;
  uploaded_at:     string;
}

/** Admin view — extends Submission with submitter info */
export interface PendingSubmission extends Submission {
  submitter_roll_no: string;
  submitter_name:    string;
}

// ── Points / Ledger ───────────────────────────────────────────────────────────

export interface LedgerEntry {
  id:          string;
  event:       string;
  event_title: string;
  entry_type:  'credit' | 'debit';
  points:      number;
  reason:      string;
  source:      PointSource;
  created_at:  string;
}

export interface PointsData {
  total_points: number;
  ledger:       LedgerEntry[];
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id:           string;
  roll_no:      string;
  name:         string;
  branch:       string;
  /**
   * The student's academic year (1–4).
   * Null when the user registered without providing a year value.
   * These entries are excluded from all year tabs on the leaderboard.
   */
  year:         number | null;
  total_points: number;
}

// ── Shop ──────────────────────────────────────────────────────────────────────

export interface ShopItem {
  id:          string;
  name:        string;
  description: string;
  points_cost: number;
  category:    string;
  stock:       number;
  is_active?:  boolean;
}

/**
 * A completed redemption record returned by:
 *   GET  /shop/redemptions/my/
 *   POST /shop/items/<id>/redeem/
 */
export interface Redemption {
  id:            string;
  item_id:       string;
  item_name:     string;
  item_category: string;
  points_cost:   number;
  /** Unique code the user presents to collect the reward. */
  code:          string;
  redeemed_at:   string;
}

/**
 * Shape of the data field returned by POST /shop/items/<id>/redeem/.
 * Extends Redemption with the user's updated point balance.
 */
export interface RedeemResult extends Redemption {
  remaining_points: number;
}
