import {
  caldavCredentialsTable,
  calendarAccountsTable,
  calendarsTable,
  sourceDestinationMappingsTable,
} from "@keeper.sh/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { encryptPassword } from "@keeper.sh/encryption";
import { database, premiumService, encryptionKey } from "../context";

const FIRST_RESULT_LIMIT = 1;
const CALDAV_CALENDAR_TYPE = "caldav";

class CalDAVSourceLimitError extends Error {
  constructor() {
    super("Source limit reached. Upgrade to Pro for unlimited sources.");
  }
}

class CalDAVSourceNotFoundError extends Error {
  constructor() {
    super("CalDAV source not found or not owned by user");
  }
}

class DuplicateCalDAVSourceError extends Error {
  constructor() {
    super("This calendar is already added as a source");
  }
}

interface CalDAVSource {
  id: string;
  userId: string;
  name: string;
  provider: string;
  calendarUrl: string;
  serverUrl: string;
  username: string;
  createdAt: Date;
}

interface CreateCalDAVSourceData {
  calendarUrl: string;
  name: string;
  password: string;
  provider: string;
  serverUrl: string;
  username: string;
}

const getUserCalDAVSources = async (userId: string, provider?: string): Promise<CalDAVSource[]> => {
  const conditions = [
    eq(calendarsTable.userId, userId),
    eq(calendarsTable.calendarType, CALDAV_CALENDAR_TYPE),
    inArray(calendarsTable.id,
      database.selectDistinct({ id: sourceDestinationMappingsTable.sourceCalendarId })
        .from(sourceDestinationMappingsTable)
    ),
  ];

  if (provider) {
    conditions.push(eq(calendarAccountsTable.provider, provider));
  }

  const sources = await database
    .select({
      calendarUrl: calendarsTable.calendarUrl,
      createdAt: calendarsTable.createdAt,
      id: calendarsTable.id,
      name: calendarsTable.name,
      provider: calendarAccountsTable.provider,
      serverUrl: caldavCredentialsTable.serverUrl,
      userId: calendarsTable.userId,
      username: caldavCredentialsTable.username,
    })
    .from(calendarsTable)
    .innerJoin(calendarAccountsTable, eq(calendarsTable.accountId, calendarAccountsTable.id))
    .innerJoin(
      caldavCredentialsTable,
      eq(calendarAccountsTable.caldavCredentialId, caldavCredentialsTable.id),
    )
    .where(and(...conditions));

  return sources.map((source) => {
    if (!source.calendarUrl) {
      throw new Error(`CalDAV source ${source.id} is missing calendarUrl`);
    }
    return {
      ...source,
      calendarUrl: source.calendarUrl,
      provider: source.provider,
    };
  });
};

const countUserSources = async (userId: string): Promise<number> => {
  const sources = await database
    .select({ id: calendarsTable.id })
    .from(calendarsTable)
    .where(
      and(
        eq(calendarsTable.userId, userId),
        inArray(calendarsTable.id,
      database.selectDistinct({ id: sourceDestinationMappingsTable.sourceCalendarId })
        .from(sourceDestinationMappingsTable)
    ),
      ),
    );

  return sources.length;
};

const createCalDAVSource = async (
  userId: string,
  data: CreateCalDAVSourceData,
): Promise<CalDAVSource> => {
  const existingSourceCount = await countUserSources(userId);
  const allowed = await premiumService.canAddSource(userId, existingSourceCount);

  if (!allowed) {
    throw new CalDAVSourceLimitError();
  }

  const [existingSource] = await database
    .select({ id: calendarsTable.id })
    .from(calendarsTable)
    .where(
      and(
        eq(calendarsTable.userId, userId),
        eq(calendarsTable.calendarUrl, data.calendarUrl),
        eq(calendarsTable.calendarType, CALDAV_CALENDAR_TYPE),
      ),
    )
    .limit(FIRST_RESULT_LIMIT);

  if (existingSource) {
    throw new DuplicateCalDAVSourceError();
  }

  if (!encryptionKey) {
    throw new Error("Encryption key not configured");
  }

  // Reuse existing account for same user/provider/server, or create new one
  const [existingAccount] = await database
    .select({
      id: calendarAccountsTable.id,
      caldavCredentialId: calendarAccountsTable.caldavCredentialId,
    })
    .from(calendarAccountsTable)
    .innerJoin(
      caldavCredentialsTable,
      eq(calendarAccountsTable.caldavCredentialId, caldavCredentialsTable.id),
    )
    .where(
      and(
        eq(calendarAccountsTable.userId, userId),
        eq(calendarAccountsTable.provider, data.provider),
        eq(caldavCredentialsTable.serverUrl, data.serverUrl),
        eq(caldavCredentialsTable.username, data.username),
      ),
    )
    .limit(1);

  let accountId: string;

  if (existingAccount) {
    accountId = existingAccount.id;
  } else {
    const encryptedPassword = encryptPassword(data.password, encryptionKey);

    const [credential] = await database
      .insert(caldavCredentialsTable)
      .values({
        encryptedPassword,
        serverUrl: data.serverUrl,
        username: data.username,
      })
      .returning({ id: caldavCredentialsTable.id });

    if (!credential) {
      throw new Error("Failed to create CalDAV source credential");
    }

    const [account] = await database
      .insert(calendarAccountsTable)
      .values({
        authType: "caldav",
        caldavCredentialId: credential.id,
        displayName: data.username,
        provider: data.provider,
        userId,
      })
      .returning({ id: calendarAccountsTable.id });

    if (!account) {
      throw new Error("Failed to create calendar account");
    }

    accountId = account.id;
  }

  const [source] = await database
    .insert(calendarsTable)
    .values({
      accountId,
      calendarType: CALDAV_CALENDAR_TYPE,
      capabilities: ["pull", "push"],
      calendarUrl: data.calendarUrl,
      name: data.name,
      userId,
    })
    .returning();

  if (!source) {
    throw new Error("Failed to create CalDAV source");
  }

  return {
    calendarUrl: data.calendarUrl,
    createdAt: source.createdAt,
    id: source.id,
    name: source.name,
    provider: data.provider,
    serverUrl: data.serverUrl,
    userId: source.userId,
    username: data.username,
  };
};

const deleteCalDAVSource = async (userId: string, calendarId: string): Promise<boolean> => {
  const [calendar] = await database
    .select({
      accountId: calendarsTable.accountId,
    })
    .from(calendarsTable)
    .where(
      and(
        eq(calendarsTable.id, calendarId),
        eq(calendarsTable.userId, userId),
        eq(calendarsTable.calendarType, CALDAV_CALENDAR_TYPE),
      ),
    )
    .limit(FIRST_RESULT_LIMIT);

  if (!calendar) {
    throw new CalDAVSourceNotFoundError();
  }

  await database.delete(calendarsTable).where(eq(calendarsTable.id, calendarId));

  // Cascade will handle credential cleanup through calendar_accounts

  return true;
};

const verifyCalDAVSourceOwnership = async (userId: string, calendarId: string): Promise<boolean> => {
  const [source] = await database
    .select({ id: calendarsTable.id })
    .from(calendarsTable)
    .where(
      and(
        eq(calendarsTable.id, calendarId),
        eq(calendarsTable.userId, userId),
        eq(calendarsTable.calendarType, CALDAV_CALENDAR_TYPE),
      ),
    )
    .limit(FIRST_RESULT_LIMIT);

  return Boolean(source);
};

export {
  CalDAVSourceLimitError,
  CalDAVSourceNotFoundError,
  DuplicateCalDAVSourceError,
  getUserCalDAVSources,
  createCalDAVSource,
  deleteCalDAVSource,
  verifyCalDAVSourceOwnership,
};
