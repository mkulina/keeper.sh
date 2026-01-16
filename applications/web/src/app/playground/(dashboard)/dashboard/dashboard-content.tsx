"use client";

import { Copy, EventList, TODAY_EVENTS, TOMORROW_EVENTS, CalendarGrid } from "@keeper.sh/ui";

const ALL_EVENTS = [...TODAY_EVENTS, ...TOMORROW_EVENTS];

export const DashboardContent = () => (
  <div className="flex flex-col gap-4">
    <CalendarGrid />
    <EventList events={ALL_EVENTS} />
  </div>
);
