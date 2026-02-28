/**
 * TypeScript types that exactly mirror the Django REST Framework API contract.
 * See API_REFERENCE.txt for the authoritative field definitions.
 */

// ── Roles & scalar unions ─────────────────────────────────────────────────────

export type UserRole       = 'student' | 'organizer' | 'admin';
export type EventType      = 'academic' | 'cocurricular' | 'extracurricular';
export type SubmissionType = 'certificate' | 'cgpa' | 'paper';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';
export type PointSource    = 'attendance' | 'winner' | 'certificate' | 'cgpa' | 'paper';

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
  location:              string;
  points_per_participant: number;
  winner_points:         number;
  winners_roll_nos:      string[];
  created_by:            EventCreator;
  created_at:            string;
}

/** Payload for POST /events/ */
export interface CreateEventPayload {
  title:                 string;
  type:                  EventType;
  organized_by:          string;
  date:                  string;   // "YYYY-MM-DD"
  location:              string;
  points_per_participant: number;
  winner_points:         number;
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
  event:           string;
  event_title:     string;
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
  year:         number;
  total_points: number;
}

// ── Shop (frontend-only feature; no backend endpoint yet) ─────────────────────

export interface ShopItem {
  id:          string;
  name:        string;
  description: string;
  points_cost: number;
  category:    string;
  image_url?:  string;
  stock:       number;
}
