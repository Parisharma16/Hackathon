// app/dashboard/page.tsx
// Main landing page after login — events list.
// Students and Organisers see the same page; organisers also get a "Create Event" button.
// GET /events/  (public, no auth)
import { cookies } from 'next/headers';
import Link from 'next/link';
import EventCard from '@/components/EventCard';
import { fetchEvents } from '@/lib/api';
import type { UserRole } from '@/lib/types';

const TYPE_FILTERS = ['All', 'Academic', 'Co-Curricular', 'Extra-Curricular'] as const;

export default async function EventsPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value as UserRole | undefined;
  const userId   = cookieStore.get('user_id')?.value;

  const events = await fetchEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upcoming Events</h1>
          <p className="text-gray-500 mt-1">Participate and earn points for your campus journey</p>
        </div>

        {/* Organiser-only: Create Event CTA */}
        {(userRole === 'organizer' || userRole === 'admin') && (
          <Link
            href="/dashboard/events/create"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </Link>
        )}
      </div>

      {/* Type filter pills — visual only; filtering would require a Client Component */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TYPE_FILTERS.map((f) => (
          <span
            key={f}
            className="px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-200 text-gray-600 cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎪</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No events yet</h3>
          <p className="text-gray-500">Check back soon for upcoming events.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard key={event.id} event={event} userRole={userRole} userId={userId} />
          ))}
        </div>
      )}
    </div>
  );
}
