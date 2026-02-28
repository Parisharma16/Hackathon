/**
 * RedemptionCard
 * Displays a single past redemption with the unique code prominently shown.
 */

import type { Redemption } from '@/lib/types';

interface RedemptionCardProps {
  redemption: Redemption;
}

/** Format an ISO date-time string to a readable local date and time. */
function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RedemptionCard({ redemption }: RedemptionCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Category strip */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
          {redemption.item_category}
        </span>
        <span className="text-xs text-gray-400">{formatDateTime(redemption.redeemed_at)}</span>
      </div>

      <div className="p-5">
        {/* Item name and points cost */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="text-base font-bold text-gray-900">{redemption.item_name}</h3>
          <span className="shrink-0 text-sm font-semibold text-red-500">
            -{redemption.points_cost.toLocaleString()} pts
          </span>
        </div>

        {/* Redemption code box */}
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide font-medium">Redemption code</p>
          <p className="text-lg font-mono font-bold text-gray-800 tracking-widest select-all">
            {redemption.code}
          </p>
        </div>
      </div>
    </div>
  );
}
