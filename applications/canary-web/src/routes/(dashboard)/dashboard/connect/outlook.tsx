import { createFileRoute } from "@tanstack/react-router";
import { OAuthPreamble } from "../../../../components/auth/oauth-preamble";

export const Route = createFileRoute("/(dashboard)/dashboard/connect/outlook")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <OAuthPreamble provider="outlook" backHref="/dashboard/connect" />
    </div>
  );
}
