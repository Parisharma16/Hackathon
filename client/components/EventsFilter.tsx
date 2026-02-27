'use client';

/**
 * Client component that owns the active-filter state and renders
 * the filter pills + filtered event grid.  Receives the full events
 * list from the parent Server Component so no extra fetch is needed.
 */

import { useState } from 'react';
import EventCard from '@/components/EventCard';
import type { Event, EventType, UserRole } from '@/lib/types';

type Filter = 'All' | EventType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'All',             label: 'All'            },
  { value: 'academic',        label: 'Academic'        },
  { value: 'cocurricular',    label: 'Co-Curricular'   },
  { value: 'extracurricular', label: 'Extra-Curricular'},
];

interface EventsFilterProps {
  events:   Event[];
  userRole?: UserRole;
  userId?:  string;
}

export default function EventsFilter({ events, userRole, userId }: EventsFilterProps) {
  const [active, setActive] = useState<Filter>('All');

  const filtered = active === 'All'
    ? events
    : events.filter((e) => e.type === active);

  return (
    <>
      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActive(value)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors
              ${active === value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
          >
            {label}
            {/* Show count per category */}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full
              ${active === value ? 'bg-blue-500 text-blue-100' : 'bg-gray-100 text-gray-500'}`}>
              {value === 'All' ? events.length : events.filter((e) => e.type === value).length}
            </span>
          </button>
        ))}
      </div>

      {/* Events grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🔍</p>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-500">Try a different filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} userRole={userRole} userId={userId} />
          ))}
        </div>
      )}
    </>
  );
}
