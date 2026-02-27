// app/dashboard/events/[id]/page.tsx
// GET /events/{id}/
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEvent } from '@/lib/api';
import type { UserRole } from '@/lib/types';

const TYPE_STYLE: Record<string, { bar: string; badge: string; text: string }> = {
  academic:        { bar: 'bg-blue-500',   badge: 'bg-blue-50',   text: 'text-blue-700'   },
  cocurricular:    { bar: 'bg-purple-500', badge: 'bg-purple-50', text: 'text-purple-700' },
  extracurricular: { bar: 'bg-green-500',  badge: 'bg-green-50',  text: 'text-green-700'  },
};

const TYPE_LABEL: Record<string, string> = {
  academic:        'Academic',
  cocurricular:    'Co-Curricular',
  extracurricular: 'Extra-Curricular',
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event  = await fetchEvent(id);
  if (!event) notFound();

  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value as UserRole | undefined;
  const userId   = cookieStore.get('user_id')?.value;

  const isOwner   = (userRole === 'organizer' || userRole === 'admin') && event.created_by.id === userId;
  const eventDate = new Date(event.date);
  const isPast    = eventDate < new Date();
  const style     = TYPE_STYLE[event.type] ?? TYPE_STYLE.academic;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className={`${style.bar} h-2`} />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.badge} ${style.text}`}>
                {TYPE_LABEL[event.type] ?? event.type}
              </span>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">{event.title}</h1>
              <p className="text-gray-500 text-sm mt-1">
                Organised by <span className="font-medium text-gray-700">{event.organized_by}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl block">
                +{event.points_per_participant} pts
              </span>
              {event.winner_points > 0 && (
                <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-lg block mt-1">
                  🏆 Winner: +{event.winner_points} pts
                </span>
              )}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {[
              { icon: '📅', label: 'Date',     value: eventDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: '📍', label: 'Location', value: event.location },
              { icon: '🏛️', label: 'Organised By', value: event.organized_by },
              { icon: '🎓', label: 'Created By',   value: `${event.created_by.name} (${event.created_by.roll_no})` },
            ].map(({ icon, label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {icon} {label}
                </p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Winners list (if any) */}
          {event.winners_roll_nos.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-amber-800 mb-2">🏆 Winners</p>
              <div className="flex flex-wrap gap-2">
                {event.winners_roll_nos.map((roll) => (
                  <span key={roll} className="bg-amber-100 text-amber-800 text-xs font-mono px-2 py-1 rounded">
                    {roll}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Upload certificate — any logged-in user */}
            <Link
              href={`/dashboard/student/upload?eventId=${event.id}`}
              className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              📄 Upload Certificate
            </Link>

            {/* Organiser / admin: Edit */}
            {isOwner && (
              <Link
                href={`/dashboard/events/${event.id}/edit`}
                className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                ✏️ Edit Event
              </Link>
            )}

            {/* Organiser / admin: Mark Attendance (past events) */}
            {isOwner && isPast && (
              <Link
                href={`/dashboard/organizer/capture?eventId=${event.id}`}
                className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                📸 Mark Attendance
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
