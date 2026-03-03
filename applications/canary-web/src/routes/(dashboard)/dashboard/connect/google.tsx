import { createFileRoute } from "@tanstack/react-router";
import { OAuthPreamble } from "../../../../components/auth/oauth-preamble";

export const Route = createFileRoute("/(dashboard)/dashboard/connect/google")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs self-center">
      <OAuthPreamble provider="google" backHref="/dashboard/connect" />
    </div>
  );
}
