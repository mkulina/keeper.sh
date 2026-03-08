import {
  calendarsTable,
  sourceDestinationMappingsTable,
  syncStatusTable,
} from "@keeper.sh/database/schema";
import { WideEvent } from "@keeper.sh/log";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { database as databaseInstance } from "../context";
import { triggerDestinationSync } from "./sync";

const EMPTY_LIST_COUNT = 0;
const USER_MAPPING_LOCK_NAMESPACE = 9001;

type DatabaseClient = typeof databaseInstance;
type DatabaseTransactionCallback = Parameters<DatabaseClient["transaction"]>[0];
type DatabaseTransactionClient = Parameters<DatabaseTransactionCallback>[0];

interface SourceDestinationMapping {
  id: string;
  sourceCalendarId: string;
  destinationCalendarId: string;
  createdAt: Date;
  calendarType: string;
}

interface SetDestinationsTransaction {
  acquireUserLock: (userId: string) => Promise<void>;
  sourceExists: (userId: string, sourceCalendarId: string) => Promise<boolean>;
  findOwnedDestinationIds: (
    userId: string,
    destinationCalendarIds: string[],
  ) => Promise<string[]>;
  replaceSourceMappings: (
    sourceCalendarId: string,
    destinationCalendarIds: string[],
  ) => Promise<void>;
  ensureDestinationSyncStatuses: (destinationCalendarIds: string[]) => Promise<void>;
}

interface SetDestinationsDependencies {
  withTransaction: <TResult>(
    callback: (transaction: SetDestinationsTransaction) => Promise<TResult>,
  ) => Promise<TResult>;
  triggerDestinationSync: (userId: string) => void;
  reportError?: (error: unknown) => void;
}

interface SetSourcesTransaction {
  acquireUserLock: (userId: string) => Promise<void>;
  destinationExists: (userId: string, destinationCalendarId: string) => Promise<boolean>;
  findOwnedSourceIds: (userId: string, sourceCalendarIds: string[]) => Promise<string[]>;
  replaceDestinationMappings: (
    destinationCalendarId: string,
    sourceCalendarIds: string[],
  ) => Promise<void>;
  ensureDestinationSyncStatus: (destinationCalendarId: string) => Promise<void>;
}

interface SetSourcesDependencies {
  withTransaction: <TResult>(
    callback: (transaction: SetSourcesTransaction) => Promise<TResult>,
  ) => Promise<TResult>;
  triggerDestinationSync: (userId: string) => void;
  reportError?: (error: unknown) => void;
}

const assertAllIdsOwned = (
  requestedIds: string[],
  validIds: string[],
  errorMessage: string,
): void => {
  const validIdSet = new Set(validIds);
  const invalidIds = requestedIds.filter((requestedId) => !validIdSet.has(requestedId));
  if (invalidIds.length > EMPTY_LIST_COUNT) {
    throw new Error(errorMessage);
  }
};

const createSetDestinationsTransaction = (
  transactionClient: DatabaseTransactionClient,
): SetDestinationsTransaction => ({
  acquireUserLock: async (userId) => {
    await transactionClient.execute(
      sql`select pg_advisory_xact_lock(${USER_MAPPING_LOCK_NAMESPACE}, hashtext(${userId}))`,
    );
  },
  sourceExists: async (userId, sourceCalendarId) => {
    const [source] = await transactionClient
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(
        and(
          eq(calendarsTable.id, sourceCalendarId),
          eq(calendarsTable.userId, userId),
        ),
      )
      .limit(1);

    return Boolean(source);
  },
  findOwnedDestinationIds: async (userId, destinationCalendarIds) => {
    if (destinationCalendarIds.length === EMPTY_LIST_COUNT) {
      return [];
    }

    const ownedDestinations = await transactionClient
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(
        and(
          eq(calendarsTable.userId, userId),
          inArray(calendarsTable.id, destinationCalendarIds),
        ),
      );

    return ownedDestinations.map(({ id }) => id);
  },
  replaceSourceMappings: async (sourceCalendarId, destinationCalendarIds) => {
    await transactionClient
      .delete(sourceDestinationMappingsTable)
      .where(eq(sourceDestinationMappingsTable.sourceCalendarId, sourceCalendarId));

    if (destinationCalendarIds.length === EMPTY_LIST_COUNT) {
      return;
    }

    await transactionClient
      .insert(sourceDestinationMappingsTable)
      .values(
        destinationCalendarIds.map((destinationCalendarId) => ({
          destinationCalendarId,
          sourceCalendarId,
        })),
      )
      .onConflictDoNothing();
  },
  ensureDestinationSyncStatuses: async (destinationCalendarIds) => {
    for (const destinationCalendarId of destinationCalendarIds) {
      await transactionClient
        .insert(syncStatusTable)
        .values({ calendarId: destinationCalendarId })
        .onConflictDoNothing();
    }
  },
});

const createSetSourcesTransaction = (
  transactionClient: DatabaseTransactionClient,
): SetSourcesTransaction => ({
  acquireUserLock: async (userId) => {
    await transactionClient.execute(
      sql`select pg_advisory_xact_lock(${USER_MAPPING_LOCK_NAMESPACE}, hashtext(${userId}))`,
    );
  },
  destinationExists: async (userId, destinationCalendarId) => {
    const [destination] = await transactionClient
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(
        and(
          eq(calendarsTable.id, destinationCalendarId),
          eq(calendarsTable.userId, userId),
        ),
      )
      .limit(1);

    return Boolean(destination);
  },
  findOwnedSourceIds: async (userId, sourceCalendarIds) => {
    if (sourceCalendarIds.length === EMPTY_LIST_COUNT) {
      return [];
    }

    const ownedSources = await transactionClient
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(
        and(
          eq(calendarsTable.userId, userId),
          inArray(calendarsTable.id, sourceCalendarIds),
        ),
      );

    return ownedSources.map(({ id }) => id);
  },
  replaceDestinationMappings: async (destinationCalendarId, sourceCalendarIds) => {
    await transactionClient
      .delete(sourceDestinationMappingsTable)
      .where(
        eq(sourceDestinationMappingsTable.destinationCalendarId, destinationCalendarId),
      );

    if (sourceCalendarIds.length === EMPTY_LIST_COUNT) {
      return;
    }

    await transactionClient
      .insert(sourceDestinationMappingsTable)
      .values(
        sourceCalendarIds.map((sourceCalendarId) => ({
          sourceCalendarId,
          destinationCalendarId,
        })),
      )
      .onConflictDoNothing();
  },
  ensureDestinationSyncStatus: async (destinationCalendarId) => {
    await transactionClient
      .insert(syncStatusTable)
      .values({ calendarId: destinationCalendarId })
      .onConflictDoNothing();
  },
});

const createSetDestinationsDependencies = async (): Promise<SetDestinationsDependencies> => {
  const { database } = await import("../context");

  return {
    reportError: (error) => {
      WideEvent.error(error);
    },
    triggerDestinationSync,
    withTransaction: (callback) =>
      database.transaction((transactionClient) =>
        callback(createSetDestinationsTransaction(transactionClient))),
  };
};

const createSetSourcesDependencies = async (): Promise<SetSourcesDependencies> => {
  const { database } = await import("../context");

  return {
    reportError: (error) => {
      WideEvent.error(error);
    },
    triggerDestinationSync,
    withTransaction: (callback) =>
      database.transaction((transactionClient) =>
        callback(createSetSourcesTransaction(transactionClient))),
  };
};

const runSetDestinationsForSource = async (
  userId: string,
  sourceCalendarId: string,
  destinationCalendarIds: string[],
  dependencies: SetDestinationsDependencies,
): Promise<void> => {
  await dependencies.withTransaction(async (transaction) => {
    await transaction.acquireUserLock(userId);

    const sourceExists = await transaction.sourceExists(userId, sourceCalendarId);
    if (!sourceExists) {
      throw new Error("Source calendar not found");
    }

    if (destinationCalendarIds.length > EMPTY_LIST_COUNT) {
      const validDestinationIds = await transaction.findOwnedDestinationIds(
        userId,
        destinationCalendarIds,
      );
      assertAllIdsOwned(
        destinationCalendarIds,
        validDestinationIds,
        "Some destination calendars not found",
      );
    }

    await transaction.replaceSourceMappings(sourceCalendarId, destinationCalendarIds);

    if (destinationCalendarIds.length > EMPTY_LIST_COUNT) {
      await transaction.ensureDestinationSyncStatuses(destinationCalendarIds);
    }
  });

  try {
    dependencies.triggerDestinationSync(userId);
  } catch (error) {
    dependencies.reportError?.(error);
  }
};

const runSetSourcesForDestination = async (
  userId: string,
  destinationCalendarId: string,
  sourceCalendarIds: string[],
  dependencies: SetSourcesDependencies,
): Promise<void> => {
  await dependencies.withTransaction(async (transaction) => {
    await transaction.acquireUserLock(userId);

    const destinationExists = await transaction.destinationExists(
      userId,
      destinationCalendarId,
    );
    if (!destinationExists) {
      throw new Error("Destination calendar not found");
    }

    if (sourceCalendarIds.length > EMPTY_LIST_COUNT) {
      const validSourceIds = await transaction.findOwnedSourceIds(userId, sourceCalendarIds);
      assertAllIdsOwned(sourceCalendarIds, validSourceIds, "Some source calendars not found");
    }

    await transaction.replaceDestinationMappings(destinationCalendarId, sourceCalendarIds);

    if (sourceCalendarIds.length > EMPTY_LIST_COUNT) {
      await transaction.ensureDestinationSyncStatus(destinationCalendarId);
    }
  });

  try {
    dependencies.triggerDestinationSync(userId);
  } catch (error) {
    dependencies.reportError?.(error);
  }
};

const getUserMappings = async (userId: string): Promise<SourceDestinationMapping[]> => {
  const { database } = await import("../context");

  const userSourceCalendars = await database
    .select({
      calendarType: calendarsTable.calendarType,
      id: calendarsTable.id,
    })
    .from(calendarsTable)
    .where(
      and(
        eq(calendarsTable.userId, userId),
        inArray(
          calendarsTable.id,
          database
            .selectDistinct({ id: sourceDestinationMappingsTable.sourceCalendarId })
            .from(sourceDestinationMappingsTable),
        ),
      ),
    );

  if (userSourceCalendars.length === EMPTY_LIST_COUNT) {
    return [];
  }

  const calendarIds = userSourceCalendars.map((calendar) => calendar.id);
  const typeByCalendarId = new Map(
    userSourceCalendars.map((calendar) => [calendar.id, calendar.calendarType]),
  );

  const mappings = await database
    .select()
    .from(sourceDestinationMappingsTable)
    .where(inArray(sourceDestinationMappingsTable.sourceCalendarId, calendarIds));

  return mappings.map((mapping) => ({
    ...mapping,
    calendarType: typeByCalendarId.get(mapping.sourceCalendarId) ?? "unknown",
  }));
};

const getDestinationsForSource = async (sourceCalendarId: string): Promise<string[]> => {
  const { database } = await import("../context");

  const mappings = await database
    .select({ destinationCalendarId: sourceDestinationMappingsTable.destinationCalendarId })
    .from(sourceDestinationMappingsTable)
    .where(eq(sourceDestinationMappingsTable.sourceCalendarId, sourceCalendarId));

  return mappings.map((mapping) => mapping.destinationCalendarId);
};

const getSourcesForDestination = async (destinationCalendarId: string): Promise<string[]> => {
  const { database } = await import("../context");

  const mappings = await database
    .select({ sourceCalendarId: sourceDestinationMappingsTable.sourceCalendarId })
    .from(sourceDestinationMappingsTable)
    .where(eq(sourceDestinationMappingsTable.destinationCalendarId, destinationCalendarId));

  return mappings.map((mapping) => mapping.sourceCalendarId);
};

const setDestinationsForSource = async (
  userId: string,
  sourceCalendarId: string,
  destinationCalendarIds: string[],
): Promise<void> => {
  const dependencies = await createSetDestinationsDependencies();
  await runSetDestinationsForSource(
    userId,
    sourceCalendarId,
    destinationCalendarIds,
    dependencies,
  );
};

const setSourcesForDestination = async (
  userId: string,
  destinationCalendarId: string,
  sourceCalendarIds: string[],
): Promise<void> => {
  const dependencies = await createSetSourcesDependencies();
  await runSetSourcesForDestination(
    userId,
    destinationCalendarId,
    sourceCalendarIds,
    dependencies,
  );
};

export {
  getUserMappings,
  getDestinationsForSource,
  getSourcesForDestination,
  setDestinationsForSource,
  setSourcesForDestination,
  runSetDestinationsForSource,
  runSetSourcesForDestination,
};
