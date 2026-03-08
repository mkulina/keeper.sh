import { calendarAccountsTable, calendarsTable } from "@keeper.sh/database/schema";
import { and, eq } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../utils/middleware";
import { ErrorResponse } from "../../../utils/responses";
import { database } from "../../../context";
import { deleteSource as deleteIcsSource } from "../../../utils/sources";
import { deleteOAuthSource } from "../../../utils/oauth-sources";
import { deleteCalDAVSource } from "../../../utils/caldav-sources";
import { triggerDestinationSync } from "../../../utils/sync";
import { idParamSchema } from "../../../utils/request-query";
import {
  getDestinationsForSource,
  getSourcesForDestination,
} from "../../../utils/source-destination-mappings";
import { WideEvent } from "@keeper.sh/log";
import { handleDeleteSourceRoute, handlePatchSourceRoute } from "./[id]/source-item-routes";

const GET = withWideEvent(
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

const PATCH = withWideEvent(
  withAuth(async ({ request, params, userId }) => {
    const payload = await request.json();
    return handlePatchSourceRoute(
      { body: payload, params, userId },
      {
        reportError: (error) => {
          WideEvent.error(error);
        },
        triggerDestinationSync,
        updateSource: async (userIdToUpdate, sourceCalendarId, updates) => {
          const [updated] = await database
            .update(calendarsTable)
            .set(updates)
            .where(
              and(
                eq(calendarsTable.id, sourceCalendarId),
                eq(calendarsTable.userId, userIdToUpdate),
              ),
            )
            .returning();

          return updated ?? null;
        },
      },
    );
  }),
);

const calendarTypeDeleters: Record<string, (userId: string, calendarId: string) => Promise<boolean>> = {
  ical: deleteIcsSource,
  oauth: deleteOAuthSource,
  caldav: deleteCalDAVSource,
};

const DELETE = withWideEvent(
  withAuth(({ params, userId }) => handleDeleteSourceRoute(
      { params, userId },
      {
        deleteSourceByType: calendarTypeDeleters,
        getSourceCalendarType: async (userIdToFind, sourceCalendarId) => {
          const [source] = await database
            .select({ calendarType: calendarsTable.calendarType })
            .from(calendarsTable)
            .where(
              and(
                eq(calendarsTable.id, sourceCalendarId),
                eq(calendarsTable.userId, userIdToFind),
              ),
            )
            .limit(1);

          return source?.calendarType ?? null;
        },
      },
    )),
);

export { GET, PATCH, DELETE };
