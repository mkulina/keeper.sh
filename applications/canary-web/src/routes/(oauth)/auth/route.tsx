import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasSessionCookie } from "../../../lib/session-cookie";
import { resolveAuthRedirect } from "../../../lib/route-access-guards";

export const Route = createFileRoute("/(oauth)/auth")({
  beforeLoad: () => {
    const redirectTarget = resolveAuthRedirect(hasSessionCookie());
    if (redirectTarget) {
      throw redirect({ to: redirectTarget });
    }
  },
  component: OAuthAuthLayout,
});

function OAuthAuthLayout() {
  return <Outlet />;
}
