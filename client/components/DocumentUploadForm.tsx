'use client';

/**
 * Submission upload form.
 *
 * POST /submissions/upload/
 * multipart/form-data fields:
 *   submission_type  – "certificate" | "cgpa" | "paper"  (required)
 *   file             – the document                       (required, pdf/jpg/jpeg/png, max 5 MB)
 *
 * NOTE: As per the API spec, submissions are NOT tied to a specific event.
 * The backend assigns points manually after an admin reviews the document.
 */

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSubmission } from '@/lib/api';
import type { SubmissionType } from '@/lib/types';

const SUBMISSION_TYPES: { value: SubmissionType; label: string }[] = [
  { value: 'certificate', label: 'Participation Certificate' },
  { value: 'cgpa',        label: 'CGPA Document'            },
  { value: 'paper',       label: 'Research Paper'           },
];

// Must match the backend MAX_UPLOAD_BYTES limit (5 MB).
const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface DocumentUploadFormProps {
  /** Optional callback invoked after a successful upload. */
  onSuccess?: () => void;
}

export default function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const router = useRouter();
  const [subType, setSubType]           = useState<SubmissionType>('certificate');
  const [file, setFile]                 = useState<File | null>(null);
  const [isUploading, setIsUploading]   = useState(false);
  const [status, setStatus]             = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg]         = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!file) return;

    setIsUploading(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      await createSubmission(subType, file);
      setStatus('success');
      setFile(null);
      setSubType('certificate');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onSuccess?.();
      // Brief pause so the user sees the success message before navigating away.
      setTimeout(() => router.push('/dashboard/profile'), 1200);
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
        <label htmlFor="docFile" className="block text-sm font-medium text-gray-700 mb-1">
          File <span className="text-red-500">*</span>{' '}
          <span className="text-gray-400 font-normal">(PDF, JPG, PNG — max 5 MB)</span>
        </label>
        <input
          ref={fileInputRef}
          id="docFile"
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
        disabled={!file || isUploading}
        className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? 'Uploading...' : 'Submit for Review'}
      </button>
    </form>
  );
}
