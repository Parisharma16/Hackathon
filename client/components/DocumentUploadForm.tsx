'use client';

/**
 * POST /submissions/
 * multipart/form-data fields:
 *   event           – event UUID (required)
 *   submission_type – "certificate" | "cgpa" | "paper" (required)
 *   file_url        – file (required, pdf/jpg/jpeg/png, max 5 MB)
 */

import { useRef, useState, useEffect } from 'react';
import { fetchEvents, createSubmission } from '@/lib/api';
import type { Event, SubmissionType } from '@/lib/types';

const SUBMISSION_TYPES: { value: SubmissionType; label: string }[] = [
  { value: 'certificate', label: 'Participation Certificate' },
  { value: 'cgpa',        label: 'CGPA Document'            },
  { value: 'paper',       label: 'Research Paper'           },
];

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per API spec

interface DocumentUploadFormProps {
  /** Pre-select an event (e.g. when linked from an event detail page). */
  preselectedEventId?: string;
}

export default function DocumentUploadForm({ preselectedEventId }: DocumentUploadFormProps) {
  const [events, setEvents]             = useState<Event[]>([]);
  const [eventId, setEventId]           = useState(preselectedEventId ?? '');
  const [subType, setSubType]           = useState<SubmissionType>('certificate');
  const [file, setFile]                 = useState<File | null>(null);
  const [isUploading, setIsUploading]   = useState(false);
  const [status, setStatus]             = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]         = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load events for the selector
  useEffect(() => {
    fetchEvents().then(setEvents).catch(console.error);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (selected && selected.size > MAX_FILE_BYTES) {
      setErrorMsg('File exceeds the 5 MB limit. Please choose a smaller file.');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setErrorMsg('');
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !eventId) return;

    setIsUploading(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      await createSubmission(eventId, subType, file);
      setStatus('success');
      setFile(null);
      setEventId(preselectedEventId ?? '');
      setSubType('certificate');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const selectClass =
    'block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Event selector */}
      <div>
        <label htmlFor="event" className="block text-sm font-medium text-gray-700 mb-1">
          Event <span className="text-red-500">*</span>
        </label>
        <select
          id="event"
          required
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className={selectClass}
          disabled={Boolean(preselectedEventId)}
        >
          <option value="">— Select an event —</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} ({ev.date})
            </option>
          ))}
        </select>
      </div>

      {/* Submission type */}
      <div>
        <label htmlFor="subType" className="block text-sm font-medium text-gray-700 mb-1">
          Document Type <span className="text-red-500">*</span>
        </label>
        <select
          id="subType"
          value={subType}
          onChange={(e) => setSubType(e.target.value as SubmissionType)}
          className={selectClass}
        >
          {SUBMISSION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* File picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          File <span className="text-red-500">*</span>{' '}
          <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 MB)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          required
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 text-sm cursor-pointer w-full"
        />
      </div>

      {/* Status messages */}
      {status === 'success' && (
        <p className="text-sm text-green-600 font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          Submitted successfully! An admin will review it and award points.
        </p>
      )}
      {(status === 'error' || errorMsg) && (
        <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMsg || 'Upload failed. Please try again.'}
        </p>
      )}

      <button
        type="submit"
        disabled={!file || !eventId || isUploading}
        className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? 'Uploading…' : 'Submit for Review'}
      </button>
    </form>
  );
}
