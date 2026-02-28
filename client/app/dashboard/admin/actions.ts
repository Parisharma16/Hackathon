'use server';

/**
 * Server Actions for the admin submission-review workflow.
 *
 * POST /admin/submissions/{id}/approve/  → { "remarks": "..." } (optional)
 * POST /admin/submissions/{id}/reject/   → { "remarks": "..." } (optional)
 *
 * DRF_API_URL is a server-only env var (no NEXT_PUBLIC_ prefix) —
 * it is never bundled into client JS.
 */

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';

const DRF_API_URL = process.env.DRF_API_URL ?? 'http://127.0.0.1:8000';

export async function processSubmission(
  submissionId: string,
  action: 'approve' | 'reject',
  remarks?: string,
): Promise<{ success: boolean; message: string }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const res = await fetch(
    `${DRF_API_URL}/admin/submissions/${submissionId}/${action}/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ remarks: remarks ?? '' }),
    },
  );

  const json = await res.json().catch(() => ({ success: false, message: 'Unknown error' }));

  if (json.success) {
    // Bust the cached admin list so the page re-fetches on next render
    revalidateTag('admin-pending-submissions', 'default');
    // Also bust the student ledger cache in case points were awarded
    revalidateTag('student-points', 'default');
  }

  return { success: json.success, message: json.message };
}
