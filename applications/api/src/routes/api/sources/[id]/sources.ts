import { calendarsTable } from "@keeper.sh/database/schema";
import { and, eq } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../../utils/middleware";
import { ErrorResponse } from "../../../../utils/responses";
import { database } from "../../../../context";
import {
  getSourcesForDestination,
  setSourcesForDestination,
} from "../../../../utils/source-destination-mappings";
import { calendarIdsBodySchema } from "../../../../utils/request-body";
import { idParamSchema } from "../../../../utils/request-query";

export const GET = withWideEvent(
  withAuth(async ({ params, userId }) => {
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("Destination ID is required").toResponse();
    }
    const { id } = params;

    const [calendar] = await database
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(and(eq(calendarsTable.id, id), eq(calendarsTable.userId, userId)))
      .limit(1);

    if (!calendar) {
      return ErrorResponse.notFound().toResponse();
    }

    const sourceIds = await getSourcesForDestination(id);
    return Response.json({ sourceIds });
  }),
);

export const PUT = withWideEvent(
  withAuth(async ({ request, params, userId }) => {
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("Destination ID is required").toResponse();
    }
    const { id } = params;

    const payload = await request.json();
    if (!calendarIdsBodySchema.allows(payload)) {
      return ErrorResponse.badRequest("calendarIds array is required").toResponse();
    }

    await setSourcesForDestination(userId, id, payload.calendarIds);
    return Response.json({ success: true });
  }),
);
