'use client';

/**
 * WinnersPanel — interactive form that lets an organiser declare (or update)
 * the 1st, 2nd, and 3rd place winners for a completed event.
 *
 * Props:
 *   eventId          — UUID of the event
 *   initialWinners   — current winners_roll_nos array from the event (ordered)
 *
 * Calls PATCH /events/{id}/winners/ via setEventWinners().
 * Positions map to array indices: [0] = 1st, [1] = 2nd, [2] = 3rd.
 */

import { useState } from 'react';
import { setEventWinners } from '@/lib/api';

interface Props {
  eventId: string;
  initialWinners: string[];
}

const POSITIONS = [
  {
    label: '1st Place',
    badge: '1',
    inputClass: 'border-yellow-400 bg-yellow-50 focus:ring-yellow-400',
    badgeClass: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  },
  {
    label: '2nd Place',
    badge: '2',
    inputClass: 'border-gray-400 bg-gray-50 focus:ring-gray-400',
    badgeClass: 'bg-gray-100 text-gray-700 border border-gray-300',
  },
  {
    label: '3rd Place',
    badge: '3',
    inputClass: 'border-orange-400 bg-orange-50 focus:ring-orange-400',
    badgeClass: 'bg-orange-100 text-orange-800 border border-orange-300',
  },
] as const;

const IconTrophy = () => (
  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 21h8M12 17v4M7 4H4a1 1 0 00-1 1v3a4 4 0 004 4M17 4h3a1 1 0 011 1v3a4 4 0 01-4 4M7 4h10v6a5 5 0 01-10 0V4z" />
  </svg>
);

export default function WinnersPanel({ eventId, initialWinners }: Props) {
  // Pad the initial list to always have 3 slots
  const padded = [...initialWinners, '', '', ''].slice(0, 3);
  const [rolls, setRolls] = useState<[string, string, string]>([padded[0], padded[1], padded[2]]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(index: 0 | 1 | 2, value: string) {
    setRolls((prev) => {
      const next: [string, string, string] = [...prev] as [string, string, string];
      next[index] = value;
      return next;
    });
    setSuccess(false);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      // Send all 3 slots (including empty ones so the backend strips blanks)
      await setEventWinners(eventId, rolls);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update winners.');
    } finally {
      setSaving(false);
    }
  }

  const isDirty =
    rolls[0] !== padded[0] || rolls[1] !== padded[1] || rolls[2] !== padded[2];

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <IconTrophy />
        <p className="text-sm font-semibold text-amber-800 uppercase tracking-wide">
          Declare Winners
        </p>
      </div>

      {/* Position inputs */}
      <div className="flex flex-col gap-3 mb-4">
        {POSITIONS.map((pos, i) => (
          <div key={pos.label} className="flex items-center gap-3">
            <span className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${pos.badgeClass}`}>
              {pos.badge}
            </span>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {pos.label}
              </label>
              <input
                type="text"
                value={rolls[i as 0 | 1 | 2]}
                onChange={(e) => handleChange(i as 0 | 1 | 2, e.target.value)}
                placeholder="Roll number (leave blank if none)"
                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 transition-colors ${pos.inputClass}`}
                disabled={saving}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Feedback messages */}
      {success && (
        <p className="text-sm text-green-700 font-medium mb-3">
          Winners saved successfully.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 font-medium mb-3">
          {error}
        </p>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || (!isDirty && !success)}
        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
      >
        {saving ? 'Saving...' : 'Save Winners'}
      </button>
    </div>
  );
}
