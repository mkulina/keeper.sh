import { calendarAccountsTable, calendarsTable, sourceDestinationMappingsTable } from "@keeper.sh/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { withAuth, withWideEvent } from "../../../utils/middleware";
import { ErrorResponse } from "../../../utils/responses";
import { getAuthorizationUrl, isOAuthProvider } from "../../../utils/destinations";
import { destinationAuthorizeQuerySchema } from "../../../utils/request-query";
import { baseUrl, database, premiumService } from "../../../context";

const FIRST_RESULT_LIMIT = 1;

const userOwnsDestination = async (userId: string, accountId: string): Promise<boolean> => {
  const [account] = await database
    .select({ id: calendarAccountsTable.id })
    .from(calendarAccountsTable)
    .where(
      and(
        eq(calendarAccountsTable.id, accountId),
        eq(calendarAccountsTable.userId, userId),
      ),
    )
    .limit(FIRST_RESULT_LIMIT);

  return Boolean(account);
};

const countUserDestinations = async (userId: string): Promise<number> => {
  const destinations = await database
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

  return destinations.length;
};

const GET = withWideEvent(
  withAuth(async ({ request, userId }) => {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const provider = url.searchParams.get("provider");
    const destinationId = url.searchParams.get("destinationId") ?? undefined;

    if (
      !destinationAuthorizeQuerySchema.allows(query)
      || !provider
      || !isOAuthProvider(provider)
    ) {
      return ErrorResponse.badRequest("Unsupported provider").toResponse();
    }

    if (destinationId) {
      const ownsDestination = await userOwnsDestination(userId, destinationId);
      if (!ownsDestination) {
        return ErrorResponse.notFound("Destination not found").toResponse();
      }
    } else {
      const destinationCount = await countUserDestinations(userId);
      const allowed = await premiumService.canAddDestination(userId, destinationCount);

      if (!allowed) {
        const errorUrl = new URL("/dashboard/integrations", baseUrl);
        errorUrl.searchParams.set(
          "error",
          "Destination limit reached. Upgrade to Pro for unlimited destinations.",
        );
        return Response.redirect(errorUrl.toString());
      }
    }

    const callbackUrl = new URL(`/api/destinations/callback/${provider}`, baseUrl);
    const authorizationOptions = {
      callbackUrl: callbackUrl.toString(),
      ...(destinationId && { destinationId }),
    };
    const authUrl = getAuthorizationUrl(provider, userId, authorizationOptions);

    return Response.redirect(authUrl);
  }),
);

export { GET };
