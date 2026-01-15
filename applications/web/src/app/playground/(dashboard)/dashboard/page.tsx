import { Heading1, Copy, CalendarGrid, EventList, TODAY_EVENTS, TOMORROW_EVENTS } from "@keeper.sh/ui";

const ALL_EVENTS = [...TODAY_EVENTS, ...TOMORROW_EVENTS];

const DashboardPage = () => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-2">
      <Heading1>Welcome, Rida</Heading1>
      <Copy>It&apos;s Friday the 9th and you&apos;ve got 5 events today across 2 calendars.</Copy>
    </div>
    <div className="flex flex-col gap-4">
      <CalendarGrid />
      <EventList events={ALL_EVENTS} />
    </div>
  </div>
);

export default DashboardPage;
