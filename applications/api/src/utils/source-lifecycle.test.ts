import { describe, expect, it } from "bun:test";
import { CalendarFetchError } from "@keeper.sh/calendar";
import {
  SourceLimitError,
  runCreateSource,
  runDeleteSource,
} from "./source-lifecycle";

interface TestSource {
  id: string;
  accountId: string;
  userId: string;
  name: string;
  url: string | null;
  createdAt: Date;
}

const createSourceRecord = (overrides: Partial<TestSource> = {}): TestSource => ({
  accountId: "account-1",
  createdAt: new Date("2026-03-08T12:00:00.000Z"),
  id: "source-1",
  name: "My Calendar",
  url: "https://example.com/calendar.ics",
  userId: "user-1",
  ...overrides,
});

const missingSourceLifecycleCallback = (): Promise<void> =>
  Promise.reject(new Error("Expected background callback"));

describe("runCreateSource", () => {
  it("rejects source creation when plan limit is exceeded", async () => {
    await expect(
      runCreateSource(
        {
          name: "Team Feed",
          url: "https://example.com/team.ics",
          userId: "user-1",
        },
        {
          canAddSource: () => Promise.resolve(false),
          countExistingMappedSources: () => Promise.resolve(3),
          createCalendarAccount: () => Promise.resolve("account-1"),
          createSourceCalendar: () => Promise.resolve(createSourceRecord()),
          fetchAndSyncSource: () => Promise.resolve(),
          spawnBackgroundJob: Boolean,
          triggerDestinationSync: Boolean,
          validateSourceUrl: () => Promise.resolve(),
        },
      ),
    ).rejects.toBeInstanceOf(SourceLimitError);
  });

  it("wraps CalendarFetchError details in InvalidSourceUrlError", async () => {
    const rejection = new CalendarFetchError("auth needed", 401);

    await expect(
      runCreateSource(
        {
          name: "Team Feed",
          url: "https://example.com/private.ics",
          userId: "user-1",
        },
        {
          canAddSource: () => Promise.resolve(true),
          countExistingMappedSources: () => Promise.resolve(0),
          createCalendarAccount: () => Promise.resolve("account-1"),
          createSourceCalendar: () => Promise.resolve(createSourceRecord()),
          fetchAndSyncSource: () => Promise.resolve(),
          spawnBackgroundJob: Boolean,
          triggerDestinationSync: Boolean,
          validateSourceUrl: () => Promise.reject(rejection),
        },
      ),
    ).rejects.toMatchObject({
      authRequired: true,
      message: "auth needed",
    });
  });

  it("creates source and schedules background fetch-sync callback", async () => {
    const createdSource = createSourceRecord({
      accountId: "account-42",
      id: "source-99",
      name: "Team Feed",
      url: "https://example.com/feed.ics",
      userId: "user-42",
    });
    let backgroundCallback: () => Promise<void> = missingSourceLifecycleCallback;
    const fetchSyncedSourceIds: string[] = [];
    const syncedUserIds: string[] = [];

    const result = await runCreateSource(
      {
        name: "Team Feed",
        url: "https://example.com/feed.ics",
        userId: "user-42",
      },
      {
        canAddSource: () => Promise.resolve(true),
        countExistingMappedSources: () => Promise.resolve(2),
        createCalendarAccount: () => Promise.resolve("account-42"),
        createSourceCalendar: (payload) => Promise.resolve(createSourceRecord({
            accountId: payload.accountId,
            id: "source-99",
            name: payload.name,
            url: payload.url,
            userId: payload.userId,
          })),
        fetchAndSyncSource: (source) => {
          fetchSyncedSourceIds.push(source.id);
          return Promise.resolve();
        },
        spawnBackgroundJob: (jobName, fields, callback) => {
          expect(jobName).toBe("ical-source-sync");
          expect(fields).toEqual({ calendarId: "source-99", userId: "user-42" });
          backgroundCallback = callback;
        },
        triggerDestinationSync: (userId) => {
          syncedUserIds.push(userId);
        },
        validateSourceUrl: () => Promise.resolve(),
      },
    );

    expect(result).toEqual(createdSource);
    expect(backgroundCallback).not.toBe(missingSourceLifecycleCallback);

    await backgroundCallback();

    expect(fetchSyncedSourceIds).toEqual(["source-99"]);
    expect(syncedUserIds).toEqual(["user-42"]);
  });

  it("throws when calendar account creation fails", async () => {
    await expect(
      runCreateSource(
        {
          name: "Team Feed",
          url: "https://example.com/feed.ics",
          userId: "user-1",
        },
        {
          canAddSource: () => Promise.resolve(true),
          countExistingMappedSources: () => Promise.resolve(0),
          createCalendarAccount: () => Promise.resolve(""),
          createSourceCalendar: () => Promise.resolve(createSourceRecord()),
          fetchAndSyncSource: () => Promise.resolve(),
          spawnBackgroundJob: Boolean,
          triggerDestinationSync: Boolean,
          validateSourceUrl: () => Promise.resolve(),
        },
      ),
    ).rejects.toThrow("Failed to create calendar account");
  });

  it("throws when source calendar creation fails", async () => {
    await expect(
      runCreateSource(
        {
          name: "Team Feed",
          url: "https://example.com/feed.ics",
          userId: "user-1",
        },
        {
          canAddSource: () => Promise.resolve(true),
          countExistingMappedSources: () => Promise.resolve(0),
          createCalendarAccount: () => Promise.resolve("account-1"),
          createSourceCalendar: () =>
            Promise.resolve<TestSource | undefined>(globalThis.undefined),
          fetchAndSyncSource: () => Promise.resolve(),
          spawnBackgroundJob: Boolean,
          triggerDestinationSync: Boolean,
          validateSourceUrl: () => Promise.resolve(),
        },
      ),
    ).rejects.toThrow("Failed to create source");
  });
});

describe("runDeleteSource", () => {
  it("triggers destination sync only when source deletion succeeds", async () => {
    const syncedUserIds: string[] = [];

    const deleted = await runDeleteSource(
      {
        calendarId: "source-1",
        userId: "user-1",
      },
      {
        deleteSourceCalendar: () => Promise.resolve(true),
        triggerDestinationSync: (userId) => {
          syncedUserIds.push(userId);
        },
      },
    );

    expect(deleted).toBe(true);
    expect(syncedUserIds).toEqual(["user-1"]);
  });

  it("does not trigger destination sync when deletion does not occur", async () => {
    const syncedUserIds: string[] = [];

    const deleted = await runDeleteSource(
      {
        calendarId: "source-404",
        userId: "user-1",
      },
      {
        deleteSourceCalendar: () => Promise.resolve(false),
        triggerDestinationSync: (userId) => {
          syncedUserIds.push(userId);
        },
      },
    );

    expect(deleted).toBe(false);
    expect(syncedUserIds).toEqual([]);
  });
});
