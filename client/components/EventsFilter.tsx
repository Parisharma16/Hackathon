'use client';

/**
 * EventsFilter
 * - Search bar  (filters by event title)
 * - Category pills  (All / Academic / Co-Curricular / Extra-Curricular)
 * - Advanced filter modal  (organising club, venue, date range)
 *
 * Category type lives in DashboardContext so it survives Back navigation.
 * Search + advanced filters are local — they reset intentionally on navigation.
 */

import { useState } from 'react';
import EventCard from '@/components/EventCard';
import { useDashboardState } from '@/context/DashboardContext';
import type { Event, EventType, UserRole } from '@/lib/types';

type Filter = 'All' | EventType;

interface AdvancedFilters {
  organizer: string;
  location:  string;
  dateFrom:  string;
  dateTo:    string;
}

const EMPTY_ADV: AdvancedFilters = { organizer: '', location: '', dateFrom: '', dateTo: '' };

// ── SVG icons for category pills ────────────────────────────────────────────

const IconAll = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2" />
    <path d="M8 12h8M12 8v8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconAcademic = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 3L2 9l10 6 10-6-10-6z" strokeWidth="2" strokeLinejoin="round" />
    <path d="M2 9v6M22 9v6M6 11.5V17c0 1.1 2.7 3 6 3s6-1.9 6-3v-5.5" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconCoCurricular = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="9"  cy="7"  r="3" strokeWidth="2" />
    <circle cx="17" cy="7"  r="3" strokeWidth="2" />
    <path d="M3 20c0-3.3 2.7-6 6-6h6c3.3 0 6 2.7 6 6" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconExtraCurricular = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const FILTERS: { value: Filter; label: string; icon: React.ReactNode }[] = [
  { value: 'All',             label: 'All',             icon: <IconAll /> },
  { value: 'academic',        label: 'Academic',        icon: <IconAcademic /> },
  { value: 'cocurricular',    label: 'Co-Curricular',   icon: <IconCoCurricular /> },
  { value: 'extracurricular', label: 'Extra-Curricular',icon: <IconExtraCurricular /> },
];

// ── Filter / search icon SVGs ────────────────────────────────────────────────

const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" strokeWidth="2" />
    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconSliders = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <line x1="4"  y1="6"  x2="20" y2="6"  strokeWidth="2" strokeLinecap="round" />
    <line x1="4"  y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
    <line x1="4"  y1="18" x2="20" y2="18" strokeWidth="2" strokeLinecap="round" />
    <circle cx="8"  cy="6"  r="2" fill="white" strokeWidth="2" />
    <circle cx="16" cy="12" r="2" fill="white" strokeWidth="2" />
    <circle cx="10" cy="18" r="2" fill="white" strokeWidth="2" />
  </svg>
);
const IconClose = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ── Props ────────────────────────────────────────────────────────────────────

interface EventsFilterProps {
  events:    Event[];
  userRole?: UserRole;
  userId?:   string;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EventsFilter({ events, userRole, userId }: EventsFilterProps) {
  const { eventsFilter: active, setEventsFilter: setActive } = useDashboardState();

  const [search,      setSearch]      = useState('');
  const [showModal,   setShowModal]   = useState(false);
  const [draft,       setDraft]       = useState<AdvancedFilters>(EMPTY_ADV);
  const [applied,     setApplied]     = useState<AdvancedFilters>(EMPTY_ADV);

  // Derive dropdown options from event data
  const organizers = [...new Set(events.map((e) => e.organized_by))].sort();
  const locations  = [...new Set(events.map((e) => e.location))].sort();

  // Apply all filters in sequence
  let filtered = active === 'All' ? events : events.filter((e) => e.type === active);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((e) => e.title.toLowerCase().includes(q));
  }
  if (applied.organizer) filtered = filtered.filter((e) => e.organized_by === applied.organizer);
  if (applied.location)  filtered = filtered.filter((e) => e.location      === applied.location);
  if (applied.dateFrom)  filtered = filtered.filter((e) => e.date          >= applied.dateFrom);
  if (applied.dateTo)    filtered = filtered.filter((e) => e.date          <= applied.dateTo);

  const activeAdvCount = Object.values(applied).filter(Boolean).length;

  const openModal  = () => { setDraft(applied); setShowModal(true); };
  const closeModal = () => setShowModal(false);
  const applyModal = () => { setApplied(draft); setShowModal(false); };
  const clearModal = () => { setDraft(EMPTY_ADV); setApplied(EMPTY_ADV); };

  const setDraftField = (field: keyof AdvancedFilters) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
      setDraft((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div>
      {/* ── Search bar row ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search input */}
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5">
          <span className="text-gray-400 shrink-0"><IconSearch /></span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find activities..."
            className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <IconClose />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={openModal}
          className="relative flex items-center justify-center w-11 h-11 bg-white rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
          aria-label="Advanced filters"
        >
          <IconSliders />
          {activeAdvCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeAdvCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Category pills ─────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {FILTERS.map(({ value, label, icon }) => {
          const isActive = active === value;
          return (
            <button
              key={value}
              onClick={() => setActive(value)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all
                ${isActive
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600'
                }`}
            >
              <span className={isActive ? 'text-white' : 'text-gray-400'}>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Events grid ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} userRole={userRole} userId={userId} />
          ))}
        </div>
      )}

      {/* ── Advanced filter modal ───────────────────────────────────────── */}
      {showModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Bottom sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">Filter Events</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700">
                <IconClose />
              </button>
            </div>

            <div className="space-y-5">
              {/* Organising Club */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Organising Club / Department
                </label>
                <select
                  value={draft.organizer}
                  onChange={setDraftField('organizer')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Any</option>
                  {organizers.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Venue
                </label>
                <select
                  value={draft.location}
                  onChange={setDraftField('location')}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Any</option>
                  {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              {/* Date range */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">From</p>
                    <input
                      type="date"
                      value={draft.dateFrom}
                      onChange={setDraftField('dateFrom')}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">To</p>
                    <input
                      type="date"
                      value={draft.dateTo}
                      onChange={setDraftField('dateTo')}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={clearModal}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={applyModal}
                className="flex-1 py-3 rounded-2xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                Apply{activeAdvCount > 0 ? ` (${Object.values(draft).filter(Boolean).length})` : ''}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
