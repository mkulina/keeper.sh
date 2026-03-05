import { calendarAccountsTable, calendarsTable } from "@keeper.sh/database/schema";
import { and, eq } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../utils/middleware";
import { ErrorResponse } from "../../../utils/responses";
import { database } from "../../../context";
import { deleteSource as deleteIcsSource } from "../../../utils/sources";
import { deleteOAuthSource } from "../../../utils/oauth-sources";
import { deleteCalDAVSource } from "../../../utils/caldav-sources";
import {
  getDestinationsForSource,
  getSourcesForDestination,
} from "../../../utils/source-destination-mappings";

export const GET = withWideEvent(
  withAuth(async ({ params, userId }) => {
    const { id } = params;

    if (!id) {
      return ErrorResponse.badRequest("ID is required").toResponse();
    }

    const [source] = await database
      .select({
        id: calendarsTable.id,
        name: calendarsTable.name,
        calendarType: calendarsTable.calendarType,
        capabilities: calendarsTable.capabilities,
        provider: calendarAccountsTable.provider,
        url: calendarsTable.url,
        calendarUrl: calendarsTable.calendarUrl,
        excludeAllDayEvents: calendarsTable.excludeAllDayEvents,
        excludeEventDescription: calendarsTable.excludeEventDescription,
        excludeEventLocation: calendarsTable.excludeEventLocation,
        excludeEventName: calendarsTable.excludeEventName,
        excludeFocusTime: calendarsTable.excludeFocusTime,
        excludeOutOfOffice: calendarsTable.excludeOutOfOffice,
        excludeWorkingLocation: calendarsTable.excludeWorkingLocation,
        createdAt: calendarsTable.createdAt,
        updatedAt: calendarsTable.updatedAt,
      })
      .from(calendarsTable)
      .innerJoin(calendarAccountsTable, eq(calendarsTable.accountId, calendarAccountsTable.id))
      .where(
        and(
          eq(calendarsTable.id, id),
          eq(calendarsTable.userId, userId),
        ),
      )
      .limit(1);

    if (!source) {
      return ErrorResponse.notFound().toResponse();
    }

    const [destinationIds, sourceIds] = await Promise.all([
      getDestinationsForSource(id),
      getSourcesForDestination(id),
    ]);

    return Response.json({ ...source, destinationIds, sourceIds });
  }),
);

export const PATCH = withWideEvent(
  withAuth(async ({ request, params, userId }) => {
    const { id } = params;

    if (!id) {
      return ErrorResponse.badRequest("ID is required").toResponse();
    }

    const body = (await request.json()) as {
      name?: string;
      excludeAllDayEvents?: boolean;
      excludeEventDescription?: boolean;
      excludeEventLocation?: boolean;
      excludeEventName?: boolean;
      excludeFocusTime?: boolean;
      excludeOutOfOffice?: boolean;
      excludeWorkingLocation?: boolean;
    };

    const booleanFields = [
      "excludeAllDayEvents",
      "excludeEventDescription",
      "excludeEventLocation",
      "excludeEventName",
      "excludeFocusTime",
      "excludeOutOfOffice",
      "excludeWorkingLocation",
    ] as const;

    const updates: Record<string, string | boolean> = {};
    if (body.name && typeof body.name === "string") updates.name = body.name;
    for (const field of booleanFields) {
      if (typeof body[field] === "boolean") updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return ErrorResponse.badRequest("No valid fields to update").toResponse();
    }

    const [updated] = await database
      .update(calendarsTable)
      .set(updates)
      .where(
        and(
          eq(calendarsTable.id, id),
          eq(calendarsTable.userId, userId),
        ),
      )
      .returning();

    if (!updated) {
      return ErrorResponse.notFound().toResponse();
    }

    return Response.json(updated);
  }),
);

const calendarTypeDeleters: Record<string, (userId: string, calendarId: string) => Promise<boolean>> = {
  ical: deleteIcsSource,
  oauth: deleteOAuthSource,
  caldav: deleteCalDAVSource,
};

export const DELETE = withWideEvent(
  withAuth(async ({ params, userId }) => {
    const { id } = params;

    if (!id) {
      return ErrorResponse.badRequest("ID is required").toResponse();
    }

    const [source] = await database
      .select({ calendarType: calendarsTable.calendarType })
      .from(calendarsTable)
      .where(
        and(
          eq(calendarsTable.id, id),
          eq(calendarsTable.userId, userId),
        ),
      )
      .limit(1);

    if (!source) {
      return ErrorResponse.notFound().toResponse();
    }

    const deleter = calendarTypeDeleters[source.calendarType];

    if (!deleter) {
      return ErrorResponse.badRequest("Unknown source type").toResponse();
    }

    await deleter(userId, id);

    return Response.json({ success: true });
  }),
);
