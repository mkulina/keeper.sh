import { createFileRoute } from "@tanstack/react-router";
import { OAuthPreamble } from "../../../../components/auth/oauth-preamble";

export const Route = createFileRoute(
  "/(oauth)/dashboard/connect/microsoft",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <OAuthPreamble provider="microsoft-365" backHref="/dashboard/connect" context="link" />
    </div>
  );
}
