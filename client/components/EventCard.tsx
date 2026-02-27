// Server component — no state, pure presentational
import Link from 'next/link';
import type { Event, UserRole } from '@/lib/types';

/**
 * Maps the API's event type to a display colour scheme.
 * API values: "academic" | "cocurricular" | "extracurricular"
 */
const TYPE_STYLE: Record<string, { bar: string; badge: string; text: string }> = {
  academic:       { bar: 'bg-blue-500',   badge: 'bg-blue-50',   text: 'text-blue-700'   },
  cocurricular:   { bar: 'bg-purple-500', badge: 'bg-purple-50', text: 'text-purple-700' },
  extracurricular:{ bar: 'bg-green-500',  badge: 'bg-green-50',  text: 'text-green-700'  },
};

const TYPE_LABEL: Record<string, string> = {
  academic:       'Academic',
  cocurricular:   'Co-Curricular',
  extracurricular:'Extra-Curricular',
};

interface EventCardProps {
  event:    Event;
  userRole?: UserRole;
  /** Current user's ID — used to detect event ownership for Edit button */
  userId?:  string;
}

export default function EventCard({ event, userRole, userId }: EventCardProps) {
  const style   = TYPE_STYLE[event.type] ?? TYPE_STYLE.academic;
  const isOwner = userRole === 'organizer' && event.created_by.id === userId;
  const eventDate = new Date(event.date);
  const isPast    = eventDate < new Date();

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Type colour bar */}
      <div className={`${style.bar} h-1.5`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Type badge + points */}
        <div className="flex items-start justify-between mb-3">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${style.badge} ${style.text}`}>
            {TYPE_LABEL[event.type] ?? event.type}
          </span>
          <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full whitespace-nowrap">
            +{event.points_per_participant} pts
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-gray-900 mb-1 leading-snug">{event.title}</h3>

        {/* Meta details */}
        <ul className="space-y-1.5 text-sm text-gray-600 mb-5 flex-1">
          <li className="flex items-center gap-2">
            <span>🏛️</span>
            <span className="truncate">{event.organized_by}</span>
          </li>
          <li className="flex items-center gap-2">
            <span>📅</span>
            <span>
              {eventDate.toLocaleDateString('en-IN', {
                weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span>📍</span>
            <span className="truncate">{event.location}</span>
          </li>
          {event.winner_points > 0 && (
            <li className="flex items-center gap-2">
              <span>🏆</span>
              <span>Winner: +{event.winner_points} pts</span>
            </li>
          )}
        </ul>

        {/* Past event badge */}
        {isPast && (
          <p className="text-xs text-gray-400 mb-3">Event concluded</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/dashboard/events/${event.id}`}
            className="flex-1 text-center bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
          {isOwner && (
            <Link
              href={`/dashboard/events/${event.id}/edit`}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
