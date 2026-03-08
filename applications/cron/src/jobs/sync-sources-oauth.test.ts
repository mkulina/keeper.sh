import { describe, expect, it } from "bun:test";
import { runOAuthSourceSyncJob } from "./sync-sources-oauth";

describe("runOAuthSourceSyncJob", () => {
  it("publishes provider metrics for successful sync results", async () => {
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runOAuthSourceSyncJob({
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
      syncGoogleSources: async () => ({
        errorCount: 1,
        eventsAdded: 7,
        eventsRemoved: 2,
      }),
      syncOutlookSources: async () => ({
        errorCount: 0,
        eventsAdded: 4,
        eventsRemoved: 3,
      }),
    });

    expect(cronEventFieldSets).toEqual([
      {
        "google.error.count": 1,
        "google.events.added": 7,
        "google.events.removed": 2,
      },
      {
        "outlook.error.count": 0,
        "outlook.events.added": 4,
        "outlook.events.removed": 3,
      },
    ]);
  });

  it("continues when one provider fails unexpectedly", async () => {
    const cronEventFieldSets: Record<string, unknown>[] = [];
    const errors: unknown[] = [];

    await runOAuthSourceSyncJob({
      reportError: (error) => {
        errors.push(error);
      },
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
      syncGoogleSources: async () => {
        throw new Error("google failed");
      },
      syncOutlookSources: async () => ({
        errorCount: 2,
        eventsAdded: 1,
        eventsRemoved: 5,
      }),
    });

    expect(errors).toHaveLength(1);
    expect(cronEventFieldSets).toEqual([
      {
        "outlook.error.count": 2,
        "outlook.events.added": 1,
        "outlook.events.removed": 5,
      },
    ]);
  });

  it("skips metric emission for providers that return null", async () => {
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runOAuthSourceSyncJob({
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
      syncGoogleSources: async () => null,
      syncOutlookSources: async () => ({
        errorCount: 0,
        eventsAdded: 2,
        eventsRemoved: 2,
      }),
    });

    expect(cronEventFieldSets).toEqual([
      {
        "outlook.error.count": 0,
        "outlook.events.added": 2,
        "outlook.events.removed": 2,
      },
    ]);
  });

  it("reports each provider rejection when both providers throw", async () => {
    const errors: unknown[] = [];

    await runOAuthSourceSyncJob({
      reportError: (error) => {
        errors.push(error);
      },
      setCronEventFields: () => {},
      syncGoogleSources: async () => {
        throw new Error("google crashed");
      },
      syncOutlookSources: async () => {
        throw new Error("outlook crashed");
      },
    });

    expect(errors).toHaveLength(2);
  });
});
