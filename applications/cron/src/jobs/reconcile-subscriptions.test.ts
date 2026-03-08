import { describe, expect, it } from "bun:test";
import { runReconcileSubscriptionsJob } from "./reconcile-subscriptions";

describe("runReconcileSubscriptionsJob", () => {
  it("reports zero processed users when Polar client is unavailable", async () => {
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runReconcileSubscriptionsJob({
      hasBillingClient: false,
      reconcileUserSubscription: async () => {},
      selectUserIds: async () => ["user-1", "user-2"],
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
    });

    expect(cronEventFieldSets).toEqual([{ "processed.count": 0 }]);
  });

  it("tracks failed reconciliations without stopping the full cycle", async () => {
    const reconciledUserIds: string[] = [];
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runReconcileSubscriptionsJob({
      hasBillingClient: true,
      reconcileUserSubscription: async (userId) => {
        reconciledUserIds.push(userId);
        if (userId === "user-2") {
          throw new Error("reconciliation failed");
        }
      },
      selectUserIds: async () => ["user-1", "user-2", "user-3"],
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
    });

    expect(reconciledUserIds).toEqual(["user-1", "user-2", "user-3"]);
    expect(cronEventFieldSets).toEqual([
      { "processed.count": 3 },
      { "failed.count": 1 },
    ]);
  });

  it("reports each reconciliation rejection when multiple users fail", async () => {
    const errors: unknown[] = [];
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runReconcileSubscriptionsJob({
      hasBillingClient: true,
      reconcileUserSubscription: async () => {
        throw new Error("reconcile failed");
      },
      reportError: (error) => {
        errors.push(error);
      },
      selectUserIds: async () => ["user-1", "user-2"],
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
    });

    expect(errors).toHaveLength(2);
    expect(cronEventFieldSets).toEqual([
      { "processed.count": 2 },
      { "failed.count": 2 },
    ]);
  });

  it("reports zero failed count when there are no users to reconcile", async () => {
    const cronEventFieldSets: Record<string, unknown>[] = [];

    await runReconcileSubscriptionsJob({
      hasBillingClient: true,
      reconcileUserSubscription: async () => {},
      selectUserIds: async () => [],
      setCronEventFields: (fields) => {
        cronEventFieldSets.push(fields);
      },
    });

    expect(cronEventFieldSets).toEqual([
      { "processed.count": 0 },
      { "failed.count": 0 },
    ]);
  });
});
