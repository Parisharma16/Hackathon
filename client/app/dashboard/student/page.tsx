// app/dashboard/student/page.tsx
// GET /points/my/  → { total_points, ledger: [...] }
// Navigation is injected by app/dashboard/layout.tsx
import Link from 'next/link';
import { fetchMyPoints } from '@/lib/api';

const SOURCE_LABEL: Record<string, string> = {
  attendance:  'Attendance',
  winner:      'Winner',
  certificate: 'Certificate',
  cgpa:        'CGPA',
  paper:       'Research Paper',
};

export default async function StudentDashboard() {
  const pointsData = await fetchMyPoints();

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500">Track your holistic campus engagement.</p>
      </header>

      {/* Points summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Points</p>
          <p className="text-5xl font-extrabold text-blue-600">
            {pointsData.total_points.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">Keep participating to climb the leaderboard!</p>
          <Link
            href="/dashboard/leaderboard"
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Leaderboard →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-center gap-3">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Quick Actions</p>
          <Link
            href="/dashboard/student/upload"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            <span className="text-xl">📄</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Upload Certificate</p>
              <p className="text-xs text-gray-500">Submit participation documents for review</p>
            </div>
          </Link>
          <Link
            href="/dashboard/shop"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-colors"
          >
            <span className="text-xl">🛍️</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Redeem Points</p>
              <p className="text-xs text-gray-500">Exchange points for rewards in the shop</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent ledger entries */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Recent Activity</h2>
        {pointsData.ledger.length === 0 ? (
          <p className="text-sm text-gray-500">No activity yet. Attend an event to earn points!</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pointsData.ledger.slice(0, 10).map((entry) => (
              <li key={entry.id} className="flex justify-between items-center py-3 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{entry.event_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {SOURCE_LABEL[entry.source] ?? entry.source} ·{' '}
                    {new Date(entry.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${entry.entry_type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {entry.entry_type === 'credit' ? '+' : '−'}{entry.points} pts
                </span>
              </li>
            ))}
          </ul>
        )}
        {pointsData.ledger.length > 10 && (
          <Link href="/dashboard/profile" className="mt-3 block text-sm text-blue-600 hover:text-blue-700 font-medium">
            View full history →
          </Link>
        )}
      </div>
    </div>
  );
}
