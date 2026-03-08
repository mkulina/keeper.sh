import { describe, expect, it } from "bun:test";
import { parseGoogleEvents } from "./fetch-events";
import type { EventTypeFilters } from "./fetch-events";
import type { GoogleCalendarEvent } from "../types";

const createDefaultFilters = (): EventTypeFilters => ({
  excludeFocusTime: false,
  excludeOutOfOffice: false,
  excludeWorkingLocation: false,
});

const createGoogleEvent = (overrides: Partial<GoogleCalendarEvent>): GoogleCalendarEvent => ({
  end: {
    dateTime: "2026-03-08T15:00:00.000Z",
    timeZone: "America/Toronto",
  },
  iCalUID: "external-uid-1",
  id: "google-event-id-1",
  start: {
    dateTime: "2026-03-08T14:00:00.000Z",
    timeZone: "America/Toronto",
  },
  status: "confirmed",
  summary: "Planning Session",
  ...overrides,
});

describe("parseGoogleEvents", () => {
  it("filters keeper events and excluded Google event types", () => {
    const externalEvent = createGoogleEvent({ iCalUID: "external-uid-1" });
    const keeperEvent = createGoogleEvent({
      iCalUID: "generated-event@keeper.sh",
      id: "google-event-id-2",
    });
    const focusTimeEvent = createGoogleEvent({
      eventType: "focusTime",
      iCalUID: "external-uid-2",
      id: "google-event-id-3",
    });

    const filters: EventTypeFilters = {
      excludeFocusTime: true,
      excludeOutOfOffice: false,
      excludeWorkingLocation: false,
    };

    const parsedEvents = parseGoogleEvents(
      [externalEvent, keeperEvent, focusTimeEvent],
      filters,
    );

    expect(parsedEvents).toHaveLength(1);
    expect(parsedEvents[0]?.uid).toBe("external-uid-1");
  });

  it("uses end timezone when start timezone is absent", () => {
    const googleEvent = createGoogleEvent({
      end: {
        dateTime: "2026-03-08T15:00:00.000Z",
        timeZone: "America/Vancouver",
      },
      iCalUID: "external-uid-4",
      start: {
        dateTime: "2026-03-08T14:00:00.000Z",
      },
    });

    const parsedEvents = parseGoogleEvents([googleEvent], createDefaultFilters());

    expect(parsedEvents).toHaveLength(1);
    expect(parsedEvents[0]?.startTimeZone).toBe("America/Vancouver");
  });
});
