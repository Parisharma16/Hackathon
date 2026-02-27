'use client';

import { useState } from 'react';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardTableProps {
  entries:     LeaderboardEntry[];
  defaultYear?: number;
}

const YEARS = [1, 2, 3, 4] as const;
const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardTable({ entries, defaultYear = 1 }: LeaderboardTableProps) {
  const [year, setYear] = useState(defaultYear);

  // Year filtering and ranking are done client-side (API returns all students)
  const filtered = [...entries]
    .filter((e) => e.year === year)
    .sort((a, b) => b.total_points - a.total_points)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <div>
      {/* Year filter tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
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

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 py-12">No data for Year {year}.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                {['Rank', 'Name', 'Roll No', 'Branch', 'Points'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.map((entry) => (
                <tr key={entry.roll_no} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 w-16">
                    {MEDAL[entry.rank]
                      ? <span>{MEDAL[entry.rank]}</span>
                      : <span className="text-gray-500">#{entry.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{entry.roll_no}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{entry.branch}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-bold text-blue-600">{entry.total_points.toLocaleString()}</span>
                    <span className="text-xs text-gray-400 ml-1">pts</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
