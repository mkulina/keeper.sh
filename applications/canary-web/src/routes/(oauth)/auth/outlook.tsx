import { createFileRoute } from "@tanstack/react-router";
import { OAuthPreamble } from "../../../components/auth/oauth-preamble";

export const Route = createFileRoute("/(oauth)/auth/outlook")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OAuthPreamble provider="outlook" backHref="/login" context="auth" />;
}
