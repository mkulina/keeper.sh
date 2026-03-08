import { calendarsTable } from "@keeper.sh/database/schema";
import { and, eq } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../../utils/middleware";
import { database } from "../../../../context";
import {
  getSourcesForDestination,
  setSourcesForDestination,
} from "../../../../utils/source-destination-mappings";
import {
  handleGetSourcesForDestinationRoute,
  handlePutSourcesForDestinationRoute,
} from "./mapping-routes";

export const GET = withWideEvent(
  withAuth(async ({ params, userId }) => {
    return handleGetSourcesForDestinationRoute(
      { params, userId },
      {
        destinationExists: async (userIdToCheck, destinationCalendarId) => {
          const [destination] = await database
            .select({ id: calendarsTable.id })
            .from(calendarsTable)
            .where(
              and(
                eq(calendarsTable.id, destinationCalendarId),
                eq(calendarsTable.userId, userIdToCheck),
              ),
            )
            .limit(1);

          return Boolean(destination);
        },
        getSourcesForDestination,
      },
    );
  }),
);

export const PUT = withWideEvent(
  withAuth(async ({ request, params, userId }) => {
    const payload = await request.json();
    return handlePutSourcesForDestinationRoute(
      { body: payload, params, userId },
      { setSourcesForDestination },
    );
  }),
);
