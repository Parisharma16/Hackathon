'use client';

/**
 * ProfileEditForm
 *
 * Inline form that lets the logged-in user update their name, year, and branch.
 * Uses PATCH /auth/me/ and refreshes the user_year cookie so the leaderboard
 * default-year logic reflects the new value immediately after save.
 *
 * Rendered as a collapsible section inside the profile page.
 */

import { useState } from 'react';
import { updateMyProfile } from '@/lib/api';
import { storeUserInfo } from '@/lib/auth';
import type { User } from '@/lib/types';

interface ProfileEditFormProps {
  /** Current user data pre-populated into the form fields. */
  user: User;
}

export default function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [open,    setOpen]    = useState(false);
  const [name,    setName]    = useState(user.name    ?? '');
  const [year,    setYear]    = useState<string>(user.year?.toString() ?? '');
  const [branch,  setBranch]  = useState(user.branch  ?? '');
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload: Parameters<typeof updateMyProfile>[0] = { name, branch };
      if (year) payload.year = Number(year);

      const updated = await updateMyProfile(payload);

      // Refresh the user_year cookie so the leaderboard page picks up the new
      // value on the next navigation without requiring a full re-login.
      storeUserInfo(updated);

      setSuccess(true);
      // Close the form automatically after 1.5 s on success.
      setTimeout(() => { setOpen(false); setSuccess(false); }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ' +
    'text-gray-900 shadow-sm placeholder-gray-400 ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500';

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-2"
      >
        {open ? 'Cancel edit' : 'Edit profile'}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-w-sm">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              Profile updated successfully.
            </p>
          )}

          {/* Name */}
          <div>
            <label htmlFor="pe-name" className="block text-xs font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="pe-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>

          {/* Year + Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pe-year" className="block text-xs font-medium text-gray-700">
                Year
              </label>
              <select
                id="pe-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className={inputClass}
              >
                <option value="">-- select --</option>
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pe-branch" className="block text-xs font-medium text-gray-700">
                Branch
              </label>
              <input
                id="pe-branch"
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className={inputClass}
                placeholder="e.g. CSE"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold
                       hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  );
}
