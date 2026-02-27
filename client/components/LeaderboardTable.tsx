'use client';

import { useState } from 'react';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardTableProps {
  entries:      LeaderboardEntry[];
  defaultYear?: number;
}

const YEARS = [1, 2, 3, 4] as const;

const PODIUM_STYLE = [
  { medal: '🥇', card: 'bg-yellow-50 border-yellow-200', order: 'order-2 sm:scale-105' },
  { medal: '🥈', card: 'bg-gray-50   border-gray-200',   order: 'order-1' },
  { medal: '🥉', card: 'bg-orange-50 border-orange-200', order: 'order-3' },
];

export default function LeaderboardTable({ entries, defaultYear = 1 }: LeaderboardTableProps) {
  const [year, setYear] = useState(defaultYear);

  // Sort all entries for this year; derive podium + rest from same array
  const ranked = [...entries]
    .filter((e) => e.year === year)
    .sort((a, b) => b.total_points - a.total_points)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = ranked.slice(0, 3);
  // Table shows #4 through #10
  const rest  = ranked.slice(3, 10);

  return (
    <div>
      {/* ── Year tabs ────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {YEARS.map((y) => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px
              ${year === y
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
          >
            Year {y}
          </button>
        ))}
      </div>

      {ranked.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No data for Year {year}.</p>
      ) : (
        <>
          {/* ── Podium ─────────────────────────────────────────────────── */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-8">
              {/* Render silver | gold | bronze so gold is visually centred */}
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return <div key={i} />;
                const s = PODIUM_STYLE[i];
                return (
                  <div
                    key={entry.roll_no}
                    className={`${s.card} ${s.order} border rounded-xl p-4 text-center transition-all`}
                  >
                    <p className="text-3xl mb-2">{s.medal}</p>
                    <p className="font-bold text-gray-900 text-sm leading-tight">{entry.name}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{entry.roll_no}</p>
                    <p className="text-xl font-bold text-blue-600 mt-2">
                      {entry.total_points.toLocaleString()}
                      <span className="text-xs font-normal text-gray-500 ml-1">pts</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Ranks #4–#10 ───────────────────────────────────────────── */}
          {rest.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Rank', 'Name', 'Roll No', 'Branch', 'Points'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {rest.map((entry) => (
                    <tr key={entry.roll_no} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-bold text-gray-500 w-16">
                        #{entry.rank}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">{entry.roll_no}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{entry.branch}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-blue-600">
                          {entry.total_points.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">pts</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
