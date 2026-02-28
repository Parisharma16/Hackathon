'use server';

/**
 * Server Actions for the admin submission-review workflow.
 *
 * Approve: POST /admin/submissions/{id}/approve/
 *   Body:  { "points": <integer, min 1>, "remarks": "<optional string>" }
 *
 * Reject:  POST /admin/submissions/{id}/reject/
 *   Body:  { "remarks": "<optional string>" }
 *
 * DRF_API_URL uses the server-only env var (no NEXT_PUBLIC_ prefix) so the
 * backend URL is never exposed in client bundles.
 * The admin's JWT is read from the access_token cookie that was set at login.
 */

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const DRF_API_URL = process.env.DRF_API_URL ?? 'http://127.0.0.1:8000';

export async function approveSubmission(
  submissionId: string,
  points: number,
  remarks?: string,
): Promise<{ success: boolean; message: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const res = await fetch(
    `${DRF_API_URL}/admin/submissions/${submissionId}/approve/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      // points is required by the backend (min 1).
      // remarks is optional but always included so the backend receives a
      // well-formed body regardless.
      body: JSON.stringify({ points, remarks: remarks ?? '' }),
    },
  );

  const json = await res.json().catch(() => ({ success: false, message: 'Server error.' }));

  if (json.success) {
    // Bust the admin page cache so the submission disappears on the next load.
    revalidatePath('/dashboard/admin');
  }

  return { success: json.success, message: json.message };
}

export async function rejectSubmission(
  submissionId: string,
  remarks?: string,
): Promise<{ success: boolean; message: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const res = await fetch(
    `${DRF_API_URL}/admin/submissions/${submissionId}/reject/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ remarks: remarks ?? '' }),
    },
  );

  const json = await res.json().catch(() => ({ success: false, message: 'Server error.' }));

  if (json.success) {
    // Bust the admin page cache so the submission disappears on the next load.
    revalidatePath('/dashboard/admin');
  }

  return { success: json.success, message: json.message };
}
