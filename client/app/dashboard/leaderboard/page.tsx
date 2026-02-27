// app/dashboard/leaderboard/page.tsx
// GET /points/leaderboard/  (public)
// Year filtering is done client-side — the API returns all students.
import { cookies } from 'next/headers';
import LeaderboardTable from '@/components/LeaderboardTable';
import { fetchLeaderboard } from '@/lib/api';

export default async function LeaderboardPage() {
  const cookieStore = await cookies();

  // Default to the current user's year so the relevant tab is shown first
  const rawYear   = Number(cookieStore.get('user_year')?.value);
  const defaultYear = ([1, 2, 3, 4].includes(rawYear) ? rawYear : 1);

  const entries = await fetchLeaderboard();

  // Top-3 for the default year (server-rendered spotlight cards)
  const top3 = [...entries]
    .filter((e) => e.year === defaultYear)
    .sort((a, b) => b.total_points - a.total_points)
    .slice(0, 3);

  const medals  = ['🥇', '🥈', '🥉'];
  const colours = [
    'bg-yellow-50 border-yellow-200',
    'bg-gray-50   border-gray-200',
    'bg-orange-50 border-orange-200',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
        <p className="text-gray-500 mt-1">
          Rankings by total points. Switch years using the tabs below.
        </p>
      </div>

      {/* Top-3 spotlight */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {top3.map((entry, i) => (
            <div key={entry.roll_no} className={`${colours[i]} border rounded-xl p-4 text-center`}>
              <p className="text-3xl mb-2">{medals[i]}</p>
              <p className="font-bold text-gray-900">{entry.name}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{entry.roll_no}</p>
              <p className="text-xl font-bold text-blue-600 mt-2">
                {entry.total_points.toLocaleString()}{' '}
                <span className="text-sm font-normal text-gray-500">pts</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Full table with year tabs (client component) */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <LeaderboardTable entries={entries} defaultYear={defaultYear} />
      </div>
    </div>
  );
}
