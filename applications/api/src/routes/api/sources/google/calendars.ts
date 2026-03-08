import { listUserCalendars, CalendarListError } from "@keeper.sh/provider-google-calendar";
import { withAuth, withWideEvent } from "../../../../utils/middleware";
import { listOAuthCalendars } from "../../../../utils/oauth-calendar-listing";
import {
  refreshGoogleAccessToken,
  refreshGoogleSourceAccessToken,
} from "../../../../utils/oauth-refresh";

const GOOGLE_PROVIDER = "google";

export const GET = withWideEvent(
  withAuth(async ({ request, userId }) =>
    listOAuthCalendars(request, userId, {
      isCalendarListError: (error): error is CalendarListError =>
        error instanceof CalendarListError,
      listCalendars: listUserCalendars,
      normalizeCalendars: (calendars) => calendars,
      provider: GOOGLE_PROVIDER,
      refreshDestinationAccessToken: refreshGoogleAccessToken,
      refreshSourceAccessToken: refreshGoogleSourceAccessToken,
    }),
  ),
);
