// app/dashboard/admin/page.tsx
// GET /admin/submissions/pending/  — admin only
import { unstable_noStore as noStore } from 'next/cache';
import AdminControls from '@/components/AdminControls';
import { getInitials, formatDate } from '@/lib/utils';
import type { PendingSubmission } from '@/lib/types';

const DRF_API_URL = process.env.DRF_API_URL ?? 'http://127.0.0.1:8000';

const TYPE_LABEL: Record<string, string> = {
  certificate: 'Participation Certificate',
  cgpa:        'CGPA Document',
  paper:       'Research Paper',
};

async function getPendingSubmissions(): Promise<PendingSubmission[]> {
  // Do not cache — admin needs fresh data on every load
  noStore();
  try {
    const res = await fetch(`${DRF_API_URL}/admin/submissions/pending/`, {
      next: { tags: ['admin-pending-submissions'] },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) return json.data;
    }
  } catch { /* fall through to empty */ }
  return [];
}

export default async function AdminDashboard() {
  const submissions = await getPendingSubmissions();

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      <header className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Review and approve student submissions for holistic engagement tracking.
        </p>
        <div className="mt-3">
          <span className="bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200 text-yellow-800 text-sm font-medium">
            {submissions.length} Pending Review{submissions.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      {submissions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📋</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No pending submissions</h3>
          <p className="text-gray-500">All submissions have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Pending Reviews</h2>
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  {/* Submitter info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-bold text-xs">
                        {getInitials(sub.submitter_name)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{sub.submitter_name}</p>
                      <p className="text-xs text-gray-500 font-mono">{sub.submitter_roll_no}</p>
                    </div>
                  </div>

                  {/* Submission details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Document Type</p>
                      <p className="text-sm text-gray-900 mt-0.5">{TYPE_LABEL[sub.submission_type] ?? sub.submission_type}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Event</p>
                      <p className="text-sm text-gray-900 mt-0.5">{sub.event_title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Uploaded</p>
                      <p className="text-sm text-gray-900 mt-0.5">{formatDate(sub.uploaded_at)}</p>
                    </div>
                  </div>

                  <a
                    href={sub.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Document
                  </a>
                </div>

                <div className="shrink-0">
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
