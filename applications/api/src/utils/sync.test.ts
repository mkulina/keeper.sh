import { describe, expect, it } from "bun:test";
import { runDestinationSyncTrigger } from "./sync";

describe("runDestinationSyncTrigger", () => {
  it("spawns background destination sync with mapped result fields", async () => {
    const spawnedJobs: { name: string; userId: unknown }[] = [];
    let capturedCallback: (() => Promise<Record<string, number>>) | undefined;

    runDestinationSyncTrigger("user-1", {
      spawnBackgroundJob: (name, fields, callback) => {
        spawnedJobs.push({ name, userId: fields.userId });
        capturedCallback = callback;
      },
      syncDestinationsForUser: async () => ({
        addFailed: 2,
        added: 7,
        removeFailed: 1,
        removed: 3,
      }),
    });

    expect(spawnedJobs).toEqual([{ name: "destination-sync", userId: "user-1" }]);

    if (!capturedCallback) {
      throw new Error("Expected background callback");
    }

    const backgroundResult = await capturedCallback();
    expect(backgroundResult).toEqual({
      eventsAddFailed: 2,
      eventsAdded: 7,
      eventsRemoveFailed: 1,
      eventsRemoved: 3,
    });
  });

  it("surfaces sync failures through the background callback", async () => {
    let capturedCallback: (() => Promise<Record<string, number>>) | undefined;
    const expectedError = new Error("sync failed");

    runDestinationSyncTrigger("user-2", {
      spawnBackgroundJob: (_name, _fields, callback) => {
        capturedCallback = callback;
      },
      syncDestinationsForUser: async () => {
        throw expectedError;
      },
    });

    if (!capturedCallback) {
      throw new Error("Expected background callback");
    }

    await expect(capturedCallback()).rejects.toBe(expectedError);
  });

  it("passes the same userId through to destination sync execution", async () => {
    const receivedUserIds: string[] = [];
    let capturedCallback: (() => Promise<Record<string, number>>) | undefined;

    runDestinationSyncTrigger("user-3", {
      spawnBackgroundJob: (_name, _fields, callback) => {
        capturedCallback = callback;
      },
      syncDestinationsForUser: async (userId) => {
        receivedUserIds.push(userId);
        return {
          addFailed: 0,
          added: 1,
          removeFailed: 0,
          removed: 1,
        };
      },
    });

    if (!capturedCallback) {
      throw new Error("Expected background callback");
    }

    await capturedCallback();
    expect(receivedUserIds).toEqual(["user-3"]);
  });
});
