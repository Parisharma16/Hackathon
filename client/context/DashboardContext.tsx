'use client';

/**
 * DashboardContext
 * Holds lightweight UI state (e.g. the active events-filter pill) at the
 * dashboard-layout level.  Because the layout component is never unmounted
 * while the user navigates between dashboard routes, state here survives
 * page transitions — including pressing the Back button from an event page.
 */

import { createContext, useContext, useState } from 'react';
import type { EventType } from '@/lib/types';

export type EventFilter = 'All' | EventType;

interface DashboardState {
  eventsFilter:    EventFilter;
  setEventsFilter: (f: EventFilter) => void;
}

const DashboardContext = createContext<DashboardState>({
  eventsFilter:    'All',
  setEventsFilter: () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [eventsFilter, setEventsFilter] = useState<EventFilter>('All');

  return (
    <DashboardContext.Provider value={{ eventsFilter, setEventsFilter }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardState() {
  return useContext(DashboardContext);
}
