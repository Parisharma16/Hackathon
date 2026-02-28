// app/dashboard/events/[id]/page.tsx
// GET /events/{id}/
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEvent } from '@/lib/api';
import type { UserRole } from '@/lib/types';
import WinnersPanel from '@/components/WinnersPanel';

/** Format "HH:MM:SS" or "HH:MM" from the backend into "H:MM AM/PM". */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

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
  // Append T00:00:00 so the date string is parsed as local midnight, not UTC midnight
  const eventDate = new Date(event.date + 'T00:00:00');
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
        {event.banner_url ? (
          /* Show the uploaded banner image when available */
          <div className="relative h-52 sm:h-64 w-full">
            <Image
              src={event.banner_url}
              alt={`${event.title} banner`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
            {/* Keep the colour bar as a thin bottom accent over the image */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${style.bar}`} />
          </div>
        ) : (
          /* Fallback: coloured accent bar when no banner is set */
          <div className={`${style.bar} h-2`} />
        )}

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
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              {
                label: 'Date',
                value: eventDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
              },
              // Only include the Time card when a time is actually set
              ...(event.time
                ? [{ label: 'Time', value: formatTime(event.time) }]
                : []
              ),
              { label: 'Location',     value: event.location },
              { label: 'Organised By', value: event.organized_by },
              { label: 'Created By',   value: `${event.created_by.name} (${event.created_by.roll_no})` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  {label}
                </p>
                <p className="text-sm font-semibold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* ── Points Allocation ───────────────────────────────────── */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-5 mb-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">
              Points Allocation
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-blue-100 shadow-sm">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Per Participant</p>
                  <p className="text-xl font-extrabold text-blue-600">+{event.points_per_participant} pts</p>
                </div>
              </div>
              {event.winner_points > 0 && (
                <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 border border-amber-100 shadow-sm">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Winner Bonus</p>
                    <p className="text-xl font-extrabold text-amber-600">+{event.winner_points} pts</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Winners ─────────────────────────────────────────────────── */}
          {isOwner && isPast ? (
            /* Organiser view: interactive panel to declare / update winners */
            <div className="mb-6">
              <WinnersPanel
                eventId={event.id}
                initialWinners={event.winners_roll_nos}
              />
            </div>
          ) : event.winners_roll_nos.length > 0 ? (
            /* Public / student view: read-only podium display */
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-3">
                Winners
              </p>
              <div className="flex flex-col gap-2">
                {(['1st Place', '2nd Place', '3rd Place'] as const).map((posLabel, i) => {
                  const roll = event.winners_roll_nos[i];
                  if (!roll) return null;
                  const badgeClasses = [
                    'bg-yellow-100 text-yellow-800 border border-yellow-300',
                    'bg-gray-100 text-gray-700 border border-gray-300',
                    'bg-orange-100 text-orange-800 border border-orange-300',
                  ];
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${badgeClasses[i]}`}>
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-xs text-amber-700 font-medium">{posLabel}</p>
                        <p className="text-sm font-mono font-semibold text-amber-900">{roll}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Action buttons — organiser/admin only (no upload certificate here) */}
          {isOwner && (
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/events/${event.id}/edit`}
                className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Edit Event
              </Link>

              {isPast && (
                <Link
                  href={`/dashboard/organizer/capture?eventId=${event.id}`}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Mark Attendance
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
