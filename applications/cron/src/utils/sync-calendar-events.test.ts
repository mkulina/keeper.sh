import { describe, expect, it } from "bun:test";
import type { SyncResult } from "@keeper.sh/provider-core";
import { runSyncJob, syncUserSources } from "./sync-calendar-events";

const createSyncResult = (overrides: Partial<SyncResult>): SyncResult => ({
  addFailed: 0,
  added: 0,
  removeFailed: 0,
  removed: 0,
  ...overrides,
});

describe("syncUserSources", () => {
  it("continues to destination sync when source syncs fail", async () => {
    const fetchedSourceIds: string[] = [];
    const destinationSyncRequests: string[] = [];

    const result = await syncUserSources(
      "user-1",
      [{ id: "source-1" }, { id: "source-2" }],
      {
        fetchAndSyncSourceForCalendar: async (source) => {
          fetchedSourceIds.push(source.id);
          if (source.id === "source-2") {
            throw new Error("source sync failed");
          }
        },
        syncDestinationsForUser: async (userId) => {
          destinationSyncRequests.push(userId);
          return createSyncResult({ added: 3, removed: 1 });
        },
      },
    );

    expect(fetchedSourceIds).toEqual(["source-1", "source-2"]);
    expect(destinationSyncRequests).toEqual(["user-1"]);
    expect(result).toEqual(createSyncResult({ added: 3, removed: 1 }));
  });
});

describe("runSyncJob", () => {
  it("syncs all users with destinations and aggregates fulfilled totals", async () => {
    const cronEventFieldSets: Record<string, unknown>[] = [];
    const syncRequests: { userId: string; sourceIds: string[] }[] = [];

    await runSyncJob("free", {
      getSourcesByPlan: async () => [
        { id: "source-1", userId: "user-1" },
        { id: "source-2", userId: "user-1" },
      ],
      getUsersWithDestinationsByPlan: async () => ["user-1", "user-2"],
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
      syncUserSourcesForUser: async (userId, sources) => {
        syncRequests.push({
          sourceIds: sources.map((source) => source.id),
          userId,
        });

        if (userId === "user-2") {
          throw new Error("destination sync failed");
        }

        return createSyncResult({
          addFailed: 1,
          added: 4,
          removeFailed: 2,
          removed: 3,
        });
      },
    });

    expect(syncRequests).toEqual([
      { sourceIds: ["source-1", "source-2"], userId: "user-1" },
      { sourceIds: [], userId: "user-2" },
    ]);
    expect(cronEventFieldSets).toHaveLength(2);
    expect(cronEventFieldSets[0]).toEqual({
      "processed.count": 2,
      "source.count": 2,
      "subscription.plan": "free",
    });
    expect(cronEventFieldSets[1]).toEqual({
      "events.added": 4,
      "events.add_failed": 1,
      "events.removed": 3,
      "events.remove_failed": 2,
      "user.failed.count": 1,
    });
  });

  it("reports zero totals when all user syncs reject", async () => {
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runSyncJob("pro", {
      getSourcesByPlan: async () => [{ id: "source-1", userId: "user-1" }],
      getUsersWithDestinationsByPlan: async () => ["user-1"],
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
      syncUserSourcesForUser: async () => {
        throw new Error("sync failed");
      },
    });

    expect(cronEventFieldSets).toEqual([
      {
        "processed.count": 1,
        "source.count": 1,
        "subscription.plan": "pro",
      },
      {
        "events.added": 0,
        "events.add_failed": 0,
        "events.removed": 0,
        "events.remove_failed": 0,
        "user.failed.count": 1,
      },
    ]);
  });

  it("handles users with destinations when there are no source calendars", async () => {
    const syncRequests: { userId: string; sourceCount: number }[] = [];
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runSyncJob("free", {
      getSourcesByPlan: async () => [],
      getUsersWithDestinationsByPlan: async () => ["user-1", "user-2"],
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
      syncUserSourcesForUser: async (userId, sources) => {
        syncRequests.push({ sourceCount: sources.length, userId });
        return createSyncResult({});
      },
    });

    expect(syncRequests).toEqual([
      { sourceCount: 0, userId: "user-1" },
      { sourceCount: 0, userId: "user-2" },
    ]);
    expect(cronEventFieldSets[1]).toEqual({
      "events.added": 0,
      "events.add_failed": 0,
      "events.removed": 0,
      "events.remove_failed": 0,
      "user.failed.count": 0,
    });
  });

  it("aggregates large mixed user sync outcomes correctly", async () => {
    const userCount = 90;
    const users = Array.from({ length: userCount }, (_value, index) => `user-${index}`);
    const cronEventFieldSets: Record<string, unknown>[] = [];

    let expectedUserFailedCount = 0;
    let expectedAdded = 0;
    let expectedAddFailed = 0;
    let expectedRemoved = 0;
    let expectedRemoveFailed = 0;

    for (const user of users) {
      const index = Number(user.replace("user-", ""));
      if (index % 4 === 0) {
        expectedUserFailedCount += 1;
        continue;
      }
      expectedAdded += index % 5;
      expectedAddFailed += index % 3;
      expectedRemoved += index % 7;
      expectedRemoveFailed += index % 2;
    }

    await runSyncJob("pro", {
      getSourcesByPlan: async () =>
        users.map((userId, index) => ({ id: `source-${index}`, userId })),
      getUsersWithDestinationsByPlan: async () => users,
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
      syncUserSourcesForUser: async (userId) => {
        const index = Number(userId.replace("user-", ""));
        if (index % 4 === 0) {
          throw new Error(`sync failure ${index}`);
        }
        return createSyncResult({
          addFailed: index % 3,
          added: index % 5,
          removeFailed: index % 2,
          removed: index % 7,
        });
      },
    });

    expect(cronEventFieldSets[1]).toEqual({
      "events.added": expectedAdded,
      "events.add_failed": expectedAddFailed,
      "events.removed": expectedRemoved,
      "events.remove_failed": expectedRemoveFailed,
      "user.failed.count": expectedUserFailedCount,
    });
  });
});
