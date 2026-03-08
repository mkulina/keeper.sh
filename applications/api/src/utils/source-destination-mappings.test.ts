import { describe, expect, it } from "bun:test";
import {
  runSetDestinationsForSource,
  runSetSourcesForDestination,
} from "./source-destination-mappings";

describe("runSetDestinationsForSource", () => {
  it("throws when source calendar is not found and does not trigger sync", async () => {
    let triggerCount = 0;

    await expect(
      runSetDestinationsForSource("user-1", "source-1", ["dest-1"], {
        triggerDestinationSync: () => {
          triggerCount += 1;
        },
        withTransaction: async (transactionCallback) =>
          transactionCallback({
            acquireUserLock: async () => {},
            findOwnedDestinationIds: async () => ["dest-1"],
            replaceSourceMappings: async () => {},
            ensureDestinationSyncStatuses: async () => {},
            sourceExists: async () => false,
          }),
      }),
    ).rejects.toThrow("Source calendar not found");

    expect(triggerCount).toBe(0);
  });

  it("throws when destination calendars include invalid IDs", async () => {
    await expect(
      runSetDestinationsForSource("user-1", "source-1", ["dest-1", "dest-2"], {
        triggerDestinationSync: () => {},
        withTransaction: async (transactionCallback) =>
          transactionCallback({
            acquireUserLock: async () => {},
            findOwnedDestinationIds: async () => ["dest-1"],
            replaceSourceMappings: async () => {},
            ensureDestinationSyncStatuses: async () => {},
            sourceExists: async () => true,
          }),
      }),
    ).rejects.toThrow("Some destination calendars not found");
  });

  it("replaces mappings, ensures statuses, and triggers sync on success", async () => {
    const operationLog: string[] = [];

    await runSetDestinationsForSource("user-1", "source-1", ["dest-1", "dest-2"], {
      triggerDestinationSync: (userId) => {
        operationLog.push(`trigger:${userId}`);
      },
      withTransaction: async (transactionCallback) =>
        transactionCallback({
          acquireUserLock: async (userId) => {
            operationLog.push(`lock:${userId}`);
          },
          ensureDestinationSyncStatuses: async (destinationIds) => {
            operationLog.push(`status:${destinationIds.join(",")}`);
          },
          findOwnedDestinationIds: async () => ["dest-1", "dest-2"],
          replaceSourceMappings: async (_sourceCalendarId, destinationIds) => {
            operationLog.push(`replace:${destinationIds.join(",")}`);
          },
          sourceExists: async () => true,
        }),
    });

    expect(operationLog).toEqual([
      "lock:user-1",
      "replace:dest-1,dest-2",
      "status:dest-1,dest-2",
      "trigger:user-1",
    ]);
  });

  it("does not fail the request when post-commit trigger throws", async () => {
    const errors: unknown[] = [];

    await expect(
      runSetDestinationsForSource("user-1", "source-1", ["dest-1"], {
        reportError: (error) => {
          errors.push(error);
        },
        triggerDestinationSync: () => {
          throw new Error("trigger failed");
        },
        withTransaction: async (transactionCallback) =>
          transactionCallback({
            acquireUserLock: async () => {},
            ensureDestinationSyncStatuses: async () => {},
            findOwnedDestinationIds: async () => ["dest-1"],
            replaceSourceMappings: async () => {},
            sourceExists: async () => true,
          }),
      }),
    ).resolves.toBeUndefined();

    expect(errors).toHaveLength(1);
  });
});

describe("runSetSourcesForDestination", () => {
  it("throws when destination calendar is not found", async () => {
    await expect(
      runSetSourcesForDestination("user-1", "dest-1", ["source-1"], {
        triggerDestinationSync: () => {},
        withTransaction: async (transactionCallback) =>
          transactionCallback({
            acquireUserLock: async () => {},
            destinationExists: async () => false,
            ensureDestinationSyncStatus: async () => {},
            findOwnedSourceIds: async () => ["source-1"],
            replaceDestinationMappings: async () => {},
          }),
      }),
    ).rejects.toThrow("Destination calendar not found");
  });

  it("throws when source calendars include invalid IDs", async () => {
    await expect(
      runSetSourcesForDestination("user-1", "dest-1", ["source-1", "source-2"], {
        triggerDestinationSync: () => {},
        withTransaction: async (transactionCallback) =>
          transactionCallback({
            acquireUserLock: async () => {},
            destinationExists: async () => true,
            ensureDestinationSyncStatus: async () => {},
            findOwnedSourceIds: async () => ["source-1"],
            replaceDestinationMappings: async () => {},
          }),
      }),
    ).rejects.toThrow("Some source calendars not found");
  });

  it("replaces mappings and triggers sync without status upsert for empty sources", async () => {
    const operationLog: string[] = [];

    await runSetSourcesForDestination("user-1", "dest-1", [], {
      triggerDestinationSync: (userId) => {
        operationLog.push(`trigger:${userId}`);
      },
      withTransaction: async (transactionCallback) =>
        transactionCallback({
          acquireUserLock: async (userId) => {
            operationLog.push(`lock:${userId}`);
          },
          destinationExists: async () => true,
          ensureDestinationSyncStatus: async () => {
            operationLog.push("status");
          },
          findOwnedSourceIds: async () => [],
          replaceDestinationMappings: async (_destinationCalendarId, sourceCalendarIds) => {
            operationLog.push(`replace:${sourceCalendarIds.length}`);
          },
        }),
    });

    expect(operationLog).toEqual([
      "lock:user-1",
      "replace:0",
      "trigger:user-1",
    ]);
  });

  it("upserts destination sync status when assigning non-empty sources", async () => {
    const operationLog: string[] = [];

    await runSetSourcesForDestination("user-1", "dest-1", ["source-1"], {
      triggerDestinationSync: (userId) => {
        operationLog.push(`trigger:${userId}`);
      },
      withTransaction: async (transactionCallback) =>
        transactionCallback({
          acquireUserLock: async () => {},
          destinationExists: async () => true,
          ensureDestinationSyncStatus: async (destinationCalendarId) => {
            operationLog.push(`status:${destinationCalendarId}`);
          },
          findOwnedSourceIds: async () => ["source-1"],
          replaceDestinationMappings: async (_destinationCalendarId, sourceCalendarIds) => {
            operationLog.push(`replace:${sourceCalendarIds.join(",")}`);
          },
        }),
    });

    expect(operationLog).toEqual([
      "replace:source-1",
      "status:dest-1",
      "trigger:user-1",
    ]);
  });

  it("does not fail the request when destination sync trigger throws", async () => {
    const errors: unknown[] = [];

    await expect(
      runSetSourcesForDestination("user-1", "dest-1", ["source-1"], {
        reportError: (error) => {
          errors.push(error);
        },
        triggerDestinationSync: () => {
          throw new Error("trigger failed");
        },
        withTransaction: async (transactionCallback) =>
          transactionCallback({
            acquireUserLock: async () => {},
            destinationExists: async () => true,
            ensureDestinationSyncStatus: async () => {},
            findOwnedSourceIds: async () => ["source-1"],
            replaceDestinationMappings: async () => {},
          }),
      }),
    ).resolves.toBeUndefined();

    expect(errors).toHaveLength(1);
  });
});
