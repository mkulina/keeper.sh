import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { hasSessionCookie } from "../../lib/session-cookie";
import { resolveAuthRedirect } from "../../lib/route-access-guards";

export const Route = createFileRoute("/(auth)")({
  beforeLoad: () => {
    const redirectTarget = resolveAuthRedirect(hasSessionCookie());
    if (redirectTarget) {
      throw redirect({ to: redirectTarget });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-2">
      <div className="flex flex-col gap-2 w-full max-w-xs">
        <Outlet />
      </div>
    </div>
  );
}
