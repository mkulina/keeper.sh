import { withAuth, withWideEvent } from "../../../utils/middleware";
import { ErrorResponse } from "../../../utils/responses";
import { ensureDefaultProfile, getUserProfiles, createProfile } from "../../../utils/sync-profiles";

export const GET = withWideEvent(
  withAuth(async ({ userId }) => {
    await ensureDefaultProfile(userId);
    const profiles = await getUserProfiles(userId);
    return Response.json(profiles);
  }),
);

export const POST = withWideEvent(
  withAuth(async ({ request, userId }) => {
    const body = (await request.json()) as { name?: string };

    if (!body.name || typeof body.name !== "string") {
      return ErrorResponse.badRequest("Name is required").toResponse();
    }

    const profile = await createProfile(userId, body.name);
    return Response.json(profile, { status: 201 });
  }),
);
