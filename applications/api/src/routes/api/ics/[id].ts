import { withAuth, withWideEvent } from "../../../utils/middleware";
import { ErrorResponse } from "../../../utils/responses";
import { deleteSource } from "../../../utils/sources";
import { idParamSchema } from "../../../utils/request-query";

export const DELETE = withWideEvent(
  withAuth(async ({ params, userId }) => {
    if (!params.id || !idParamSchema.allows(params)) {
      return ErrorResponse.badRequest("ID is required").toResponse();
    }
    const { id } = params;

    const deleted = await deleteSource(userId, id);

    if (!deleted) {
      return ErrorResponse.notFound().toResponse();
    }

    return Response.json({ success: true });
  }),
);
