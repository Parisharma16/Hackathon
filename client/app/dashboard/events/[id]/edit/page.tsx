// app/dashboard/events/[id]/edit/page.tsx
// Organiser-only: edit an existing event.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EventForm from '@/components/EventForm';
import { MOCK_EVENTS } from '@/lib/mock-data';
import type { Event } from '@/lib/types';

const DRF_API_URL = process.env.DRF_API_URL || 'http://localhost:8000/api';

async function getEvent(id: string): Promise<Event | null> {
  try {
    const res = await fetch(`${DRF_API_URL}/events/${id}/`);
    if (res.ok) return res.json();
  } catch { /* fall through */ }
  return MOCK_EVENTS.find((e) => e.id === id) ?? null;
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href={`/dashboard/events/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Event
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Event</h1>
        <p className="text-gray-500 text-sm mb-8">
          Update the details for <span className="font-medium text-gray-700">{event.title}</span>.
        </p>
        <EventForm event={event} />
      </div>
    </div>
  );
}
