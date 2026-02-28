'use client';

import { useState, useTransition } from 'react';
import { processSubmission } from '@/app/dashboard/admin/actions';

interface AdminControlsProps {
  submissionId: string;
}

export default function AdminControls({ submissionId }: AdminControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handle = (action: 'approve' | 'reject') => {
    setResult(null);
    startTransition(async () => {
      const res = await processSubmission(submissionId, action);
      setResult({ ok: res.success, msg: res.message });
    });
  };

  if (result) {
    return (
      <p className={`text-xs font-medium px-2 py-1 rounded ${result.ok ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
        {result.msg}
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('approve')}
        disabled={isPending}
        className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? '…' : 'Approve'}
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={isPending}
        className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        Reject
      </button>
    </div>
  );
}
