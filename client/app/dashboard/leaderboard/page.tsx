// app/dashboard/leaderboard/page.tsx
// GET /points/leaderboard/  (public)
// Year filtering + podium are handled client-side in LeaderboardTable.
import { cookies } from 'next/headers';
import LeaderboardTable from '@/components/LeaderboardTable';
import { fetchLeaderboard } from '@/lib/api';

export default async function LeaderboardPage() {
  const cookieStore = await cookies();

  // Default to the logged-in user's year so the relevant tab opens first
  const rawYear     = Number(cookieStore.get('user_year')?.value);
  const defaultYear = ([1, 2, 3, 4].includes(rawYear) ? rawYear : 1);

  const entries = await fetchLeaderboard();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Leaderboard</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <LeaderboardTable entries={entries} defaultYear={defaultYear} />
      </div>
    </div>
  );
}
