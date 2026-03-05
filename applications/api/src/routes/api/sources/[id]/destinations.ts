import { calendarsTable } from "@keeper.sh/database/schema";
import { and, eq } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../../utils/middleware";
import { ErrorResponse } from "../../../../utils/responses";
import { database } from "../../../../context";
import {
  getDestinationsForSource,
  setDestinationsForSource,
} from "../../../../utils/source-destination-mappings";

export const GET = withWideEvent(
  withAuth(async ({ params, userId }) => {
    const { id } = params;

    if (!id) {
      return ErrorResponse.badRequest("Source ID is required").toResponse();
    }

    // Verify ownership
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
    const { id } = params;

    if (!id) {
      return ErrorResponse.badRequest("Source ID is required").toResponse();
    }

    const body = (await request.json()) as { calendarIds?: string[] };
    if (!Array.isArray(body.calendarIds)) {
      return ErrorResponse.badRequest("calendarIds array is required").toResponse();
    }

    await setDestinationsForSource(userId, id, body.calendarIds);
    return Response.json({ success: true });
  }),
);
