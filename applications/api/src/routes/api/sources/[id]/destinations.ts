import { calendarsTable } from "@keeper.sh/database/schema";
import { and, eq } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../../utils/middleware";
import { ErrorResponse } from "../../../../utils/responses";
import { database } from "../../../../context";
import {
  getDestinationsForSource,
  setDestinationsForSource,
} from "../../../../utils/source-destination-mappings";
import { calendarIdsBodySchema } from "../../../../utils/request-body";
import { idParamSchema } from "../../../../utils/request-query";

export const GET = withWideEvent(
  withAuth(async ({ params, userId }) => {
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("Source ID is required").toResponse();
    }
    const { id } = params;

    const [source] = await database
      .select({ id: calendarsTable.id })
      .from(calendarsTable)
      .where(and(eq(calendarsTable.id, id), eq(calendarsTable.userId, userId)))
      .limit(1);

    if (!source) {
      return ErrorResponse.notFound().toResponse();
    }

    const destinationIds = await getDestinationsForSource(id);
    return Response.json({ destinationIds });
  }),
);

export const PUT = withWideEvent(
  withAuth(async ({ request, params, userId }) => {
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("Source ID is required").toResponse();
    }
    const { id } = params;

    const payload = await request.json();
    if (!calendarIdsBodySchema.allows(payload)) {
      return ErrorResponse.badRequest("calendarIds array is required").toResponse();
    }

    await setDestinationsForSource(userId, id, payload.calendarIds);
    return Response.json({ success: true });
  }),
);
