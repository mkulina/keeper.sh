import { withAuth, withWideEvent } from "../../../utils/middleware";
import { getProfileCount } from "../../../utils/sync-profiles";

export const GET = withWideEvent(
  withAuth(async ({ userId }) => {
    const count = await getProfileCount(userId);
    return Response.json({ count });
  }),
);
