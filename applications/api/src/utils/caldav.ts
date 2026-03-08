import { calendarsTable, sourceDestinationMappingsTable } from "@keeper.sh/database/schema";
import { createCalDAVClient } from "@keeper.sh/provider-caldav";
import { encryptPassword } from "@keeper.sh/encryption";
import { isCalDAVProvider } from "@keeper.sh/provider-registry";
import type { CalDAVProviderId } from "@keeper.sh/provider-registry";
import { and, eq, inArray } from "drizzle-orm";
import { saveCalDAVDestination } from "./destinations";
import { triggerDestinationSync } from "./sync";
import { database, encryptionKey, premiumService } from "../context";

class DestinationLimitError extends Error {
  constructor() {
    super("Destination limit reached. Upgrade to Pro.");
  }
}

class CalDAVConnectionError extends Error {
  constructor(cause?: unknown) {
    super("Failed to connect. Check credentials and server URL.");
    this.cause = cause;
  }
}

interface CalDAVCredentials {
  username: string;
  password: string;
}

interface DiscoveredCalendar {
  url: string;
  displayName: string | undefined;
}

const isValidProvider = (provider: string): provider is CalDAVProviderId =>
  isCalDAVProvider(provider);

const discoverCalendars = async (
  serverUrl: string,
  credentials: CalDAVCredentials,
): Promise<DiscoveredCalendar[]> => {
  try {
    const client = createCalDAVClient({
      credentials,
      serverUrl,
    });

    const calendars = await client.discoverCalendars();

    return calendars.map((calendar) => ({
      displayName: calendar.displayName,
      url: calendar.url,
    }));
  } catch (error) {
    throw new CalDAVConnectionError(error);
  }
};

const validateCredentials = async (
  serverUrl: string,
  credentials: CalDAVCredentials,
): Promise<void> => {
  const client = createCalDAVClient({
    credentials,
    serverUrl,
  });

  await client.discoverCalendars();
};

const createCalDAVDestination = async (
  userId: string,
  provider: CalDAVProviderId,
  serverUrl: string,
  credentials: CalDAVCredentials,
  calendarUrl: string,
): Promise<void> => {
  const existingDestinations = await database
    .select({ id: calendarsTable.id })
    .from(calendarsTable)
    .where(
      and(
        eq(calendarsTable.userId, userId),
        inArray(calendarsTable.id,
          database.selectDistinct({ id: sourceDestinationMappingsTable.destinationCalendarId })
            .from(sourceDestinationMappingsTable)
        ),
      ),
    );

  const allowed = await premiumService.canAddDestination(userId, existingDestinations.length);
  if (!allowed) {
    throw new DestinationLimitError();
  }

  try {
    await validateCredentials(serverUrl, credentials);
  } catch (error) {
    throw new CalDAVConnectionError(error);
  }

  if (!encryptionKey) {
    throw new Error("ENCRYPTION_KEY must be set to use CalDAV destinations");
  }

  const encrypted = encryptPassword(credentials.password, encryptionKey);
  const serverHost = new URL(serverUrl).host;
  const accountId = `${credentials.username}@${serverHost}`;

  await saveCalDAVDestination(
    userId,
    provider,
    accountId,
    credentials.username,
    serverUrl,
    calendarUrl,
    credentials.username,
    encrypted,
  );

  triggerDestinationSync(userId);
};

export {
  DestinationLimitError,
  CalDAVConnectionError,
  isValidProvider,
  discoverCalendars,
  createCalDAVDestination,
};
