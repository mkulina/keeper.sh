import { describe, expect, it } from "bun:test";
import { parseOutlookEvents } from "./fetch-events";
import type { OutlookCalendarEvent } from "../types";

const createOutlookEvent = (
  overrides: Partial<OutlookCalendarEvent>,
): OutlookCalendarEvent => ({
  end: {
    dateTime: "2026-03-08T15:00:00",
    timeZone: "UTC",
  },
  iCalUId: "external-uid-1",
  id: "outlook-event-id-1",
  start: {
    dateTime: "2026-03-08T14:00:00",
    timeZone: "UTC",
  },
  subject: "Outlook Planning",
  ...overrides,
});

describe("parseOutlookEvents", () => {
  it("parses valid events and normalizes UTC date strings", () => {
    const parsedEvents = parseOutlookEvents([createOutlookEvent({})]);

    expect(parsedEvents).toHaveLength(1);

    const parsedEvent = parsedEvents[0];
    if (!parsedEvent) {
      throw new Error("Expected parsed event");
    }

    expect(parsedEvent.uid).toBe("external-uid-1");
    expect(parsedEvent.startTime.toISOString()).toBe("2026-03-08T14:00:00.000Z");
    expect(parsedEvent.endTime.toISOString()).toBe("2026-03-08T15:00:00.000Z");
    expect(parsedEvent.startTimeZone).toBe("UTC");
  });

  it("skips keeper-managed and malformed events", () => {
    const validEvent = createOutlookEvent({
      iCalUId: "external-uid-2",
      id: "outlook-event-id-2",
    });
    const keeperEvent = createOutlookEvent({
      iCalUId: "internal-event@keeper.sh",
      id: "outlook-event-id-3",
    });
    const malformedEvent = createOutlookEvent({
      end: { dateTime: "2026-03-08T15:00:00" },
      iCalUId: "external-uid-3",
      id: "outlook-event-id-4",
      start: { dateTime: "2026-03-08T14:00:00", timeZone: "UTC" },
    });

    const parsedEvents = parseOutlookEvents([validEvent, keeperEvent, malformedEvent]);

    expect(parsedEvents).toHaveLength(1);
    expect(parsedEvents[0]?.uid).toBe("external-uid-2");
  });
});
