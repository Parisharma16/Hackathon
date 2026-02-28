// app/dashboard/profile/page.tsx
// GET /points/my/   → { total_points, ledger: [...] }
// GET /auth/me/     → User (for roll_no, branch, year etc.)
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getInitials } from '@/lib/utils';
import { serverUnwrap } from '@/lib/server-fetch';
import type { PointsData, User, UserRole } from '@/lib/types';

const SOURCE_LABEL: Record<string, string> = {
  attendance:  'Attendance',
  winner:      'Winner',
  certificate: 'Certificate',
  cgpa:        'CGPA',
  paper:       'Research Paper',
};

const ENTRY_TYPE_STYLE: Record<string, string> = {
  credit: 'text-green-600',
  debit:  'text-red-500',
};

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const userName = decodeURIComponent(cookieStore.get('user_name')?.value ?? 'Student User');
  const userRole = cookieStore.get('user_role')?.value as UserRole | undefined;

  // Fetch live data using server-side auth (reads access_token cookie).
  // Falls back to safe defaults so the page always renders.
  const [pointsData, user] = await Promise.all([
    serverUnwrap<PointsData>('/points/my/').then((d) => d ?? { total_points: 0, ledger: [] }),
    serverUnwrap<User>('/auth/me/'),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
          <span className="text-blue-700 text-2xl font-bold">{getInitials(userName)}</span>
        </div>

        {/* Info */}
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{user?.name ?? userName}</h1>
          <p className="text-gray-500 capitalize mt-0.5">{userRole ?? 'student'}</p>

          {/* Extra fields from /auth/me/ */}
          {user && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              <span className="font-mono">{user.roll_no}</span>
              {user.branch && <span>{user.branch}</span>}
              {user.year   && <span>Year {user.year}</span>}
            </div>
          )}

          {/* Points */}
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <span className="text-2xl font-bold text-blue-600">
              {pointsData.total_points.toLocaleString()}
            </span>
            <span className="text-sm text-blue-500 font-medium">total points</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href="/dashboard/student/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            Upload Certificate
          </Link>
          <Link
            href="/dashboard/leaderboard"
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors text-center"
          >
            View Leaderboard
          </Link>
        </div>
      </div>

      {/* Ledger / activity history */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-5">Points History</h2>

        {pointsData.ledger.length === 0 ? (
          <p className="text-gray-500 text-sm">No activities yet. Start by joining an event!</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pointsData.ledger.map((entry) => (
              <li key={entry.id} className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{entry.event_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{entry.reason}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                      {SOURCE_LABEL[entry.source] ?? entry.source}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`text-sm font-bold ${ENTRY_TYPE_STYLE[entry.entry_type] ?? 'text-gray-700'}`}>
                    {entry.entry_type === 'credit' ? '+' : '−'}{entry.points} pts
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
