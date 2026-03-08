import type { CronOptions } from "cronbake";
import type { Plan } from "@keeper.sh/premium";
import { syncDestinationsForUser as syncDestinationsForUserAcrossCalendars } from "@keeper.sh/provider-core";
import type { SyncResult } from "@keeper.sh/provider-core";
import { fetchAndSyncSource } from "@keeper.sh/calendar";
import type { Source } from "@keeper.sh/calendar";
import { setCronEventFields, withCronWideEvent } from "./with-wide-event";

interface SourceOwner {
  userId: string;
}

interface SyncUserSourcesDependencies<TSource> {
  fetchAndSyncSourceForCalendar: (source: TSource) => Promise<void>;
  syncDestinationsForUser: (userId: string) => Promise<SyncResult>;
}

const createSyncUserSourcesDependencies = (): SyncUserSourcesDependencies<Source> => ({
  fetchAndSyncSourceForCalendar: async (source) => {
    const { database } = await import("../context");
    await fetchAndSyncSource(database, source);
  },
  syncDestinationsForUser: async (userId) => {
    const { destinationProviders, syncCoordinator } = await import("../context");
    return syncDestinationsForUserAcrossCalendars(
      userId,
      destinationProviders,
      syncCoordinator,
    );
  },
});

const syncUserSources = async <TSource>(
  userId: string,
  sources: TSource[],
  dependencies: SyncUserSourcesDependencies<TSource>,
): Promise<SyncResult> => {
  await Promise.allSettled(
    sources.map((source) => dependencies.fetchAndSyncSourceForCalendar(source)),
  );
  return dependencies.syncDestinationsForUser(userId);
};

const groupSourcesByUser = <TSource extends SourceOwner>(sources: TSource[]): Map<string, TSource[]> => {
  const sourcesByUser = new Map<string, TSource[]>();
  for (const source of sources) {
    const userSources = sourcesByUser.get(source.userId) ?? [];
    userSources.push(source);
    sourcesByUser.set(source.userId, userSources);
  }
  return sourcesByUser;
};

const ensureUsersWithDestinationsIncluded = <TSource extends SourceOwner>(
  sourcesByUser: Map<string, TSource[]>,
  usersWithDestinations: string[],
): void => {
  for (const userId of usersWithDestinations) {
    if (!sourcesByUser.has(userId)) {
      sourcesByUser.set(userId, []);
    }
  }
};

const INITIAL_ADDED_COUNT = 0;
const INITIAL_ADD_FAILED_COUNT = 0;
const INITIAL_REMOVED_COUNT = 0;
const INITIAL_REMOVE_FAILED_COUNT = 0;

interface SyncJobDependencies<TSource extends SourceOwner> {
  getSourcesByPlan: (plan: Plan) => Promise<TSource[]>;
  getUsersWithDestinationsByPlan: (plan: Plan) => Promise<string[]>;
  setCronEventFields: (fields: Record<string, unknown>) => void;
  syncUserSourcesForUser: (userId: string, sources: TSource[]) => Promise<SyncResult>;
}

const runSyncJob = async <TSource extends SourceOwner>(
  plan: Plan,
  dependencies: SyncJobDependencies<TSource>,
): Promise<void> => {
  const sources = await dependencies.getSourcesByPlan(plan);
  const usersWithDestinations = await dependencies.getUsersWithDestinationsByPlan(plan);

  dependencies.setCronEventFields({
    "processed.count": usersWithDestinations.length,
    "source.count": sources.length,
    "subscription.plan": plan,
  });

  const sourcesByUser = groupSourcesByUser(sources);
  ensureUsersWithDestinationsIncluded(sourcesByUser, usersWithDestinations);

  const userSyncs = [...sourcesByUser.entries()].map(([userId, userSources]) =>
    dependencies.syncUserSourcesForUser(userId, userSources),
  );

  const settledResults = await Promise.allSettled(userSyncs);
  const userFailedCount = settledResults.filter(
    (result) => result.status === "rejected",
  ).length;

  const totals: SyncResult = {
    addFailed: INITIAL_ADD_FAILED_COUNT,
    added: INITIAL_ADDED_COUNT,
    removeFailed: INITIAL_REMOVE_FAILED_COUNT,
    removed: INITIAL_REMOVED_COUNT,
  };

  for (const settled of settledResults) {
    if (settled.status !== "fulfilled") {
      continue;
    }
    totals.added += settled.value.added;
    totals.addFailed += settled.value.addFailed;
    totals.removed += settled.value.removed;
    totals.removeFailed += settled.value.removeFailed;
  }

  dependencies.setCronEventFields({
    "events.added": totals.added,
    "events.add_failed": totals.addFailed,
    "events.removed": totals.removed,
    "events.remove_failed": totals.removeFailed,
    "user.failed.count": userFailedCount,
  });
};

const createSyncJob = (plan: Plan, cron: string): CronOptions =>
  withCronWideEvent({
    async callback(): Promise<void> {
      const syncUserSourcesDependencies = createSyncUserSourcesDependencies();
      const { getSourcesByPlan, getUsersWithDestinationsByPlan } = await import("./get-sources");
      await runSyncJob(plan, {
        getSourcesByPlan,
        getUsersWithDestinationsByPlan,
        setCronEventFields,
        syncUserSourcesForUser: (userId, sources) =>
          syncUserSources(userId, sources, syncUserSourcesDependencies),
      });
    },
    cron,
    immediate: process.env.NODE_ENV !== "production",
    name: `sync-calendar-events-${plan}`,
  });

export { createSyncJob, runSyncJob, syncUserSources };
