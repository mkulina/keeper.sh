import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasSessionCookie } from "../../../lib/session-cookie";
import { resolveDashboardRedirect } from "../../../lib/route-access-guards";

export const Route = createFileRoute("/(oauth)/dashboard")({
  beforeLoad: () => {
    const redirectTarget = resolveDashboardRedirect(hasSessionCookie());
    if (redirectTarget) {
      throw redirect({ to: redirectTarget });
    }
  },
  component: OAuthDashboardLayout,
});

function OAuthDashboardLayout() {
  return <Outlet />;
}
