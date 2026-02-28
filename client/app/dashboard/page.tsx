// app/dashboard/page.tsx
// Main landing page after login — events list.
// Students and Organisers see the same page; organisers also get a "Create Event" button.
// GET /events/  (public, no auth)
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import EventsFilter from '@/components/EventsFilter';
import { fetchEvents } from '@/lib/api';
import type { UserRole } from '@/lib/types';

export default async function EventsPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value as UserRole | undefined;
  const userId   = cookieStore.get('user_id')?.value;
  const rawName  = cookieStore.get('user_name')?.value;
  const userName = rawName ? decodeURIComponent(rawName).split(' ')[0] : 'there';

  const events = await fetchEvents();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="relative mt-10">

        {/* Purple card — overflow-hidden clips only its own bg */}
        <div className="relative overflow-hidden rounded-3xl bg-[#c4b5fd] min-h-[170px] flex items-center">
          {/* Text */}
          <div className="relative z-10 px-7 py-7 max-w-[58%]">
            <p className="text-violet-800 text-sm font-semibold mb-1 tracking-wide uppercase">
              Hi, {userName}!
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Upcoming<br />Events
            </h1>
            <p className="text-violet-800 text-sm mt-2 font-medium">
              Explore, participate &amp; earn points
            </p>
          </div>

          {/* Organiser / admin: Create Event button */}
          {(userRole === 'organizer' || userRole === 'admin') && (
            <div className="absolute bottom-5 left-7 z-10">
              <Link
                href="/dashboard/events/create"
                className="inline-flex items-center gap-1.5 bg-white/90 text-violet-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-white transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Event
              </Link>
            </div>
          )}
        </div>

        {/*
          Image is a SIBLING of the card, not a child.
          `absolute` positions it relative to the outer `relative` div.
          `-top-14` pulls it 3.5rem above the outer div's top edge (into the mt-14 space),
          which is above the card's top border — giving the 3-D pop-out effect.
        */}
        <Image
          src="/events_hero.png"
          alt=""
          width={220}
          height={220}
          className="absolute -top-14 right-0 object-contain pointer-events-none drop-shadow-xl"
          aria-hidden="true"
        />

      </div>

      {/* ── Filter + event grid ──────────────────────────────────────────── */}
      <EventsFilter events={events} userRole={userRole} userId={userId} />
    </div>
  );
}
