import { createFileRoute } from "@tanstack/react-router";
import { OAuthPreamble } from "../../../components/auth/oauth-preamble";

export const Route = createFileRoute("/(oauth)/auth/google")({
  component: RouteComponent,
});

function RouteComponent() {
  return <OAuthPreamble provider="google" backHref="/login" context="auth" />;
}
