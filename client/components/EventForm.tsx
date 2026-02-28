'use client';

/**
 * Reusable create / edit form for events.
 *
 * Create: POST /events/
 * Edit:   PATCH /events/{id}/   (partial update — only changed fields are sent)
 *
 * Banner upload flow:
 *   1. User selects an image file via the file picker.
 *   2. The file is immediately uploaded to POST /events/upload-banner/.
 *   3. The backend stores it in Supabase and returns the public URL.
 *   4. The URL is stored in form.banner_url and passed with the event payload.
 */

import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createEvent, updateEvent, uploadEventBanner } from '@/lib/api';
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
  title:                  string;
  type:                   EventType;
  organized_by:           string;
  date:                   string;   // "YYYY-MM-DD"
  /** "HH:MM" from <input type="time">; empty string means not set. */
  time:                   string;
  location:               string;
  points_per_participant: string;
  winner_points:          string;
  /** Supabase public URL set automatically after banner upload. */
  banner_url:             string;
};

function toFormState(event?: Event): FormState {
  if (!event) {
    return {
      title: '', type: 'cocurricular', organized_by: '',
      date: '', time: '', location: '',
      points_per_participant: '', winner_points: '',
      banner_url: '',
    };
  }
  return {
    title:                  event.title,
    type:                   event.type,
    organized_by:           event.organized_by,
    date:                   event.date,
    // Django returns "HH:MM:SS"; <input type="time"> needs "HH:MM"
    time:                   event.time ? event.time.substring(0, 5) : '',
    location:               event.location,
    points_per_participant: String(event.points_per_participant),
    winner_points:          String(event.winner_points),
    banner_url:             event.banner_url ?? '',
  };
}

export default function EventForm({ event }: EventFormProps) {
  const isEdit = Boolean(event);
  const router = useRouter();

  const [form, setForm]             = useState<FormState>(toFormState(event));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Banner upload state — separate from the main form submission state
  const [isBannerUploading, setIsBannerUploading] = useState(false);
  const [bannerError, setBannerError]             = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Banner file selection ──────────────────────────────────────────────────

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerError('');
    setIsBannerUploading(true);
    try {
      const url = await uploadEventBanner(file);
      setForm((prev) => ({ ...prev, banner_url: url }));
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Banner upload failed.');
    } finally {
      setIsBannerUploading(false);
      // Reset the file input so the same file can be re-selected after an error
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeBanner = () => {
    setForm((prev) => ({ ...prev, banner_url: '' }));
    setBannerError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Main form submit ───────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload: CreateEventPayload = {
      title:                  form.title,
      type:                   form.type,
      organized_by:           form.organized_by,
      date:                   form.date,
      location:               form.location,
      points_per_participant: Number(form.points_per_participant),
      winner_points:          Number(form.winner_points),
      // Only include optional fields when they carry a value to avoid
      // accidentally overwriting existing data with empty strings.
      ...(form.time.trim()       ? { time:       form.time.trim()       } : {}),
      ...(form.banner_url.trim() ? { banner_url: form.banner_url.trim() } : {}),
    };

    try {
      if (isEdit && event) {
        await updateEvent(event.id, payload);
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
          <label htmlFor="title" className={labelClass}>
            Event Title <span className="text-red-500">*</span>
          </label>
          <input id="title" type="text" required value={form.title} onChange={set('title')}
            className={inputClass} placeholder="e.g. HackXIIT 2026" />
        </div>

        {/* Organising club / department */}
        <div>
          <label htmlFor="organized_by" className={labelClass}>
            Organised By <span className="text-red-500">*</span>
          </label>
          <input id="organized_by" type="text" required value={form.organized_by}
            onChange={set('organized_by')} className={inputClass}
            placeholder="e.g. Programming Club" />
        </div>

        {/* Event type */}
        <div>
          <label htmlFor="type" className={labelClass}>
            Event Type <span className="text-red-500">*</span>
          </label>
          <select id="type" required value={form.type} onChange={set('type')} className={inputClass}>
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className={labelClass}>
            Date <span className="text-red-500">*</span>
          </label>
          <input id="date" type="date" required value={form.date} onChange={set('date')}
            className={inputClass} />
        </div>

        {/* Time (optional) */}
        <div>
          <label htmlFor="time" className={labelClass}>
            Start Time{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input id="time" type="time" value={form.time} onChange={set('time')}
            className={inputClass} />
        </div>

        {/* Location */}
        <div className="sm:col-span-2">
          <label htmlFor="location" className={labelClass}>
            Location <span className="text-red-500">*</span>
          </label>
          <input id="location" type="text" required value={form.location}
            onChange={set('location')} className={inputClass}
            placeholder="e.g. LHC Auditorium" />
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

        {/* Banner image upload */}
        <div className="sm:col-span-2">
          <label className={labelClass}>
            Banner Image{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="banner_file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleBannerFileChange}
            disabled={isBannerUploading}
          />

          {form.banner_url ? (
            /* Preview card shown once a banner is uploaded */
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                <Image
                  src={form.banner_url}
                  alt="Event banner preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-500 truncate max-w-[70%]">{form.banner_url}</p>
                <div className="flex gap-2 shrink-0">
                  <label
                    htmlFor="banner_file"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    Replace
                  </label>
                  <button
                    type="button"
                    onClick={removeBanner}
                    className="text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Upload dropzone shown when no banner is set */
            <label
              htmlFor="banner_file"
              className={`flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors
                ${isBannerUploading
                  ? 'border-blue-300 bg-blue-50 cursor-wait'
                  : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
            >
              {isBannerUploading ? (
                <>
                  <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-sm text-blue-600 font-medium">Uploading…</span>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12V4m0 0L8 8m4-4l4 4" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">
                    Click to upload banner
                  </span>
                  <span className="text-xs text-gray-400">JPG, PNG, WEBP — max 5 MB</span>
                </>
              )}
            </label>
          )}

          {bannerError && (
            <p className="mt-1.5 text-xs text-red-600">{bannerError}</p>
          )}
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
          disabled={isSubmitting || isBannerUploading}
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
