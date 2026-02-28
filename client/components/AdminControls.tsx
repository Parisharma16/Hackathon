'use client';

/**
 * AdminControls
 *
 * Inline approve / reject widget rendered inside each pending-submission card.
 *
 * Approve flow:
 *   1. Admin clicks "Approve" — an inline form slides in.
 *   2. Admin enters the points to award (required, min 1) and an optional remark.
 *   3. On confirm, calls the approveSubmission server action which POSTs to
 *      /admin/submissions/{id}/approve/ with { points, remarks }.
 *   4. On success the card is replaced by a green confirmation banner.
 *
 * Reject flow:
 *   1. Admin clicks "Reject" — a smaller inline form slides in.
 *   2. Admin enters an optional rejection reason.
 *   3. On confirm, calls rejectSubmission → POST /admin/submissions/{id}/reject/.
 *   4. On success the card is replaced by a red confirmation banner.
 *
 * The parent page (admin/page.tsx) uses revalidateTag so the submission list
 * is refreshed automatically after any successful action.
 */

import { useState, useTransition } from 'react';
import { approveSubmission, rejectSubmission } from '@/app/dashboard/admin/actions';

interface AdminControlsProps {
  submissionId: string;
}

type Panel = 'idle' | 'approving' | 'rejecting';

export default function AdminControls({ submissionId }: AdminControlsProps) {
  const [panel,   setPanel]   = useState<Panel>('idle');
  const [points,  setPoints]  = useState('');
  const [remarks, setRemarks] = useState('');
  const [result,  setResult]  = useState<{ ok: boolean; msg: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Finised state ────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
          ${result.ok
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50   border border-red-200   text-red-700'
          }`}
      >
        {result.ok
          ? <CheckIcon />
          : <XIcon />
        }
        {result.msg}
      </div>
    );
  }

  // ── Approve inline form ───────────────────────────────────────────────────
  if (panel === 'approving') {
    const handleApprove = () => {
      const pts = parseInt(points, 10);
      if (!pts || pts < 1) return;
      startTransition(async () => {
        const res = await approveSubmission(submissionId, pts, remarks.trim() || undefined);
        setResult({ ok: res.success, msg: res.message });
      });
    };

    return (
      <div className="border border-green-200 rounded-xl p-4 bg-green-50 space-y-3 min-w-[260px]">
        <p className="text-sm font-semibold text-green-800">Approve submission</p>

        {/* Points input — required by backend */}
        <div>
          <label htmlFor={`pts-${submissionId}`} className="block text-xs font-medium text-gray-700 mb-1">
            Points to award <span className="text-red-500">*</span>
          </label>
          <input
            id={`pts-${submissionId}`}
            type="number"
            min={1}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="e.g. 50"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Optional remarks */}
        <div>
          <label htmlFor={`rem-${submissionId}`} className="block text-xs font-medium text-gray-700 mb-1">
            Remarks <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id={`rem-${submissionId}`}
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Well done!"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={isPending || !points || parseInt(points, 10) < 1}
            className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold
                       hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Approving…' : 'Confirm Approve'}
          </button>
          <button
            onClick={() => { setPanel('idle'); setPoints(''); setRemarks(''); }}
            disabled={isPending}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600
                       hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Reject inline form ────────────────────────────────────────────────────
  if (panel === 'rejecting') {
    const handleReject = () => {
      startTransition(async () => {
        const res = await rejectSubmission(submissionId, remarks.trim() || undefined);
        setResult({ ok: res.success, msg: res.message });
      });
    };

    return (
      <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3 min-w-[260px]">
        <p className="text-sm font-semibold text-red-800">Reject submission</p>

        <div>
          <label htmlFor={`rej-rem-${submissionId}`} className="block text-xs font-medium text-gray-700 mb-1">
            Reason <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id={`rej-rem-${submissionId}`}
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Insufficient evidence…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={isPending}
            className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold
                       hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Rejecting…' : 'Confirm Reject'}
          </button>
          <button
            onClick={() => { setPanel('idle'); setRemarks(''); }}
            disabled={isPending}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600
                       hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Default idle buttons ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        onClick={() => setPanel('approving')}
        className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg
                   text-sm font-semibold hover:bg-green-700 transition-colors"
      >
        <CheckIcon />
        Approve
      </button>
      <button
        onClick={() => setPanel('rejecting')}
        className="inline-flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-lg
                   text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        <XIcon />
        Reject
      </button>
    </div>
  );
}

// ── Inline SVG icons (avoids external dependencies) ──────────────────────────

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
