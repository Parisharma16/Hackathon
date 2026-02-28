'use client';

import { useState } from 'react';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardTableProps {
  entries:      LeaderboardEntry[];
  defaultYear?: number;
}

const YEARS = [1, 2, 3, 4] as const;

const PODIUM_CONFIG = [
  { medal: '🥈', pedestalHeight: 220, accentClass: 'bg-slate-200', label: '2' },
  { medal: '🥇', pedestalHeight: 260, accentClass: 'bg-amber-200', label: '1' },
  { medal: '🥉', pedestalHeight: 200, accentClass: 'bg-orange-200', label: '3' },
] as const;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[1]![0]).toUpperCase();
}

export default function LeaderboardTable({ entries, defaultYear = 1 }: LeaderboardTableProps) {
  const [year, setYear] = useState(defaultYear);

  const ranked = [...entries]
    .filter((e) => e.year === year)
    .sort((a, b) => b.total_points - a.total_points)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="flex justify-center py-8">
      <div className="w-full max-w-md text-center">
        {/* Year tabs */}
        <div className="mb-6 flex justify-center gap-2 border-b border-gray-200 pb-2">
          {YEARS.map((y) => (
            <button
              key={y}
              onClick={() => {
                setYear(y);
              }}
              className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border-b-2 transition-colors -mb-px
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
          <p className="py-12 text-center text-sm text-gray-500">
            No data for Year {year}.
          </p>
        ) : (
          <>
            {/* Trophy */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-lg">
              <span className="text-3xl">🏆</span>
            </div>

            {/* Podium (silver | gold | bronze) */}
            {top3.length > 0 && (
              <div className="podium mb-8 mt-4 flex items-end justify-center gap-10">
                {[top3[1], top3[0], top3[2]].map((entry, index) => {
                  if (!entry) {
                    return <div key={index} className="w-20" />;
                  }

                  const cfg = PODIUM_CONFIG[index];

                  return (
                    <div
                      key={entry.id}
                        className="col relative w-20 cursor-pointer transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.02]"
                        style={{ height: 360 }}
                    >
                      {/* Pedestal block (flat base) */}
                      <div
                        className="cylinder absolute bottom-0 w-20"
                        style={{
                          height: cfg.pedestalHeight,
                          background:
                            'linear-gradient(to right, #d4d4d4, #f5f5f5, #d4d4d4)',
                        }}
                      />

                      {/* Top cap */}
                      <div
                        className="cap absolute w-20 rounded-full"
                        style={{
                          bottom: cfg.pedestalHeight,
                          height: 20,
                          background:
                            'radial-gradient(ellipse at center, #9a9a9a 16%, #c0c0c0 55%, #e0e0e0 72%, #ffffff 100%)',
                        }}
                      />

                      {/* Medal disk */}
                      <div
                        className="medal absolute flex h-20 w-20 items-center justify-center rounded-full text-2xl shadow-md"
                        style={{ bottom: cfg.pedestalHeight + 20 }}
                      >
                        <span>{cfg.medal}</span>
                      </div>

                      {/* Avatar (initials from project data) */}
                      <div
                        className="avatar absolute flex h-[72px] w-[72px] -translate-x-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-slate-700 shadow-md"
                        style={{
                          bottom: cfg.pedestalHeight + 28,
                          left: '50%',
                          background:
                            index === 1
                              ? 'linear-gradient(135deg, #facc15, #f97316)'
                              : index === 0
                                ? 'linear-gradient(135deg, #e5e7eb, #9ca3af)'
                                : 'linear-gradient(135deg, #fed7aa, #fb923c)',
                        }}
                      >
                        {getInitials(entry.name)}
                      </div>

                      {/* Info card */}
                      <div
                        className="card absolute w-28 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 text-center text-xs shadow-lg"
                        style={{ bottom: 100, left: '50%' }}
                      >
                        <div className="name mb-0.5 truncate text-[11px] font-semibold text-slate-900">
                          {entry.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {entry.roll_no}
                        </div>
                        <div className="mt-1 text-[11px] font-semibold text-slate-800">
                          {entry.total_points.toLocaleString()} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ranks #4 onwards */}
            {rest.length > 0 && (
              <div className="flex flex-col gap-3">
                {rest.map((entry) => (
                  <div
                    key={entry.id}
                    className="inline-flex h-16 w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <div className="w-6 text-center text-xs font-bold text-slate-700">
                      {entry.rank}
                    </div>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-700">
                      {getInitials(entry.name)}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {entry.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {entry.roll_no} · {entry.branch}
                      </div>
                    </div>
                    <div className="text-right text-[11px] text-slate-600">
                      <div>
                        Points:{' '}
                        <span className="font-semibold text-slate-900">
                          {entry.total_points.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
