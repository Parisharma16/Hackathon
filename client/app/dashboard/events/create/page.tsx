// app/dashboard/events/create/page.tsx
// Organiser-only: create a new event.
import Link from 'next/link';
import EventForm from '@/components/EventForm';

export default function CreateEventPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Events
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create New Event</h1>
        <p className="text-gray-500 text-sm mb-8">
          Fill in the details below. The event will be visible to all students after creation.
        </p>
        <EventForm />
      </div>
    </div>
  );
}
