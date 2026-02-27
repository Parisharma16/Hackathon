// app/dashboard/page.tsx
// Main landing page after login — events list.
// Students and Organisers see the same page; organisers also get a "Create Event" button.
// GET /events/  (public, no auth)
import { cookies } from 'next/headers';
import Link from 'next/link';
import EventsFilter from '@/components/EventsFilter';
import { fetchEvents } from '@/lib/api';
import type { UserRole } from '@/lib/types';

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

        {/* Organiser / admin-only: Create Event CTA */}
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

      {/* Filter state lives in DashboardContext — persists across navigation */}
      <EventsFilter events={events} userRole={userRole} userId={userId} />
    </div>
  );
}
