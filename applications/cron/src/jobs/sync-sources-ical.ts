import type { CronOptions } from "cronbake";
import { calendarSnapshotsTable, calendarsTable } from "@keeper.sh/database/schema";
import { MS_PER_HOUR } from "@keeper.sh/constants";
import { pullRemoteCalendar } from "@keeper.sh/calendar";
import { WideEvent } from "@keeper.sh/log";
import { and, desc, eq, lte } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import { setCronEventFields, withCronWideEvent } from "../utils/with-wide-event";
import { countSettledResults } from "../utils/count-settled-results";

const ICAL_CALENDAR_TYPE = "ical";

interface RemoteIcalSource {
  id: string;
  url: string | null;
}

interface FetchResult {
  ical: string;
  calendarId: string;
}

const fetchRemoteCalendar = async (calendarId: string, url: string): Promise<FetchResult> => {
  const { ical } = await pullRemoteCalendar("ical", url);
  return { ical, calendarId };
};

const insertSnapshot = async (
  database: BunSQLDatabase,
  payload: typeof calendarSnapshotsTable.$inferInsert,
): Promise<{ createdAt: Date } | undefined> => {
  const [record] = await database.insert(calendarSnapshotsTable).values(payload).returning({
    createdAt: calendarSnapshotsTable.createdAt,
  });

  return record;
};

const SNAPSHOT_RETENTION_HOURS = 6;
const SNAPSHOT_RETENTION_MS = SNAPSHOT_RETENTION_HOURS * MS_PER_HOUR;

const deleteStaleCalendarSnapshots = async (
  database: BunSQLDatabase,
  calendarId: string,
  referenceDate: Date,
): Promise<void> => {
  const staleThreshold = referenceDate.getTime() - SNAPSHOT_RETENTION_MS;

  await database
    .delete(calendarSnapshotsTable)
    .where(
      and(
        eq(calendarSnapshotsTable.calendarId, calendarId),
        lte(calendarSnapshotsTable.createdAt, new Date(staleThreshold)),
      ),
    );
};

const computeContentHash = (content: string): string => Bun.hash(content).toString();

interface SnapshotResult {
  skipped: boolean;
  error: boolean;
}

const processSnapshot = async (
  database: BunSQLDatabase,
  calendarId: string,
  ical: string,
): Promise<SnapshotResult> => {
  try {
    const contentHash = computeContentHash(ical);
    const [latest] = await database
      .select({ contentHash: calendarSnapshotsTable.contentHash })
      .from(calendarSnapshotsTable)
      .where(eq(calendarSnapshotsTable.calendarId, calendarId))
      .orderBy(desc(calendarSnapshotsTable.createdAt))
      .limit(1);
    const latestHash = latest?.contentHash ?? null;

    if (latestHash === contentHash) {
      return { error: false, skipped: true };
    }

    const record = await insertSnapshot(database, { contentHash, ical, calendarId });
    if (record) {
      await deleteStaleCalendarSnapshots(database, calendarId, record.createdAt);
    }
    return { error: false, skipped: false };
  } catch (error) {
    WideEvent.error(error);
    return { error: true, skipped: false };
  }
};

interface IcalSnapshotJobDependencies {
  getRemoteSources: () => Promise<RemoteIcalSource[]>;
  fetchRemoteCalendar: (calendarId: string, url: string) => Promise<FetchResult>;
  processSnapshot: (calendarId: string, ical: string) => Promise<SnapshotResult>;
  setCronEventFields: (fields: Record<string, unknown>) => void;
  reportError?: (error: unknown) => void;
}

interface IcalSnapshotJobHooks {
  startTiming?: (name: string) => void;
  endTiming?: (name: string) => void;
}

const createMissingUrlError = (calendarId: string): Error =>
  new Error(`Source ${calendarId} is missing url`);

const createDefaultJobDependencies = async (): Promise<IcalSnapshotJobDependencies> => {
  const { database } = await import("../context");

  return {
    fetchRemoteCalendar,
    getRemoteSources: async () => {
      const sources = await database
        .select({ id: calendarsTable.id, url: calendarsTable.url })
        .from(calendarsTable)
        .where(eq(calendarsTable.calendarType, ICAL_CALENDAR_TYPE));
      return sources;
    },
    processSnapshot: (calendarId, ical) => processSnapshot(database, calendarId, ical),
    reportError: (error) => {
      WideEvent.error(error);
    },
    setCronEventFields,
  };
};

const buildFetchPromises = (
  remoteSources: RemoteIcalSource[],
  dependencies: IcalSnapshotJobDependencies,
): Promise<FetchResult>[] =>
  remoteSources.map(({ id, url }) => {
    if (!url) {
      return Promise.reject(createMissingUrlError(id));
    }
    return Promise.resolve().then(() => dependencies.fetchRemoteCalendar(id, url));
  });

const runIcalSnapshotSyncJob = async (
  dependencies: IcalSnapshotJobDependencies,
  hooks: IcalSnapshotJobHooks = {},
): Promise<void> => {
  hooks.startTiming?.("fetchSources");
  const remoteSources = await dependencies.getRemoteSources();
  dependencies.setCronEventFields({ "source.count": remoteSources.length });

  const settlements = await Promise.allSettled(buildFetchPromises(remoteSources, dependencies));
  hooks.endTiming?.("fetchSources");

  const { succeeded: fetchSucceeded, failed: fetchFailed } = countSettledResults(settlements);
  dependencies.setCronEventFields({
    "fetch.failed.count": fetchFailed,
    "fetch.succeeded.count": fetchSucceeded,
  });

  for (const settlement of settlements) {
    if (settlement.status === "rejected") {
      dependencies.reportError?.(settlement.reason);
    }
  }

  hooks.startTiming?.("processSnapshots");
  const insertionPromises: Promise<SnapshotResult>[] = [];
  for (const settlement of settlements) {
    if (settlement.status === "fulfilled") {
      insertionPromises.push(
        Promise.resolve().then(() =>
          dependencies.processSnapshot(settlement.value.calendarId, settlement.value.ical)),
      );
    }
  }

  const insertionSettlements = await Promise.allSettled(insertionPromises);
  hooks.endTiming?.("processSnapshots");

  let skippedCount = 0;
  let insertErrorCount = 0;
  let insertedCount = 0;

  for (const insertionSettlement of insertionSettlements) {
    if (insertionSettlement.status === "rejected") {
      insertErrorCount += 1;
      dependencies.reportError?.(insertionSettlement.reason);
      continue;
    }

    if (insertionSettlement.value.error) {
      insertErrorCount += 1;
      continue;
    }

    if (insertionSettlement.value.skipped) {
      skippedCount += 1;
      continue;
    }

    insertedCount += 1;
  }

  dependencies.setCronEventFields({
    "insert.error.count": insertErrorCount,
    "insert.count": insertedCount,
    "skipped.count": skippedCount,
  });
};

export default withCronWideEvent({
  async callback() {
    const event = WideEvent.grasp();
    const dependencies = await createDefaultJobDependencies();
    await runIcalSnapshotSyncJob(dependencies, {
      endTiming: (name) => {
        event?.endTiming(name);
      },
      startTiming: (name) => {
        event?.startTiming(name);
      },
    });
  },
  cron: "@every_1_minutes",
  immediate: true,
  name: import.meta.file,
}) satisfies CronOptions;

export { runIcalSnapshotSyncJob };
