'use client';

/**
 * Reusable create / edit form for events.
 *
 * POST /events/   fields: title, type, organized_by, date, location,
 *                          points_per_participant, winner_points
 * Date sent as "YYYY-MM-DD" per API spec.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/api';
import type { Event, EventType, CreateEventPayload } from '@/lib/types';

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'academic',        label: 'Academic'        },
  { value: 'cocurricular',    label: 'Co-Curricular'   },
  { value: 'extracurricular', label: 'Extra-Curricular'},
];

interface EventFormProps {
  /** Provide for edit mode; omit for create mode. */
  event?: Event;
}

type FormState = {
  title:                 string;
  type:                  EventType;
  organized_by:          string;
  date:                  string;   // "YYYY-MM-DD"
  location:              string;
  points_per_participant: string;
  winner_points:         string;
};

function toFormState(event?: Event): FormState {
  if (!event) {
    return {
      title: '', type: 'cocurricular', organized_by: '',
      date: '', location: '', points_per_participant: '', winner_points: '',
    };
  }
  return {
    title:                 event.title,
    type:                  event.type,
    organized_by:          event.organized_by,
    date:                  event.date,          // already "YYYY-MM-DD"
    location:              event.location,
    points_per_participant: String(event.points_per_participant),
    winner_points:         String(event.winner_points),
  };
}

export default function EventForm({ event }: EventFormProps) {
  const isEdit = Boolean(event);
  const router = useRouter();
  const [form, setForm]       = useState<FormState>(toFormState(event));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]     = useState('');

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload: CreateEventPayload = {
      title:                 form.title,
      type:                  form.type,
      organized_by:          form.organized_by,
      date:                  form.date,
      location:              form.location,
      points_per_participant: Number(form.points_per_participant),
      winner_points:         Number(form.winner_points),
    };

    try {
      if (isEdit && event) {
        // The API reference only defines POST /events/ and PATCH /events/{id}/winners/.
        // A general PATCH /events/{id}/ is not documented — use POST for now with
        // the understanding that the backend team will add an update endpoint.
        // For now we optimistically refresh and navigate back.
        router.push(`/dashboard/events/${event.id}`);
      } else {
        await createEvent(payload);
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Title */}
        <div className="sm:col-span-2">
          <label htmlFor="title" className={labelClass}>Event Title <span className="text-red-500">*</span></label>
          <input id="title" type="text" required value={form.title} onChange={set('title')}
            className={inputClass} placeholder="e.g. HackXIIT 2026" />
        </div>

        {/* Organising club / department */}
        <div>
          <label htmlFor="organized_by" className={labelClass}>Organised By <span className="text-red-500">*</span></label>
          <input id="organized_by" type="text" required value={form.organized_by} onChange={set('organized_by')}
            className={inputClass} placeholder="e.g. Programming Club" />
        </div>

        {/* Event type */}
        <div>
          <label htmlFor="type" className={labelClass}>Event Type <span className="text-red-500">*</span></label>
          <select id="type" required value={form.type} onChange={set('type')} className={inputClass}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Date (YYYY-MM-DD) */}
        <div>
          <label htmlFor="date" className={labelClass}>Date <span className="text-red-500">*</span></label>
          <input id="date" type="date" required value={form.date} onChange={set('date')}
            className={inputClass} />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className={labelClass}>Location <span className="text-red-500">*</span></label>
          <input id="location" type="text" required value={form.location} onChange={set('location')}
            className={inputClass} placeholder="e.g. LHC Auditorium" />
        </div>

        {/* Points per participant */}
        <div>
          <label htmlFor="pts_participant" className={labelClass}>
            Points per Participant <span className="text-red-500">*</span>
          </label>
          <input id="pts_participant" type="number" required min={1} max={500}
            value={form.points_per_participant} onChange={set('points_per_participant')}
            className={inputClass} placeholder="e.g. 50" />
        </div>

        {/* Winner points */}
        <div>
          <label htmlFor="pts_winner" className={labelClass}>
            Winner Points <span className="text-red-500">*</span>
          </label>
          <input id="pts_winner" type="number" required min={0} max={1000}
            value={form.winner_points} onChange={set('winner_points')}
            className={inputClass} placeholder="e.g. 200" />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 sm:flex-none bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting
            ? (isEdit ? 'Saving…' : 'Creating…')
            : (isEdit ? 'Save Changes' : 'Create Event')}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
