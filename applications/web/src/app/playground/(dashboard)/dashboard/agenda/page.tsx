import { EventList } from "../../../compositions/event-list/event-list";
import { WEEK_EVENTS } from "./utils/mock-events";

const AgendaPage = () => (
  <div className="flex flex-col gap-4">
    <EventList events={WEEK_EVENTS} />
  </div>
);

export default AgendaPage;
