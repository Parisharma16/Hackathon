// app/dashboard/admin/page.tsx
// GET /admin/submissions/pending/  — admin only
//
// This page uses serverUnwrap from lib/server-fetch so the admin's JWT is
// forwarded in the Authorization header.  Without it the backend returns 401
// and the list is always empty.
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AdminControls from '@/components/AdminControls';
import { getInitials, formatDate } from '@/lib/utils';
import { serverUnwrap } from '@/lib/server-fetch';
import type { PendingSubmission, UserRole } from '@/lib/types';

// ── Label maps ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  certificate: 'Participation Certificate',
  cgpa:        'CGPA Document',
  paper:       'Research Paper',
};

const TYPE_COLOR: Record<string, string> = {
  certificate: 'bg-blue-50  text-blue-700  border-blue-200',
  cgpa:        'bg-purple-50 text-purple-700 border-purple-200',
  paper:       'bg-amber-50  text-amber-700  border-amber-200',
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  // Route guard: only admins may reach this page.
  // The cookie is set at login by storeUserInfo() on the client.
  const cookieStore = await cookies();
  const role = cookieStore.get('user_role')?.value as UserRole | undefined;
  if (role !== 'admin') {
    redirect('/dashboard');
  }

  // Authenticated fetch — serverUnwrap reads the access_token cookie.
  const submissions: PendingSubmission[] =
    (await serverUnwrap<PendingSubmission[]>('/admin/submissions/pending/')) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Review student-uploaded certificates, CGPA documents, and research papers.
              Award points when approving to credit the student&apos;s account.
            </p>
          </div>
          <span
            className={`shrink-0 px-3 py-1.5 rounded-full border text-sm font-semibold
              ${submissions.length > 0
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-green-50 border-green-200 text-green-700'
              }`}
          >
            {submissions.length} pending
          </span>
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {submissions.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">All caught up</h3>
          <p className="text-gray-500 text-sm mt-1">No submissions are awaiting review.</p>
        </div>
      )}

      {/* ── Submission cards ──────────────────────────────────────────────── */}
      {submissions.length > 0 && (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Card header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-700 font-bold text-xs">
                      {getInitials(sub.submitter_name)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      {sub.submitter_name}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{sub.submitter_roll_no}</p>
                  </div>
                </div>
                {/* Document type badge */}
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border
                    ${TYPE_COLOR[sub.submission_type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}
                >
                  {TYPE_LABEL[sub.submission_type] ?? sub.submission_type}
                </span>
              </div>

              {/* Card body */}
              <div className="px-5 py-4 flex flex-col lg:flex-row gap-5">

                {/* Left: meta + document link */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                        Submitted on
                      </p>
                      <p className="text-gray-900">{formatDate(sub.uploaded_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                        Document type
                      </p>
                      <p className="text-gray-900">
                        {TYPE_LABEL[sub.submission_type] ?? sub.submission_type}
                      </p>
                    </div>
                  </div>

                  {/* Document link */}
                  <a
                    href={sub.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800
                               text-sm font-medium transition-colors group"
                  >
                    <svg
                      className="w-4 h-4 group-hover:scale-110 transition-transform"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4
                           M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open document in new tab
                  </a>

                  {/* Inline document preview for images */}
                  {/\.(jpe?g|png|gif|webp)$/i.test(sub.file_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sub.file_url}
                      alt="Submitted document"
                      className="mt-2 rounded-lg border border-gray-200 max-h-40 object-contain"
                    />
                  )}
                </div>

                {/* Right: approve / reject controls */}
                <div className="shrink-0 flex items-start">
                  <AdminControls submissionId={sub.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
