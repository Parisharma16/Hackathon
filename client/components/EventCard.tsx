'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Event, UserRole } from '@/lib/types';

const TYPE_CONFIG: Record<string, {
  badgeColor: string; // solid bg for the category pill
  btnBg:      string; // light-tint button background
  btnText:    string; // button text colour
  image:      string; // stock image URL
  label:      string;
}> = {
  academic: {
    badgeColor: '#3b82f6',
    btnBg:      '#dbeafe',
    btnText:    '#1d4ed8',
    image:      'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&q=80',
    label:      'Academic',
  },
  cocurricular: {
    badgeColor: '#f97316',
    btnBg:      '#ffedd5',
    btnText:    '#c2410c',
    image:      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80',
    label:      'Co-Curricular',
  },
  extracurricular: {
    badgeColor: '#10b981',
    btnBg:      '#d1fae5',
    btnText:    '#065f46',
    image:      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
    label:      'Extra-Curricular',
  },
};

interface EventCardProps {
  event:     Event;
  userRole?: UserRole;
  userId?:   string;
}

/**
 * Format a "HH:MM:SS" or "HH:MM" time string from the backend into
 * a readable "H:MM AM/PM" label.
 */
function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function EventCard({ event, userRole, userId }: EventCardProps) {
  const config  = TYPE_CONFIG[event.type] ?? TYPE_CONFIG.academic;
  const isOwner = userRole === 'organizer' && event.created_by.id === userId;

  const eventDate = new Date(event.date + 'T00:00:00');
  const datePart  = eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  // Only show time when the backend has an actual time value set.
  const timePart  = event.time ? formatTime(event.time) : null;

  return (
    <article className="rounded-3xl overflow-hidden shadow-lg bg-[#1c1c2e] flex flex-col">
      {/* ── Image section ── */}
      <div className="relative h-44">
        <Image
          src={event.banner_url || config.image}
          alt={event.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* Category badge — top-left */}
        <span
          className="absolute top-3 left-3 text-xs font-extrabold px-3 py-1 rounded-full text-white tracking-wide shadow"
          style={{ backgroundColor: config.badgeColor }}
        >
          {config.label.toUpperCase()}
        </span>

        {/* Points badge — bottom-right */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-800 shadow">
          
          {event.points_per_participant} XP
        </span>
      </div>

      {/* ── Content section ── */}
      <div className="bg-white p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-bold text-gray-900 text-base leading-snug">{event.title}</h3>

        {/* Date & time */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
            <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{datePart}{timePart ? ` • ${timePart}` : ''}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" strokeWidth="2" />
            <circle cx="12" cy="9" r="2.5" strokeWidth="2" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>

        {/* View Details button */}
        <Link
          href={`/dashboard/events/${event.id}`}
          className="mt-2 block w-full text-center py-2.5 rounded-full text-sm font-bold transition-opacity hover:opacity-80"
          style={{ backgroundColor: config.btnBg, color: config.btnText }}
        >
          {isOwner ? 'Manage Event' : 'View Details'}
        </Link>
      </div>
    </article>
  );
}
