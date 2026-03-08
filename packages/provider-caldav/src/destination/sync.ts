import {
  calendarAccountsTable,
  caldavCredentialsTable,
  calendarsTable,
  eventStatesTable,
  sourceDestinationMappingsTable,
} from "@keeper.sh/database/schema";
import { getStartOfToday } from "@keeper.sh/date-utils";
import { decryptPassword } from "@keeper.sh/encryption";
import { and, asc, eq, gte, inArray, or } from "drizzle-orm";
import type { SyncableEvent } from "@keeper.sh/provider-core";
import type { CalDAVAccount, CalDAVService, CalDAVServiceConfig } from "../types";

const buildProviderCondition = (filter?: string): ReturnType<typeof eq> | ReturnType<typeof or> => {
  if (filter) {
    return eq(calendarAccountsTable.provider, filter);
  }
  return or(
    eq(calendarAccountsTable.provider, "caldav"),
    eq(calendarAccountsTable.provider, "fastmail"),
    eq(calendarAccountsTable.provider, "icloud"),
  );
};

const createCalDAVService = (config: CalDAVServiceConfig): CalDAVService => {
  const { database, encryptionKey } = config;

  const getCalDAVAccountsForUser = async (
    userId: string,
    providerFilter?: string,
  ): Promise<CalDAVAccount[]> => {
    const providerCondition = buildProviderCondition(providerFilter);

    const results = await database
      .select({
        accountId: calendarAccountsTable.accountId,
        calendarId: calendarsTable.id,
        calendarUrl: calendarsTable.calendarUrl,
        email: calendarAccountsTable.email,
        encryptedPassword: caldavCredentialsTable.encryptedPassword,
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
      .where(
        and(
          providerCondition,
          eq(calendarsTable.userId, userId),
          inArray(calendarsTable.id,
            database.selectDistinct({ id: sourceDestinationMappingsTable.destinationCalendarId })
              .from(sourceDestinationMappingsTable)
          ),
        ),
      );

    return results.map((result) => ({
      ...result,
      calendarUrl: result.calendarUrl ?? "",
    }));
  };

  const getCalDAVAccountsByProvider = async (provider: string): Promise<CalDAVAccount[]> => {
    const results = await database
      .select({
        accountId: calendarAccountsTable.accountId,
        calendarId: calendarsTable.id,
        calendarUrl: calendarsTable.calendarUrl,
        email: calendarAccountsTable.email,
        encryptedPassword: caldavCredentialsTable.encryptedPassword,
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
      .where(
        and(
          eq(calendarAccountsTable.provider, provider),
          inArray(calendarsTable.id,
            database.selectDistinct({ id: sourceDestinationMappingsTable.destinationCalendarId })
              .from(sourceDestinationMappingsTable)
          ),
        ),
      );

    return results.map((result) => ({
      ...result,
      calendarUrl: result.calendarUrl ?? "",
    }));
  };

  const getDecryptedPassword = (encryptedPassword: string): string =>
    decryptPassword(encryptedPassword, encryptionKey);

  const getUserEvents = async (userId: string): Promise<SyncableEvent[]> => {
    const today = getStartOfToday();

    const results = await database
      .select({
        calendarId: eventStatesTable.calendarId,
        calendarName: calendarsTable.name,
        calendarUrl: calendarsTable.url,
        endTime: eventStatesTable.endTime,
        id: eventStatesTable.id,
        sourceEventUid: eventStatesTable.sourceEventUid,
        startTime: eventStatesTable.startTime,
      })
      .from(eventStatesTable)
      .innerJoin(calendarsTable, eq(eventStatesTable.calendarId, calendarsTable.id))
      .where(and(eq(calendarsTable.userId, userId), gte(eventStatesTable.startTime, today)))
      .orderBy(asc(eventStatesTable.startTime));

    const events: SyncableEvent[] = [];

    for (const result of results) {
      if (result.sourceEventUid === null) {
        continue;
      }

      const summary = result.calendarName ?? "Busy";
      events.push({
        calendarId: result.calendarId,
        calendarName: result.calendarName,
        calendarUrl: result.calendarUrl,
        endTime: result.endTime,
        id: result.id,
        sourceEventUid: result.sourceEventUid,
        startTime: result.startTime,
        summary,
      });
    }

    return events;
  };

  return {
    getCalDAVAccountsByProvider,
    getCalDAVAccountsForUser,
    getDecryptedPassword,
    getUserEvents,
  };
};

export { createCalDAVService };
