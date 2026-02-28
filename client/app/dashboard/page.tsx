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

      {/* ── Hero banner ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#c4b5fd] min-h-[160px] flex items-center">
        {/* Text content */}
        <div className="relative z-10 px-7 py-7 max-w-[55%]">
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

        {/* Decorative 3-D shapes image — right side */}
        <div className="absolute right-0 top-0 h-full w-[48%] pointer-events-none">
          <Image
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=480&q=80"
            alt=""
            fill
            className="object-cover object-left"
            sizes="(max-width: 768px) 50vw, 30vw"
            aria-hidden="true"
          />
          {/* Fade blend from left so the image blends into the purple */}
          <div className="absolute inset-0 bg-linear-to-r from-[#c4b5fd] via-[#c4b5fd]/60 to-transparent" />
        </div>

        {/* Organiser / admin: Create Event button inside banner */}
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

      {/* ── Filter + event grid ──────────────────────────────────────────── */}
      <EventsFilter events={events} userRole={userRole} userId={userId} />
    </div>
  );
}
