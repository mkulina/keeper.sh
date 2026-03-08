import {
  calendarsTable,
  eventStatesTable,
  sourceDestinationMappingsTable,
} from "@keeper.sh/database/schema";
import { getStartOfToday } from "@keeper.sh/date-utils";
import { and, asc, eq, gte, inArray, isNotNull, or } from "drizzle-orm";
import type { BunSQLDatabase } from "drizzle-orm/bun-sql";
import type { SyncableEvent } from "../types";
import {
  hasActiveFutureOccurrence,
  parseExceptionDatesFromJson,
  parseRecurrenceRuleFromJson,
} from "./recurrence";

const EMPTY_SOURCES_COUNT = 0;
const TEMPLATE_TOKEN_PATTERN = /\{\{(\w+)\}\}/g;
const DEFAULT_EVENT_NAME = "Busy";
const DEFAULT_EVENT_NAME_TEMPLATE = "{{calendar_name}}";

const getMappedSourceCalendarIds = async (
  database: BunSQLDatabase,
  destinationCalendarId: string,
): Promise<string[]> => {
  const mappings = await database
    .select({ sourceCalendarId: sourceDestinationMappingsTable.sourceCalendarId })
    .from(sourceDestinationMappingsTable)
    .where(eq(sourceDestinationMappingsTable.destinationCalendarId, destinationCalendarId));

  return mappings.map((mapping) => mapping.sourceCalendarId);
};

const fetchEventsForCalendars = async (
  database: BunSQLDatabase,
  calendarIds: string[],
): Promise<SyncableEvent[]> => {
  if (calendarIds.length === EMPTY_SOURCES_COUNT) {
    return [];
  }

  const startOfToday = getStartOfToday();

  const results = await database
    .select({
      calendarId: eventStatesTable.calendarId,
      calendarName: calendarsTable.name,
      calendarUrl: calendarsTable.url,
      customEventName: calendarsTable.customEventName,
      excludeEventDescription: calendarsTable.excludeEventDescription,
      excludeEventLocation: calendarsTable.excludeEventLocation,
      excludeEventName: calendarsTable.excludeEventName,
      description: eventStatesTable.description,
      endTime: eventStatesTable.endTime,
      exceptionDates: eventStatesTable.exceptionDates,
      id: eventStatesTable.id,
      location: eventStatesTable.location,
      recurrenceRule: eventStatesTable.recurrenceRule,
      sourceEventUid: eventStatesTable.sourceEventUid,
      startTime: eventStatesTable.startTime,
      startTimeZone: eventStatesTable.startTimeZone,
      title: eventStatesTable.title,
    })
    .from(eventStatesTable)
    .innerJoin(calendarsTable, eq(eventStatesTable.calendarId, calendarsTable.id))
    .where(
      and(
        inArray(eventStatesTable.calendarId, calendarIds),
        or(
          gte(eventStatesTable.startTime, startOfToday),
          isNotNull(eventStatesTable.recurrenceRule),
        ),
      ),
    )
    .orderBy(asc(eventStatesTable.startTime));

  const syncableEvents: SyncableEvent[] = [];

  for (const result of results) {
    if (result.sourceEventUid === null) {
      continue;
    }

    const parsedRecurrenceRule = parseRecurrenceRuleFromJson(result.recurrenceRule);
    const parsedExceptionDates = parseExceptionDatesFromJson(result.exceptionDates);

    if (
      result.startTime < startOfToday
      && !hasActiveFutureOccurrence(
        result.startTime,
        parsedRecurrenceRule,
        parsedExceptionDates,
        startOfToday,
      )
    ) {
      continue;
    }

    const eventName = result.title ?? DEFAULT_EVENT_NAME;
    const calendarName = result.calendarName;
    const template = result.customEventName || DEFAULT_EVENT_NAME_TEMPLATE;

    const summary = result.excludeEventName
      ? resolveEventNameTemplate(template, {
        calendar_name: calendarName,
        event_name: eventName,
      })
      : eventName;

    syncableEvents.push({
      calendarId: result.calendarId,
      calendarName: result.calendarName,
      calendarUrl: result.calendarUrl,
      description: result.excludeEventDescription ? undefined : result.description ?? undefined,
      endTime: result.endTime,
      id: result.id,
      location: result.excludeEventLocation ? undefined : result.location ?? undefined,
      exceptionDates: parsedExceptionDates,
      recurrenceRule: parsedRecurrenceRule ?? undefined,
      sourceEventUid: result.sourceEventUid,
      startTime: result.startTime,
      startTimeZone: result.startTimeZone ?? undefined,
      summary,
    });
  }

  return syncableEvents;
};

const resolveEventNameTemplate = (
  template: string,
  variables: Record<string, string>,
): string => {
  const resolved = template.replace(
    TEMPLATE_TOKEN_PATTERN,
    (token, variableName) => variables[variableName] ?? token,
  ).trim();

  return resolved || variables.calendar_name || DEFAULT_EVENT_NAME;
};

const getEventsForDestination = async (
  database: BunSQLDatabase,
  destinationCalendarId: string,
): Promise<SyncableEvent[]> => {
  const sourceCalendarIds = await getMappedSourceCalendarIds(database, destinationCalendarId);

  if (sourceCalendarIds.length === EMPTY_SOURCES_COUNT) {
    return [];
  }

  return fetchEventsForCalendars(database, sourceCalendarIds);
};

export { getEventsForDestination };
