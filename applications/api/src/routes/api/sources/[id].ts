import { calendarAccountsTable, calendarsTable } from "@keeper.sh/database/schema";
import { and, eq } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../utils/middleware";
import { ErrorResponse } from "../../../utils/responses";
import { database } from "../../../context";
import { deleteSource as deleteIcsSource } from "../../../utils/sources";
import { deleteOAuthSource } from "../../../utils/oauth-sources";
import { deleteCalDAVSource } from "../../../utils/caldav-sources";
import { triggerDestinationSync } from "../../../utils/sync";
import { sourcePatchBodySchema, type SourcePatchBody } from "../../../utils/request-body";
import { idParamSchema } from "../../../utils/request-query";
import {
  getDestinationsForSource,
  getSourcesForDestination,
} from "../../../utils/source-destination-mappings";

const SOURCE_BOOLEAN_UPDATE_FIELDS = [
  "excludeAllDayEvents",
  "excludeEventDescription",
  "excludeEventLocation",
  "excludeEventName",
  "excludeFocusTime",
  "excludeOutOfOffice",
  "excludeWorkingLocation",
  "includeInIcalFeed",
] as const;

const buildSourceUpdates = (
  body: SourcePatchBody,
): Record<string, string | boolean> => {
  const updates: Record<string, string | boolean> = {};

  if (body.name) {
    updates.name = body.name;
  }
  if (typeof body.customEventName === "string") {
    updates.customEventName = body.customEventName;
  }

  for (const field of SOURCE_BOOLEAN_UPDATE_FIELDS) {
    if (typeof body[field] === "boolean") {
      updates[field] = body[field];
    }
  }

  return updates;
};

export const GET = withWideEvent(
  withAuth(async ({ params, userId }) => {
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("ID is required").toResponse();
    }
    const { id } = params;

    const [source] = await database
      .select({
        id: calendarsTable.id,
        name: calendarsTable.name,
        calendarType: calendarsTable.calendarType,
        capabilities: calendarsTable.capabilities,
        provider: calendarAccountsTable.provider,
        url: calendarsTable.url,
        calendarUrl: calendarsTable.calendarUrl,
        customEventName: calendarsTable.customEventName,
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
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("ID is required").toResponse();
    }
    const { id } = params;

    const payload = await request.json();
    const body = sourcePatchBodySchema.allows(payload) ? payload : {};
    const updates = buildSourceUpdates(body);

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

    triggerDestinationSync(userId);

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
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("ID is required").toResponse();
    }
    const { id } = params;

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
