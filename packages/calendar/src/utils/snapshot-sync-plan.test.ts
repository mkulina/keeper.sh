import { describe, expect, it } from "bun:test";
import { buildSnapshotSyncPlan } from "./snapshot-sync-plan";
import type { EventTimeSlot } from "../types";
import type { SnapshotStoredEvent } from "./snapshot-sync-plan";

const createEventTimeSlot = (overrides: Partial<EventTimeSlot>): EventTimeSlot => ({
  endTime: new Date("2026-03-09T15:00:00.000Z"),
  startTime: new Date("2026-03-09T14:00:00.000Z"),
  startTimeZone: "America/Toronto",
  uid: "event-uid-1",
  ...overrides,
});

const createStoredEvent = (overrides: Partial<SnapshotStoredEvent>): SnapshotStoredEvent => ({
  endTime: new Date("2026-03-09T15:00:00.000Z"),
  id: "stored-id-1",
  startTime: new Date("2026-03-09T14:00:00.000Z"),
  startTimeZone: "America/Toronto",
  uid: "event-uid-1",
  ...overrides,
});

describe("buildSnapshotSyncPlan", () => {
  it("excludes remote events already mapped on destination", () => {
    const parsedEvents = [
      createEventTimeSlot({ uid: "allowed-uid" }),
      createEventTimeSlot({ uid: "mapped-uid" }),
    ];

    const result = buildSnapshotSyncPlan({
      mappedDestinationUids: new Set(["mapped-uid"]),
      parsedEvents,
      storedEvents: [],
    });

    expect(result.toAdd).toHaveLength(1);
    expect(result.toAdd[0]?.uid).toBe("allowed-uid");
  });

  it("always removes legacy stored events without source uid", () => {
    const legacyStoredEvent = createStoredEvent({
      id: "legacy-id",
      uid: null,
    });

    const result = buildSnapshotSyncPlan({
      mappedDestinationUids: new Set(),
      parsedEvents: [],
      storedEvents: [legacyStoredEvent],
    });

    expect(result.toAdd).toHaveLength(0);
    expect(result.toRemove).toHaveLength(1);
    expect(result.toRemove[0]?.id).toBe("legacy-id");
  });

  it("returns add and remove when stored and parsed recurrence differ", () => {
    const parsedEvents = [
      createEventTimeSlot({
        recurrenceRule: { frequency: "WEEKLY", interval: 2 },
        uid: "recurrence-uid",
      }),
    ];

    const storedEvents = [
      createStoredEvent({
        recurrenceRule: { frequency: "WEEKLY", interval: 1 },
        uid: "recurrence-uid",
      }),
    ];

    const result = buildSnapshotSyncPlan({
      mappedDestinationUids: new Set(),
      parsedEvents,
      storedEvents,
    });

    expect(result.toAdd).toHaveLength(1);
    expect(result.toRemove).toHaveLength(1);
  });

  it("returns no changes when parsed and stored events are equivalent", () => {
    const parsedEvent = createEventTimeSlot({
      exceptionDates: [{ date: new Date("2026-03-16T14:00:00.000Z") }],
      recurrenceRule: { frequency: "WEEKLY", interval: 1 },
      uid: "stable-uid",
    });

    const storedEvent = createStoredEvent({
      exceptionDates: [{ date: "2026-03-16T14:00:00.000Z" }],
      recurrenceRule: { interval: 1, frequency: "WEEKLY" },
      uid: "stable-uid",
    });

    const result = buildSnapshotSyncPlan({
      mappedDestinationUids: new Set(),
      parsedEvents: [parsedEvent],
      storedEvents: [storedEvent],
    });

    expect(result.toAdd).toHaveLength(0);
    expect(result.toRemove).toHaveLength(0);
  });
});
