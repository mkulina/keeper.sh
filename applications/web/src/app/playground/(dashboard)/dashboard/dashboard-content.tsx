"use client";

import dynamic from "next/dynamic";
import { Copy, EventList, TODAY_EVENTS, TOMORROW_EVENTS } from "@keeper.sh/ui";

const CalendarGrid = dynamic(
  () => import("@keeper.sh/ui").then(m => ({ default: m.CalendarGrid })),
  { ssr: false }
);

const ALL_EVENTS = [...TODAY_EVENTS, ...TOMORROW_EVENTS];

export const DashboardContent = () => (
  <div className="flex flex-col gap-4">
    <CalendarGrid />
    <EventList events={ALL_EVENTS} />
  </div>
);
