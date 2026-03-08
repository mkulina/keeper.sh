import { describe, expect, it } from "bun:test";
import { parseIcsCalendar } from "./parse-ics-calendar";
import { parseIcsEvents } from "./parse-ics-events";

const createCalendarIcsString = (): string =>
  [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Keeper Test//EN",
    "BEGIN:VEVENT",
    "UID:external-event-1",
    "DTSTART;TZID=America/Toronto:20260310T090000",
    "DURATION:PT30M",
    "SUMMARY:Team Sync",
    "DESCRIPTION:Weekly planning",
    "LOCATION:Room 42",
    "RRULE:FREQ=WEEKLY;BYDAY=TU",
    "EXDATE;TZID=America/Toronto:20260317T090000",
    "END:VEVENT",
    "BEGIN:VEVENT",
    "UID:internal-event@keeper.sh",
    "DTSTART:20260311T100000Z",
    "DTEND:20260311T103000Z",
    "SUMMARY:Internal",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

describe("parseIcsEvents", () => {
  it("parses external events and skips keeper-managed events", () => {
    const calendar = parseIcsCalendar({ icsString: createCalendarIcsString() });
    const parsedEvents = parseIcsEvents(calendar);

    expect(parsedEvents).toHaveLength(1);

    const parsedEvent = parsedEvents[0];
    if (!parsedEvent) {
      throw new Error("Expected parsed event");
    }

    expect(parsedEvent.uid).toBe("external-event-1");
    expect(parsedEvent.title).toBe("Team Sync");
    expect(parsedEvent.description).toBe("Weekly planning");
    expect(parsedEvent.location).toBe("Room 42");
    expect(parsedEvent.startTimeZone).toBe("America/Toronto");
    expect(parsedEvent.endTime.getTime() - parsedEvent.startTime.getTime()).toBe(30 * 60 * 1000);

    const recurrenceRule = parsedEvent.recurrenceRule;
    expect(recurrenceRule).toBeDefined();
    if (!recurrenceRule || typeof recurrenceRule !== "object") {
      throw new Error("Expected recurrence rule object");
    }
    expect("frequency" in recurrenceRule && recurrenceRule.frequency).toBe("WEEKLY");

    const exceptionDates = parsedEvent.exceptionDates;
    expect(exceptionDates).toBeDefined();
    expect(Array.isArray(exceptionDates)).toBe(true);
    if (!Array.isArray(exceptionDates)) {
      throw new Error("Expected exception dates array");
    }
    expect(exceptionDates).toHaveLength(1);
  });
});
